import React, { useEffect, useState } from 'react';

const ProjectDetailPage = ({ projectId, onBack }) => {
  const [project, setProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingRatings, setSubmittingRatings] = useState({});
  const [theid, settheId]= useState(null)

  console.log(theid)

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch project and team members data
      const [projectsResponse, teamMembersResponse] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/assign-project/'),
        fetch('http://127.0.0.1:8000/api/teammembers/')
      ]);

      if (!projectsResponse.ok || !teamMembersResponse.ok) {
        throw new Error('Failed to fetch project data');
      }

      const projectsData = await projectsResponse.json();
      const teamMembersData = await teamMembersResponse.json();

      // Find the specific project
      if (projectsData.active_projects && projectsData.active_projects[projectId]) {
        const projectData = projectsData.active_projects[projectId];

        settheId(projectData.project_info.id)
        const allTeamMembers = teamMembersData.data || [];

        // Process project data
        const processedProject = processProjectData(projectId, projectData, allTeamMembers);
        setProject(processedProject);
        setTeamMembers(processedProject.members);

        // Fetch existing ratings for this project
        await fetchRatings(processedProject.members);
      } else {
        throw new Error('Project not found');
      }
    } catch (error) {
      console.error("Failed to fetch project details:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const processProjectData = (projectName, projectData, allTeamMembers) => {
    // Create a map of team members by name for easy lookup
    const teamMemberMap = new Map();
    allTeamMembers.forEach(member => {
      teamMemberMap.set(member.name?.trim(), member);
    });

    // Get data collectors from project data and match with full team member data
    const dataCollectorsFromProject = (projectData.data_collectors || []).map(member => {
      const fullMemberData = teamMemberMap.get(member.name?.trim());
      return {
        ...member,
        ...fullMemberData, // This will include the numeric ID
        role: 'data_collector',
        ve_code: member.ve_code || fullMemberData?.ve_code || 'N/A'
      };
    });

    // Get supervisors from project data and match with full team member data
    const supervisorsFromProject = (projectData.supervisors || []).map(member => {
      const fullMemberData = teamMemberMap.get(member.name?.trim());
      return {
        ...member,
        ...fullMemberData, // This will include the numeric ID
        role: 'supervisor',
        ve_code: member.ve_code || fullMemberData?.ve_code || 'N/A'
      };
    });

    // Get team members assigned to this project
    const assignedDataCollectors = allTeamMembers.filter(member => 
      member.assigned_projects && 
      member.assigned_projects.includes(projectName) &&
      member.role?.toLowerCase() === 'data_collector'
    );

    const assignedSupervisors = allTeamMembers.filter(member => 
      member.assigned_projects && 
      member.assigned_projects.includes(projectName) &&
      member.role?.toLowerCase() === 'supervisor'
    );

    // Combine all members, avoiding duplicates
    const allDataCollectors = [
      ...dataCollectorsFromProject,
      ...assignedDataCollectors.filter(assigned => 
        !dataCollectorsFromProject.some(existing => 
          existing.name?.trim() === assigned.name?.trim()
        )
      )
    ];

    const allSupervisors = [
      ...supervisorsFromProject,
      ...assignedSupervisors.filter(assigned => 
        !supervisorsFromProject.some(existing => 
          existing.name?.trim() === assigned.name?.trim()
        )
      )
    ];

    const allMembers = [...allDataCollectors, ...allSupervisors];

    return {
      id: projectName,
      name: projectData.project_info.name,
      scrumMaster: projectData.project_info.scrum_master || 'Not specified',
      startDate: projectData.project_info.start_date,
      endDate: projectData.project_info.end_date,
      durationDays: projectData.project_info.duration_days,
      status: projectData.project_info.status || 'Unknown',
      numCollectorsNeeded: projectData.project_info.collectors_needed || 0,
      numSupervisorsNeeded: projectData.project_info.supervisors_needed || 0,
      totalCollectors: allDataCollectors.length,
      totalSupervisors: allSupervisors.length,
      members: allMembers,
      memberCount: allMembers.length,
      dataCollectors: allDataCollectors,
      supervisors: allSupervisors
    };
  };

  const fetchRatings = async (members) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/rating/?project=${projectId}`);
      if (response.ok) {
        const ratingsData = await response.json();
        
        // Convert ratings array to object keyed by team member ID (numeric only)
        const ratingsMap = {};
        ratingsData.forEach(rating => {
          const memberId = rating.team_member_id; // ONLY use team_member_id field
          ratingsMap[memberId] = {
            rating: rating.rating,
            feedback: rating.feedback || ''
          };
        });
        
        setRatings(ratingsMap);
      }
    } catch (error) {
      console.error("Failed to fetch ratings:", error);
    }
  };

  const handleRatingChange = (memberId, field, value) => {
    setRatings(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value
      }
    }));
  };

  const submitRating = async (member) => {
    // ONLY use the numeric ID - no name fallbacks
    const memberId = member.id; // Always numeric ID only
    const ratingData = ratings[memberId];
    
    if (!ratingData || (!ratingData.rating && !ratingData.feedback)) {
      alert('Please provide at least a rating or feedback');
      return;
    }

    const requestBody = {
      team_member: memberId, 
      project: theid,
      rating: ratingData.rating || null,
      feedback: ratingData.feedback || ''
    };

    // Console log the request body
    console.log('Submitting rating with body:', requestBody);
    console.log('Member details:', member);
    console.log('Project ID:', projectId);

    setSubmittingRatings(prev => ({ ...prev, [memberId]: true }));

    try {
      const response = await fetch('http://127.0.0.1:8000/api/rating/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        alert(`✅ Rating submitted successfully for ${member.name}!`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error("Failed to submit rating:-----------------------", error);
     
    } finally {
      setSubmittingRatings(prev => ({ ...prev, [memberId]: false }));
    }
  };

  const StarRating = ({ rating, onRatingChange, disabled = false }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-2xl ${
              star <= (rating || 0) 
                ? 'text-yellow-400' 
                : 'text-gray-300'
            } ${disabled ? 'cursor-not-allowed' : 'hover:text-yellow-400 cursor-pointer'}`}
            onClick={() => !disabled && onRatingChange(star)}
            disabled={disabled}
          >
            ★
          </button>
        ))}
      </div>
    );
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

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-500">Loading project details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-2">❌</div>
          <div className="text-lg font-medium text-gray-600 mb-2">Error Loading Project</div>
          <div className="text-sm text-gray-500 mb-4">{error}</div>
          <button 
            onClick={onBack}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            ← Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">📂</div>
          <div className="text-lg font-medium text-gray-600 mb-2">Project Not Found</div>
          <div className="text-sm text-gray-500 mb-4">The requested project could not be found.</div>
          <button 
            onClick={onBack}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            ← Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow max-w-full">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-sm"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">📊 {project.name} - Rate Team</h1>
            <p className="text-xs text-gray-600">{project.memberCount} members • {project.durationDays} days</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${formatStatus(project.status)}`}>
          {project.status}
        </span>
      </div>

      {/* Compact Project Info */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div><span className="font-medium">Scrum Master:</span> {project.scrumMaster}</div>
          <div><span className="font-medium">Progress:</span> {((project.totalCollectors + project.totalSupervisors) / (project.numCollectorsNeeded + project.numSupervisorsNeeded) * 100).toFixed(0)}% staffed</div>
          <div><span className="font-medium">Data Collectors:</span> {project.totalCollectors}/{project.numCollectorsNeeded}</div>
          <div><span className="font-medium">Supervisors:</span> {project.totalSupervisors}/{project.numSupervisorsNeeded}</div>
        </div>
      </div>

      {/* Scrollable Team Members Section */}
      <div className="space-y-4">
        <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
          <span>Rate Team Members</span>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{teamMembers.length} members</span>
        </h3>
        
        {teamMembers.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-gray-400 text-lg mb-2">👥</div>
            <div className="text-gray-600 text-sm">No team members assigned to this project</div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <div className="divide-y divide-gray-200">
              {teamMembers.map((member, index) => {
                const memberId = member.id; // ONLY use numeric ID
                const memberRating = ratings[memberId] || { rating: 0, feedback: '' };
                const isSubmitting = submittingRatings[memberId];

                return (
                  <div key={index} className="p-3 hover:bg-gray-50">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                      {/* Compact Member Info */}
                      <div className="lg:w-1/3 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            member.role === 'supervisor' ? 'bg-green-500' : 'bg-blue-500'
                          }`}></div>
                          <h4 className="font-medium text-gray-800 text-sm truncate">{member.name}</h4>
                          <span className="text-xs text-gray-500">#{member.id}</span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <div className="flex gap-3">
                            <span><strong>Role:</strong> {member.role === 'data_collector' ? 'Data Collector' : 'Supervisor'}</span>
                            {member.ve_code && <span><strong>VE:</strong> {member.ve_code}</span>}
                          </div>
                          {(member.experience_level || member.status) && (
                            <div className="flex gap-3">
                              {member.experience_level && <span><strong>Exp:</strong> {member.experience_level}</span>}
                              {member.status && <span><strong>Status:</strong> {member.status}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Compact Rating Section */}
                      <div className="lg:w-2/3 flex flex-col sm:flex-row gap-3">
                        {/* Star Rating */}
                        <div className="flex-shrink-0">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Rating</label>
                          <StarRating
                            rating={memberRating.rating}
                            onRatingChange={(rating) => handleRatingChange(memberId, 'rating', rating)}
                            disabled={isSubmitting}
                          />
                        </div>

                        {/* Feedback and Submit */}
                        <div className="flex-1 flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Feedback</label>
                            <textarea
                              className="w-full p-2 border border-gray-300 rounded text-xs resize-none"
                              rows="2"
                              placeholder="Performance feedback..."
                              value={memberRating.feedback || ''}
                              onChange={(e) => handleRatingChange(memberId, 'feedback', e.target.value)}
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="flex-shrink-0 flex items-end">
                            <button
                              onClick={() => submitRating(member)}
                              disabled={isSubmitting || (!memberRating.rating && !memberRating.feedback)}
                              className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs h-fit"
                            >
                              {isSubmitting ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              ) : (
                                '💾'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Compact Summary */}
      {teamMembers.length > 0 && (
        <div className="mt-4 bg-blue-50 p-3 rounded-lg">
          <div className="flex justify-between items-center text-xs text-blue-700">
            <span>Progress: {Object.keys(ratings).filter(id => ratings[id].rating > 0).length} / {teamMembers.length} rated</span>
            <span>DC: {teamMembers.filter(m => m.role === 'data_collector').length} | SUP: {teamMembers.filter(m => m.role === 'supervisor').length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;