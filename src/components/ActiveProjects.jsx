import React, { useEffect, useState } from 'react';

const ActiveProjects = ({ onProjectUpdateTrigger }) => {
  const [latestProject, setLatestProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchLatestProject();
  }, [refreshKey]);

  useEffect(() => {
    if (onProjectUpdateTrigger) {
      onProjectUpdateTrigger(() => {
        setRefreshKey(prev => prev + 1);
      });
    }
  }, [onProjectUpdateTrigger]);

  const fetchLatestProject = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/assign-project/');
      const data = await response.json();
      
      console.log("API Response:", data);
      
      if (data.project_details) {
        const allMembers = [
          ...(data.assigned_collectors || []),
          ...(data.assigned_supervisors || [])
        ];

        const formattedProject = {
          id: 1,
          name: data.project_details.name,
          scrumMaster: data.project_details.scrum_master,
          startDate: data.project_details.start_date,
          endDate: data.project_details.end_date,
          durationDays: data.project_details.duration_days,
          status: data.project_details.status,
          numCollectorsNeeded: data.project_details.num_collectors_needed,
          numSupervisorsNeeded: data.project_details.num_supervisors_needed,
          members: allMembers,
          memberCount: allMembers.length,
          message: data.message
        };

        console.log("Formatted Project:", formattedProject);
        setLatestProject(formattedProject);
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

  const handleEndProject = async (projectName) => {
    const confirmEnd = window.confirm(
      `Are you sure you want to end the project "${projectName}"?\n\nThis will:\n- Remove all members from the project\n- Set their status to "available"\n- Delete the project from the database\n\nThis action cannot be undone.`
    );

    if (!confirmEnd) return;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/end-project/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName })
      });

      const result = await response.json();
      if (response.ok) {
        alert(`✅ Project "${projectName}" ended.\n${result.message || 'Members are now available.'}`);
        setRefreshKey(prev => prev + 1);
      } else {
        alert(`❌ Failed to end project: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert('❌ Network error occurred while ending the project.');
    }
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
      'on-hold': 'bg-yellow-100 text-yellow-800'
    };
    
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📋 Latest Project Assignment</h2>
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
          <span className="ml-2 text-gray-500">Loading latest project...</span>
        </div>
      ) : !visible ? (
        <div className="text-sm text-gray-500 italic">Project details hidden.</div>
      ) : !latestProject ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-2">📋</div>
          <div className="text-sm text-gray-500">No project data available.</div>
        </div>
      ) : (
        <div className="mb-6">
          {latestProject.message && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{latestProject.message}</p>
            </div>
          )}

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
                  {getMembersByRole(latestProject.members, 'mobilizer').length} Mobilizers, {getMembersByRole(latestProject.members, 'supervisor').length} Supervisors
                </span>
              </div>

              {/* Mobilizers */}
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

              {/* Supervisors */}
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

              {/* All Members with Previous Status */}
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
                onClick={() => handleEndProject(latestProject.name)}
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