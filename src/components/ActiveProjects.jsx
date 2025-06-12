import React, { useEffect, useState } from 'react';

const ActiveProjects = ({ onProjectUpdateTrigger }) => {
  const [latestProject, setLatestProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchLatestActivatedProject();
  }, [refreshKey]);

  useEffect(() => {
    if (onProjectUpdateTrigger) {
      onProjectUpdateTrigger(() => {
        setRefreshKey(prev => prev + 1);
      });
    }
  }, [onProjectUpdateTrigger]);

  const fetchLatestActivatedProject = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/assign-project/');
      const data = await response.json();
      
      console.log("API Response:", data);
      
      if (data.active_projects) {
        const projectsArray = Object.entries(data.active_projects).map(([projectName, projectData]) => {
          const allMembers = [
            ...(projectData.data_collectors || []).map(member => ({ ...member, role: 'mobilizer' })),
            ...(projectData.supervisors || []).map(member => ({ ...member, role: 'supervisor' }))
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
            totalCollectors: projectData.project_info.total_collectors,
            totalSupervisors: projectData.project_info.total_supervisors,
            members: allMembers,
            memberCount: allMembers.length,
            dataCollectors: projectData.data_collectors || [],
            supervisors: projectData.supervisors || []
          };
        });

        const latestActivatedProject = findLatestActivatedProject(projectsArray);
        
        console.log("Latest Activated Project:", latestActivatedProject);
        setLatestProject(latestActivatedProject);
      } else {
        console.error("Unexpected response format", data);
        setLatestProject(null);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLatestProject(null);
    } finally {
      setLoading(false);
    }
  };

  const findLatestActivatedProject = (projects) => {
    if (!projects || projects.length === 0) return null;

    // Filter projects that are likely "activated" (have start dates and are active/upcoming)
    const activatedProjects = projects.filter(project => {
      const hasStartDate = project.startDate && project.startDate !== null;
      const isActiveStatus = ['active', 'upcoming'].includes(project.status?.toLowerCase());
      const hasAssignedMembers = project.members.length > 0;
      
      return hasStartDate && (isActiveStatus || hasAssignedMembers);
    });

    if (activatedProjects.length === 0) {
      // If no projects with start dates, return the project with the most assigned members
      return projects.reduce((latest, current) => {
        if (current.members.length > latest.members.length) {
          return current;
        }
        if (current.members.length === latest.members.length && 
            current.status?.toLowerCase() === 'active') {
          return current;
        }
        return latest;
      });
    }

    const sortedProjects = activatedProjects.sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      
      if (dateB.getTime() !== dateA.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }

      if (b.members.length !== a.members.length) {
        return b.members.length - a.members.length;
      }
      
      if (a.status?.toLowerCase() === 'active' && b.status?.toLowerCase() !== 'active') {
        return -1;
      }
      if (b.status?.toLowerCase() === 'active' && a.status?.toLowerCase() !== 'active') {
        return 1;
      }
      
      return 0;
    });

    return sortedProjects[0];
  };



  const toggleVisibility = () => setVisible(!visible);

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

  const getProjectActivationInfo = (project) => {
    if (project.startDate) {
      const startDate = new Date(project.startDate);
      const today = new Date();
      const diffTime = startDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return `Started ${Math.abs(diffDays)} days ago`;
      } else if (diffDays === 0) {
        return "Starting today";
      } else {
        return `Starting in ${diffDays} days`;
      }
    }
    return "Start date not set";
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📋 Latest Activated Project</h2>
        <div className="flex gap-2">
          <button
            className="bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <button
            className="bg-gray-200 text-sm font-medium px-3 py-1 rounded hover:bg-gray-300"
            onClick={toggleVisibility}
          >
            {visible ? 'Hide Project' : 'Show Project'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-500">Loading latest activated project...</span>
        </div>
      ) : !visible ? (
        <div className="text-sm text-gray-500 italic">Project details hidden.</div>
      ) : !latestProject ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-2">📋</div>
          <div className="text-sm text-gray-500">No activated projects found.</div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Latest Activation:</strong> {getProjectActivationInfo(latestProject)} • 
              <strong> Team Size:</strong> {latestProject.memberCount} members
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm border-l-4 border-l-green-500">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{latestProject.name}</h3>
              <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${formatStatus(latestProject.status)}`}>
                {latestProject.status}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex">
                <span className="text-sm font-medium text-gray-600 w-32">Scrum Master:</span>
                <span className="text-sm text-gray-800">{latestProject.scrumMaster}</span>
              </div>

              <div className="flex">
                <span className="text-sm font-medium text-gray-600 w-32">Duration:</span>
                <span className="text-sm text-gray-800">{formatDuration(latestProject)}</span>
              </div>

              <div className="flex">
                <span className="text-sm font-medium text-gray-600 w-32">Requirements:</span>
                <span className="text-sm text-gray-800">
                  {latestProject.numCollectorsNeeded} Collectors, {latestProject.numSupervisorsNeeded} Supervisors
                </span>
              </div>

              <div className="flex">
                <span className="text-sm font-medium text-gray-600 w-32">Assigned Personnel:</span>
                <span className="text-sm text-gray-800">
                  {latestProject.totalCollectors} Mobilizers, {latestProject.totalSupervisors} Supervisors
                </span>
              </div>

              {getMembersByRole(latestProject.members, 'mobilizer').length > 0 && (
                <div className="flex flex-wrap items-start gap-2">
                  <span className="text-sm font-medium text-gray-600 w-32 flex-shrink-0">Mobilizers:</span>
                  <div className="flex flex-wrap gap-2">
                    {getMembersByRole(latestProject.members, 'mobilizer').map((mobilizer, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                        {mobilizer.name}
                        {mobilizer.performance_score && (
                          <span className="ml-1 text-blue-600">({mobilizer.performance_score})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {getMembersByRole(latestProject.members, 'supervisor').length > 0 && (
                <div className="flex flex-wrap items-start gap-2">
                  <span className="text-sm font-medium text-gray-600 w-32 flex-shrink-0">Supervisors:</span>
                  <div className="flex flex-wrap gap-2">
                    {getMembersByRole(latestProject.members, 'supervisor').map((supervisor, index) => (
                      <span key={index} className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                        {supervisor.name}
                        {supervisor.performance_score && (
                          <span className="ml-1 text-green-600">({supervisor.performance_score})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {latestProject.members.length > 0 && (
                <div className="flex flex-wrap items-start gap-2">
                  <span className="text-sm font-medium text-gray-600 w-32 flex-shrink-0">Team Status:</span>
                  <div className="flex flex-wrap gap-2">
                    {latestProject.members.map((member, index) => (
                      <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                        {member.name}: {member.previous_status || 'available'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
              >
                End Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveProjects;