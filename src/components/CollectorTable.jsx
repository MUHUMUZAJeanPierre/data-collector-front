import React, { useState } from 'react';
import { deleteTeamMember } from '../api/api';
import UpdateCollectorModal from './UpdateCollectorModal';

const CollectorTable = ({ collectors, refresh, currentProject = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [selectedCollector, setSelectedCollector] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this member?')) {
      await deleteTeamMember(id);
      refresh();
    }
  };

  const handleAssign = async (collector) => {
    if (!currentProject) {
      alert('❗ No project selected.');
      return;
    }

    const confirm = window.confirm(`Assign ${collector.name} to "${currentProject}"?`);
    if (!confirm) return;

    try {
      // Use the project assignment API endpoint instead of direct member update
      const response = await fetch(`http://127.0.0.1:8000/api/assign-project/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: currentProject,
          numCollectors: 1,
          specificMembers: [collector.id] // Optional: specify which member to assign
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${collector.name} assigned to "${currentProject}"`);
        refresh();
      } else {
        const errorData = await response.json();
        console.error('Assignment failed:', errorData);
        alert(`❌ Failed to assign member: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Assignment error:', err);
      alert('❌ Error assigning member.');
    }
  };

  const handleUpdate = async (updatedData) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/teammembers/${updatedData.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        alert(`✅ Member updated.`);
        refresh();
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        alert('❌ Update failed.');
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error updating member.');
    }
  };

  const getFilteredCollectors = () => {
    const collectorsArray = Array.isArray(collectors) ? collectors : (collectors?.data || []);
    
    return collectorsArray.filter((c) => {
      const experience = getExperienceLevel(c.projects_count);
      return (
        (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.ve_code.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === '' || c.status === statusFilter) &&
        (experienceFilter === '' || experience === experienceFilter)
      );
    });
  };

  const filteredCollectors = getFilteredCollectors();

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Members</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 w-full">
        <input
          type="text"
          placeholder="Search by name or code"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-2 w-60"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="deployed">Deployed</option>
        </select>

        <select
          value={experienceFilter}
          onChange={(e) => setExperienceFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Experience</option>
          <option value="Supervisor">Supervisor</option>
          <option value="Moderator">Moderator</option>
          <option value="Regular">Regular</option>
          <option value="Backchecker">Backchecker</option>
          <option value="Mobilizer">Mobilizer</option>
        </select>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 text-sm">
          <strong>Debug:</strong> Found {filteredCollectors.length} collectors
        </div>
      )}

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-800 text-white sticky top-0">
            <tr>
              {[
                'VE Code', 'Name', 'Role', 'Projects Count', 'Experience Level',
                'Performance Score', 'Rotation Rank', 'Status', 'Current Project', 'Actions',
              ].map((h) => (
                <th key={h} className="px-4 py-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredCollectors.map((c) => {
              const experience = getExperienceLevel(c.projects_count);
              const isAvailable = c.status === 'available';

              return (
                <tr
                  key={c.id}
                  className="border-b hover:bg-gray-100"
                  onClick={() => {
                    setSelectedCollector(c);
                    setIsModalOpen(true);
                  }}
                >
                  <td className="px-4 py-2">{c.ve_code}</td>
                  <td className="px-4 py-2 text-blue-600 hover:underline cursor-pointer">{c.name}</td>
                  <td className="px-4 py-2">{c.role}</td>
                  <td className="px-4 py-2">{c.projects_count}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getExperienceLevelClass(experience)}`}>
                      {experience}
                    </span>
                  </td>
                  <td className="px-4 py-2">{c.performance_score || 'N/A'}</td>
                  <td className="px-4 py-2">{c.rotation_rank || 'N/A'}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${isAvailable ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={c.current_project ? 'text-gray-900' : 'text-gray-400'}>
                      {c.current_project || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      className={`text-xs px-3 py-1 rounded font-semibold ${
                        isAvailable
                          ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        isAvailable && handleAssign(c);
                      }}
                      disabled={!isAvailable}
                      title={isAvailable ? 'Assign to project' : 'Member is already deployed'}
                    >
                      Assign
                    </button>
                    <button
                      className="bg-red-500 text-white text-xs px-3 py-1 rounded hover:bg-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.id);
                      }}
                      title="Delete member"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredCollectors.length === 0 && (
              <tr>
                <td colSpan="10" className="px-4 py-4 text-center text-gray-500">
                  No team members match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedCollector && (
        <UpdateCollectorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          collector={selectedCollector}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

const getExperienceLevel = (projects) => {
  if (projects <= 2) return 'Mobilizer';
  if (projects === 3) return 'Regular';
  if (projects === 4) return 'Backchecker';
  if (projects === 5) return 'Moderator';
  return 'Supervisor';
};

const getExperienceLevelClass = (level) => {
  switch (level) {
    case 'Supervisor': return 'bg-purple-100 text-purple-700';
    case 'Moderator': return 'bg-indigo-100 text-indigo-700';
    case 'Regular': return 'bg-blue-100 text-blue-700';
    case 'Backchecker': return 'bg-yellow-100 text-yellow-700';
    case 'Mobilizer': return 'bg-green-100 text-green-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default CollectorTable;
