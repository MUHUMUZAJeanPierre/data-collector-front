import React, { useEffect, useState } from 'react';

const ActiveProjectsManager = ({ onProjectUpdateTrigger }) => {
  const [activeProjects, setActiveProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingProject, setDeletingProject] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchAllData();
  }, [refreshKey]);

  useEffect(() => {
    if (onProjectUpdateTrigger) {
      onProjectUpdateTrigger(() => {
        setRefreshKey(prev => prev + 1);
      });
    }
  }, [onProjectUpdateTrigger]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch both projects and team members data simultaneously
      const [projectsResponse, teamMembersResponse] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/assign-project/'),
        fetch('http://127.0.0.1:8000/api/teammembers/')
      ]);

      const projectsData = await projectsResponse.json();
      const teamMembersData = await teamMembersResponse.json();
      
      console.log("Projects API Response:", projectsData);
      console.log("Team Members API Response:", teamMembersData);
      
      // Store team members data
      setTeamMembers(teamMembersData.data || []);
      
      if (projectsData.active_projects) {
        const projectsArray = Object.entries(projectsData.active_projects).map(([projectName, projectData]) => {
          // Get data collectors assigned to this project from teammembers API
          const assignedDataCollectors = (teamMembersData.data || []).filter(member => 
            member.assigned_projects && 
            member.assigned_projects.includes(projectName) &&
            member.role?.toLowerCase() === 'mobilizer'
          ).map(member => ({
            ...member,
            role: 'mobilizer'
          }));

          // Get supervisors from both APIs
          const supervisorsFromProjects = (projectData.supervisors || []).map(member => ({ 
            ...member, 
            role: 'supervisor' 
          }));
          
          const supervisorsFromTeamMembers = (teamMembersData.data || []).filter(member => 
            member.assigned_projects && 
            member.assigned_projects.includes(projectName) &&
            member.role?.toLowerCase() === 'supervisor'
          ).map(member => ({
            ...member,
            role: 'supervisor'
          }));

          // Combine all members, avoiding duplicates
          const allMembers = [
            ...assignedDataCollectors,
            ...supervisorsFromProjects,
            ...supervisorsFromTeamMembers.filter(sup => 
              !supervisorsFromProjects.some(existing => existing.name === sup.name)
            )
          ];

          return {
            id: projectName,
            name: projectData.project_info.name,
            scrumMaster: projectData.project_info.scrum_master,
            startDate: projectData.project_info.start_date,
            endDate: projectData.project_info.end_date,
            durationDays: projectData.project_info.duration_days,
            status: projectData.project_info.status,
            numCollectorsNeeded: projectData.project_info.collectors_needed,
            numSupervisorsNeeded: projectData.project_info.supervisors_needed,
            totalCollectors: assignedDataCollectors.length,
            totalSupervisors: supervisorsFromProjects.length + supervisorsFromTeamMembers.filter(sup => 
              !supervisorsFromProjects.some(existing => existing.name === sup.name)
            ).length,
            members: allMembers,
            memberCount: allMembers.length,
            dataCollectors: assignedDataCollectors,
            supervisors: [...supervisorsFromProjects, ...supervisorsFromTeamMembers.filter(sup => 
              !supervisorsFromProjects.some(existing => existing.name === sup.name)
            )]
          };
        });

        // Filter only active projects
        const activeProjectsList = projectsArray.filter(project => 
          project.status?.toLowerCase() === 'active'
        );
        
        console.log("Active Projects with Team Members:", activeProjectsList);
        setActiveProjects(activeProjectsList);
      } else {
        console.error("Unexpected response format", projectsData);
        setActiveProjects([]);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setActiveProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEndProject = async (projectId, projectName) => {
    const project = activeProjects.find(p => p.id === projectId);
    const memberCount = project ? project.memberCount : 0;
    
    if (!window.confirm(
      `Are you sure you want to end project "${projectName}"?\n\n` +
      `This will:\n` +
      `• Delete the project\n` +
      `• Unassign ${memberCount} team member${memberCount !== 1 ? 's' : ''}\n` +
      `• Remove all data collectors and supervisors from this project`
    )) {
      return;
    }

    setDeletingProject(projectId);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/assign-project/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: projectName
        })
      });

      if (response.ok) {
        // Refresh the projects list
        setRefreshKey(prev => prev + 1);
        alert(`Project "${projectName}" has been successfully ended and all ${memberCount} assigned team members have been unassigned.`);
      } else {
        const errorData = await response.json();
        console.error("Failed to delete project:", errorData);
        alert(`Failed to end project: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error ending project:", error);
      alert(`Error ending project: ${error.message}`);
    } finally {
      setDeletingProject(null);
    }
  };

  const getMembersByRole = (members, role) => {
    return members.filter(member => 
      member.role && member.role.toLowerCase() === role.toLowerCase()
    );
  };

  const formatDuration = (project) => {
    if (project.startDate && project.endDate) {
      return `${project.startDate} to ${project.endDate} (${project.durationDays} days)`;
    }
    return "Duration not specified";
  };

  const formatStatus = (status) => {
    const statusColors = {
      'active': 'bg-green-100 text-green-800',
      'upcoming': 'bg-blue-100 text-blue-800',
      'completed': 'bg-gray-100 text-gray-800',
      'on-hold': 'bg-yellow-100 text-yellow-800',
      'planning': 'bg-purple-100 text-purple-800'
    };
    
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getProjectTimingInfo = (project) => {
    if (project.startDate) {
      const startDate = new Date(project.startDate);
      const today = new Date();
      const diffTime = startDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return `Started ${Math.abs(diffDays)} days ago`;
      } else if (diffDays === 0) {
        return "Started today";
      } else {
        return `Starting in ${diffDays} days`;
      }
    }
    return "Start date not set";
  };

  const getTotalAssignedMembers = () => {
    return activeProjects.reduce((total, project) => total + project.memberCount, 0);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🚀 Active Projects</h2>
          <p className="text-sm text-gray-600 mt-1">
            {activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''} • {getTotalAssignedMembers()} total team members assigned
          </p>
        </div>
        <button
          className="bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          onClick={() => setRefreshKey(prev => prev + 1)}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Loading...
            </>
          ) : (
            <>
              🔄 Refresh
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-500">Loading active projects and team members...</span>
        </div>
      ) : activeProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">📋</div>
          <div className="text-lg font-medium text-gray-600 mb-2">No Active Projects</div>
          <div className="text-sm text-gray-500">There are currently no active projects running.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeProjects.map((project) => (
            <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm border-l-4 border-l-green-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{getProjectTimingInfo(project)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${formatStatus(project.status)}`}>
                    {project.status}
                  </span>
                  {project.memberCount > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      {project.memberCount} Team Members
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-3">
                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-32">Scrum Master:</span>
                    <span className="text-sm text-gray-800">{project.scrumMaster}</span>
                  </div>

                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-32">Duration:</span>
                    <span className="text-sm text-gray-800">{formatDuration(project)}</span>
                  </div>

                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-32">Requirements:</span>
                    <span className="text-sm text-gray-800">
                      {project.numCollectorsNeeded} Collectors, {project.numSupervisorsNeeded} Supervisors
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-32">Assigned:</span>
                    <span className="text-sm text-gray-800">
                      {project.totalCollectors} Mobilizers, {project.totalSupervisors} Supervisors
                    </span>
                  </div>

                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-32">Progress:</span>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{
                            width: `${Math.min(100, ((project.totalCollectors + project.totalSupervisors) / (project.numCollectorsNeeded + project.numSupervisorsNeeded)) * 100)}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {project.totalCollectors + project.totalSupervisors} / {project.numCollectorsNeeded + project.numSupervisorsNeeded} positions filled
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              {project.members.length > 0 && (
                <div className="mb-4 space-y-3">
                  {getMembersByRole(project.members, 'mobilizer').length > 0 && (
                    <div className="flex flex-wrap items-start gap-2">
                      <span className="text-sm font-medium text-gray-600 w-32 flex-shrink-0">Data Collectors:</span>
                      <div className="flex flex-wrap gap-2">
                        {getMembersByRole(project.members, 'mobilizer').map((mobilizer, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                            {mobilizer.name}
                            {mobilizer.ve_code && (
                              <span className="ml-1 text-blue-600">({mobilizer.ve_code})</span>
                            )}
                            {mobilizer.performance_score && (
                              <span className="ml-1 text-blue-600">- Score: {mobilizer.performance_score}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {getMembersByRole(project.members, 'supervisor').length > 0 && (
                    <div className="flex flex-wrap items-start gap-2">
                      <span className="text-sm font-medium text-gray-600 w-32 flex-shrink-0">Supervisors:</span>
                      <div className="flex flex-wrap gap-2">
                        {getMembersByRole(project.members, 'supervisor').map((supervisor, index) => (
                          <span key={index} className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                            {supervisor.name}
                            {supervisor.ve_code && (
                              <span className="ml-1 text-green-600">({supervisor.ve_code})</span>
                            )}
                            {supervisor.performance_score && (
                              <span className="ml-1 text-green-600">- Score: {supervisor.performance_score}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team Member Details */}
                  {project.members.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Team Overview:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="font-medium">Experience Levels:</span>
                          <div className="ml-2">
                            {Object.entries(
                              project.members.reduce((acc, member) => {
                                const level = member.experience_level || 'Unknown';
                                acc[level] = (acc[level] || 0) + 1;
                                return acc;
                              }, {})
                            ).map(([level, count]) => (
                              <div key={level} className="text-gray-600">
                                {level}: {count} member{count !== 1 ? 's' : ''}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Deployment Status:</span>
                          <div className="ml-2">
                            {Object.entries(
                              project.members.reduce((acc, member) => {
                                const status = member.status || 'Unknown';
                                acc[status] = (acc[status] || 0) + 1;
                                return acc;
                              }, {})
                            ).map(([status, count]) => (
                              <div key={status} className="text-gray-600">
                                {status}: {count} member{count !== 1 ? 's' : ''}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* No team members assigned */}
              {project.members.length === 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No team members assigned to this project yet.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  onClick={() => handleEndProject(project.id, project.name)}
                  disabled={deletingProject === project.id}
                >
                  {deletingProject === project.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Ending...
                    </>
                  ) : (
                    <>
                      🛑 End Project
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveProjectsManager;