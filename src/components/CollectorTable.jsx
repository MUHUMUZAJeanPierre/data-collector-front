// import React, { useState } from 'react';
// import { deleteTeamMember } from '../api/api';
// import UpdateCollectorModal from './UpdateCollectorModal';

// const CollectorTable = ({ collectors, refresh, currentProject = null }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [experienceFilter, setExperienceFilter] = useState('');
//   const [selectedCollector, setSelectedCollector] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const handleDelete = async (id) => {
//     if (window.confirm('Delete this member?')) {
//       await deleteTeamMember(id);
//       refresh();
//     }
//   };

//   const handleAssign = async (collector) => {
//     if (!currentProject) {
//       alert('❗ No project selected.');
//       return;
//     }

//     const confirm = window.confirm(`Assign ${collector.name} to "${currentProject}"?`);
//     if (!confirm) return;

//     try {
//       const response = await fetch(`http://127.0.0.1:8000/api/teammembers/${collector.id}/`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           current_project: currentProject,
//           status: 'deployed',
//           projects_count: collector.projects_count + 1
//         }),
//       });

//       if (response.ok) {
//         alert(`✅ ${collector.name} assigned to "${currentProject}"`);
//         refresh();
//       } else {
//         alert('❌ Failed to assign member.');
//       }
//     } catch (err) {
//       console.error('Assignment error:', err);
//       alert('❌ Error assigning member.');
//     }
//   };

//   const handleUpdate = async (updatedData) => {
//     try {
//       const response = await fetch(`http://127.0.0.1:8000/api/teammembers/${updatedData.id}/`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(updatedData),
//       });

//       if (response.ok) {
//         alert(`✅ Member updated.`);
//         refresh();
//       } else {
//         alert('❌ Update failed.');
//       }
//     } catch (err) {
//       console.error(err);
//       alert('❌ Error updating member.');
//     }
//   };

//   const getFilteredCollectors = () => {
//     return collectors.filter((c) => {
//       const experience = getExperienceLevel(c.projects_count);
//       return (
//         (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           c.ve_code.toLowerCase().includes(searchTerm.toLowerCase())) &&
//         (statusFilter === '' || c.status === statusFilter) &&
//         (experienceFilter === '' || experience === experienceFilter)
//       );
//     });
//   };

//   const filteredCollectors = getFilteredCollectors();

//   return (
//     <div className="bg-white p-6 rounded-xl shadow">
//       <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Members</h2>

//       {/* Filters */}
//       <div className="flex flex-wrap gap-4 mb-4 w-full">
//         <input
//           type="text"
//           placeholder="Search by name or code"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="border rounded px-3 py-2 w-60"
//         />

//         <select
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//           className="border rounded px-3 py-2"
//         >
//           <option value="">All Status</option>
//           <option value="available">Available</option>
//           <option value="deployed">Deployed</option>
//         </select>

//         <select
//           value={experienceFilter}
//           onChange={(e) => setExperienceFilter(e.target.value)}
//           className="border rounded px-3 py-2"
//         >
//           <option value="">All Experience</option>
//           <option value="Supervisor">Supervisor</option>
//           <option value="Moderator">Moderator</option>
//           <option value="Regular">Regular</option>
//           <option value="Backchecker">Backchecker</option>
//           <option value="Mobilizer">Mobilizer</option>
//         </select>
//       </div>

//       {/* Table */}
//       <div className="overflow-auto">
//         <table className="min-w-full text-sm">
//           <thead className="bg-gray-800 text-white sticky top-0">
//             <tr>
//               {[
//                 'VE Code', 'Name', 'Role', 'Projects Count', 'Experience Level',
//                 'Performance Score', 'Rotation Rank', 'Status', 'Current Project', 'Actions',
//               ].map((h) => (
//                 <th key={h} className="px-4 py-2 text-left">{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {filteredCollectors.map((c) => {
//               const experience = getExperienceLevel(c.projects_count);
//               const isAvailable = c.status === 'available';

//               return (
//                 <tr
//                   key={c.id}
//                   className="border-b hover:bg-gray-100"
//                   onClick={() => {
//                     setSelectedCollector(c);
//                     setIsModalOpen(true);
//                   }}
//                 >
//                   <td className="px-4 py-2">{c.ve_code}</td>
//                   <td className="px-4 py-2 text-blue-600 hover:underline cursor-pointer">{c.name}</td>
//                   <td className="px-4 py-2">{c.role}</td>
//                   <td className="px-4 py-2">{c.projects_count}</td>
//                   <td className="px-4 py-2">
//                     <span className={`inline-block px-2 py-1 text-xs rounded-full ${getExperienceLevelClass(experience)}`}>
//                       {experience}
//                     </span>
//                   </td>
//                   <td className="px-4 py-2">{c.performance_score}</td>
//                   <td className="px-4 py-2">{c.rotation_rank}</td>
//                   <td className="px-4 py-2">
//                     <span className={`inline-block px-2 py-1 text-xs rounded-full ${isAvailable ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
//                       {c.status}
//                     </span>
//                   </td>
//                   <td className="px-4 py-2">{c.current_project || '-'}</td>
//                   <td className="px-4 py-2 space-x-2">
//                     <button
//                       className={`text-xs px-3 py-1 rounded font-semibold ${
//                         isAvailable
//                           ? 'bg-indigo-500 text-white hover:bg-indigo-600'
//                           : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                       }`}
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         isAvailable && handleAssign(c);
//                       }}
//                       disabled={!isAvailable}
//                     >
//                       Assign
//                     </button>
//                     <button
//                       className="bg-red-500 text-white text-xs px-3 py-1 rounded hover:bg-red-600"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleDelete(c.id);
//                       }}
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               );
//             })}
//             {filteredCollectors.length === 0 && (
//               <tr>
//                 <td colSpan="10" className="px-4 py-4 text-center text-gray-500">
//                   No team members match your filters.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Update Modal */}
//       {isModalOpen && selectedCollector && (
//         <UpdateCollectorModal
//           isOpen={isModalOpen}
//           onClose={() => setIsModalOpen(false)}
//           collector={selectedCollector}
//           onUpdate={handleUpdate}
//         />
//       )}
//     </div>
//   );
// };

// const getExperienceLevel = (projects) => {
//   if (projects <= 2) return 'Mobilizer';
//   if (projects === 3) return 'Regular';
//   if (projects === 4) return 'Backchecker';
//   if (projects === 5) return 'Moderator';
//   return 'Supervisor';
// };

// const getExperienceLevelClass = (level) => {
//   switch (level) {
//     case 'Supervisor': return 'bg-purple-100 text-purple-700';
//     case 'Moderator': return 'bg-indigo-100 text-indigo-700';
//     case 'Regular': return 'bg-blue-100 text-blue-700';
//     case 'Backchecker': return 'bg-yellow-100 text-yellow-700';
//     case 'Mobilizer': return 'bg-green-100 text-green-700';
//     default: return 'bg-gray-100 text-gray-700';
//   }
// };

// export default CollectorTable;

// import React, { useState } from 'react';
// import { deleteTeamMember } from '../api/api';
// import UpdateCollectorModal from './UpdateCollectorModal';

// const CollectorTable = ({ collectors, refresh, currentProject = null }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [experienceFilter, setExperienceFilter] = useState('');
//   const [selectedCollector, setSelectedCollector] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const handleDelete = async (id) => {
//     if (window.confirm('Delete this member?')) {
//       await deleteTeamMember(id);
//       refresh();
//     }
//   };

//   const handleAssign = async (collector) => {
//     if (!currentProject) {
//       alert('❗ No project selected.');
//       return;
//     }

//     const confirm = window.confirm(`Assign ${collector.name} to "${currentProject}"?`);
//     if (!confirm) return;

//     try {
//       // Use the project assignment API endpoint instead of direct member update
//       const response = await fetch(`http://127.0.0.1:8000/api/assign-project/`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           projectName: currentProject,
//           numCollectors: 1,
//           specificMembers: [collector.id] // Optional: specify which member to assign
//         }),
//       });

//       if (response.ok) {
//         const result = await response.json();
//         alert(`✅ ${collector.name} assigned to "${currentProject}"`);
//         refresh();
//       } else {
//         const errorData = await response.json();
//         console.error('Assignment failed:', errorData);
//         alert(`❌ Failed to assign member: ${errorData.message || 'Unknown error'}`);
//       }
//     } catch (err) {
//       console.error('Assignment error:', err);
//       alert('❌ Error assigning member.');
//     }
//   };

//   const handleUpdate = async (updatedData) => {
//     try {
//       const response = await fetch(`http://127.0.0.1:8000/api/teammembers/${updatedData.id}/`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(updatedData),
//       });

//       if (response.ok) {
//         alert(`✅ Member updated.`);
//         refresh();
//       } else {
//         const errorData = await response.json();
//         console.error('Update failed:', errorData);
//         alert('❌ Update failed.');
//       }
//     } catch (err) {
//       console.error(err);
//       alert('❌ Error updating member.');
//     }
//   };

//   const getFilteredCollectors = () => {
//     // Handle both direct array and wrapped data structure
//     const collectorsArray = Array.isArray(collectors) ? collectors : (collectors?.data || []);
    
//     return collectorsArray.filter((c) => {
//       const experience = getExperienceLevel(c.projects_count);
//       return (
//         (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           c.ve_code.toLowerCase().includes(searchTerm.toLowerCase())) &&
//         (statusFilter === '' || c.status === statusFilter) &&
//         (experienceFilter === '' || experience === experienceFilter)
//       );
//     });
//   };

//   const filteredCollectors = getFilteredCollectors();

//   return (
//     <div className="bg-white p-6 rounded-xl shadow">
//       <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Members</h2>

//       {/* Filters */}
//       <div className="flex flex-wrap gap-4 mb-4 w-full">
//         <input
//           type="text"
//           placeholder="Search by name or code"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="border rounded px-3 py-2 w-60"
//         />

//         <select
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//           className="border rounded px-3 py-2"
//         >
//           <option value="">All Status</option>
//           <option value="available">Available</option>
//           <option value="deployed">Deployed</option>
//         </select>

//         <select
//           value={experienceFilter}
//           onChange={(e) => setExperienceFilter(e.target.value)}
//           className="border rounded px-3 py-2"
//         >
//           <option value="">All Experience</option>
//           <option value="Supervisor">Supervisor</option>
//           <option value="Moderator">Moderator</option>
//           <option value="Regular">Regular</option>
//           <option value="Backchecker">Backchecker</option>
//           <option value="Mobilizer">Mobilizer</option>
//         </select>
//       </div>

//       {/* Debug Info - Remove this in production */}
//       {process.env.NODE_ENV === 'development' && (
//         <div className="mb-4 p-2 bg-gray-100 text-sm">
//           <strong>Debug:</strong> Found {filteredCollectors.length} collectors
//         </div>
//       )}

//       {/* Table */}
//       <div className="overflow-auto">
//         <table className="min-w-full text-sm">
//           <thead className="bg-gray-800 text-white sticky top-0">
//             <tr>
//               {[
//                 'VE Code', 'Name', 'Role', 'Projects Count', 'Experience Level',
//                 'Performance Score', 'Rotation Rank', 'Status', 'Assigned Projects', 'Actions',
//               ].map((h) => (
//                 <th key={h} className="px-4 py-2 text-left">{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {filteredCollectors.map((c) => {
//               const experience = getExperienceLevel(c.projects_count);
//               const isAvailable = c.status === 'available';

//               return (
//                 <tr
//                   key={c.id}
//                   className="border-b hover:bg-gray-100"
//                   onClick={() => {
//                     setSelectedCollector(c);
//                     setIsModalOpen(true);
//                   }}
//                 >
//                   <td className="px-4 py-2">{c.ve_code}</td>
//                   <td className="px-4 py-2 text-blue-600 hover:underline cursor-pointer">{c.name}</td>
//                   <td className="px-4 py-2">{c.role}</td>
//                   <td className="px-4 py-2">{c.projects_count}</td>
//                   <td className="px-4 py-2">
//                     <span className={`inline-block px-2 py-1 text-xs rounded-full ${getExperienceLevelClass(experience)}`}>
//                       {experience}
//                     </span>
//                   </td>
//                   <td className="px-4 py-2">{c.performance_score || 'N/A'}</td>
//                   <td className="px-4 py-2">{c.rotation_rank || 'N/A'}</td>
//                   <td className="px-4 py-2">
//                     <span className={`inline-block px-2 py-1 text-xs rounded-full ${isAvailable ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
//                       {c.status}
//                     </span>
//                   </td>
//                   <td className="px-4 py-2">
//                     {c.assigned_projects && c.assigned_projects.length > 0 ? (
//                       <div className="space-y-1">
//                         {c.assigned_projects.map((project, index) => (
//                           <span 
//                             key={index}
//                             className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mr-1 mb-1"
//                           >
//                             {project}
//                           </span>
//                         ))}
//                       </div>
//                     ) : (
//                       <span className="text-gray-400 italic">Unassigned</span>
//                     )}
//                   </td>
//                   <td className="px-4 py-2 space-x-2">
//                     <button
//                       className={`text-xs px-3 py-1 rounded font-semibold ${
//                         isAvailable
//                           ? 'bg-indigo-500 text-white hover:bg-indigo-600'
//                           : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                       }`}
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         isAvailable && handleAssign(c);
//                       }}
//                       disabled={!isAvailable}
//                       title={isAvailable ? 'Assign to project' : 'Member is already deployed'}
//                     >
//                       Assign
//                     </button>
//                     <button
//                       className="bg-red-500 text-white text-xs px-3 py-1 rounded hover:bg-red-600"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleDelete(c.id);
//                       }}
//                       title="Delete member"
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               );
//             })}
//             {filteredCollectors.length === 0 && (
//               <tr>
//                 <td colSpan="10" className="px-4 py-4 text-center text-gray-500">
//                   No team members match your filters.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Update Modal */}
//       {isModalOpen && selectedCollector && (
//         <UpdateCollectorModal
//           isOpen={isModalOpen}
//           onClose={() => setIsModalOpen(false)}
//           collector={selectedCollector}
//           onUpdate={handleUpdate}
//         />
//       )}
//     </div>
//   );
// };

// const getExperienceLevel = (projects) => {
//   if (projects <= 2) return 'Mobilizer';
//   if (projects === 3) return 'Regular';
//   if (projects === 4) return 'Backchecker';
//   if (projects === 5) return 'Moderator';
//   return 'Supervisor';
// };

// const getExperienceLevelClass = (level) => {
//   switch (level) {
//     case 'Supervisor': return 'bg-purple-100 text-purple-700';
//     case 'Moderator': return 'bg-indigo-100 text-indigo-700';
//     case 'Regular': return 'bg-blue-100 text-blue-700';
//     case 'Backchecker': return 'bg-yellow-100 text-yellow-700';
//     case 'Mobilizer': return 'bg-green-100 text-green-700';
//     default: return 'bg-gray-100 text-gray-700';
//   }
// };

// export default CollectorTable;


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
    // Handle both direct array and wrapped data structure
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

      {/* Debug Info - Remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 text-sm">
          <strong>Debug:</strong> Found {filteredCollectors.length} collectors
        </div>
      )}

      {/* Table */}
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

      {/* Update Modal */}
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


// import React, { useState } from 'react';
// import { deleteTeamMember } from '../api/api';
// import UpdateCollectorModal from './UpdateCollectorModal';

// const CollectorTable = ({ collectors, refresh, currentProject = null }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [experienceFilter, setExperienceFilter] = useState('');
//   const [selectedCollector, setSelectedCollector] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const handleDelete = async (id) => {
//     if (window.confirm('Delete this member?')) {
//       await deleteTeamMember(id);
//       refresh();
//     }
//   };

//   const handleAssign = async (collector) => {
//     if (!currentProject) {
//       alert('❗ No project selected.');
//       return;
//     }

//     const confirm = window.confirm(`Assign ${collector.name} to "${currentProject}"?`);
//     if (!confirm) return;

//     try {
//       const response = await fetch(`http://127.0.0.1:8000/api/assign-project/`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           projectName: currentProject,
//           numCollectors: 1,
//           specificMembers: [collector.id]
//         }),
//       });

//       if (response.ok) {
//         const result = await response.json();
//         alert(`✅ ${collector.name} assigned to "${currentProject}"`);
//         refresh();
//       } else {
//         const errorData = await response.json();
//         console.error('Assignment failed:', errorData);
//         alert(`❌ Failed to assign member: ${errorData.message || 'Unknown error'}`);
//       }
//     } catch (err) {
//       console.error('Assignment error:', err);
//       alert('❌ Error assigning member.');
//     }
//   };

//   const handleUpdate = async (updatedData) => {
//     try {
//       const response = await fetch(`http://127.0.0.1:8000/api/teammembers/${updatedData.id}/`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(updatedData),
//       });

//       if (response.ok) {
//         alert(`✅ Member updated.`);
//         refresh();
//       } else {
//         const errorData = await response.json();
//         console.error('Update failed:', errorData);
//         alert('❌ Update failed.');
//       }
//     } catch (err) {
//       console.error(err);
//       alert('❌ Error updating member.');
//     }
//   };

//   const getFilteredCollectors = () => {
//     const collectorsArray = Array.isArray(collectors) ? collectors : (collectors?.data || []);
    
//     return collectorsArray.filter((c) => {
//       const experience = getExperienceLevel(c.projects_count);
//       return (
//         (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           c.ve_code.toLowerCase().includes(searchTerm.toLowerCase())) &&
//         (statusFilter === '' || c.status === statusFilter) &&
//         (experienceFilter === '' || experience === experienceFilter)
//       );
//     });
//   };

//   const filteredCollectors = getFilteredCollectors();

//   return (
//     <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
//       {/* Header Section */}
//       <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-6 border-b border-gray-200">
//         <div className="flex items-center justify-between">
//           <div>
//             <h2 className="text-2xl font-bold text-gray-900 mb-1">Team Members</h2>
//             <p className="text-sm text-gray-600">{filteredCollectors.length} of {Array.isArray(collectors) ? collectors.length : collectors?.data?.length || 0} members</p>
//           </div>
//           {currentProject && (
//             <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
//               📋 {currentProject}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Filters Section */}
//       <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {/* Search Input */}
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//               </svg>
//             </div>
//             <input
//               type="text"
//               placeholder="Search by name or VE code..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//             />
//           </div>

//           {/* Status Filter */}
//           <div className="relative">
//             <select
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
//             >
//               <option value="">All Status</option>
//               <option value="available">🟢 Available</option>
//               <option value="deployed">🔵 Deployed</option>
//             </select>
//             <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
//               <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//               </svg>
//             </div>
//           </div>

//           {/* Experience Filter */}
//           <div className="relative">
//             <select
//               value={experienceFilter}
//               onChange={(e) => setExperienceFilter(e.target.value)}
//               className="block w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
//             >
//               <option value="">All Experience Levels</option>
//               <option value="Supervisor">👑 Supervisor</option>
//               <option value="Moderator">🎯 Moderator</option>
//               <option value="Regular">⭐ Regular</option>
//               <option value="Backchecker">🔍 Backchecker</option>
//               <option value="Mobilizer">🚀 Mobilizer</option>
//             </select>
//             <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
//               <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//               </svg>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Table Section */}
//       <div className="overflow-x-auto">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-900">
//             <tr>
//               {[
//                 { key: 've_code', label: 'VE Code', icon: '🏷️' },
//                 { key: 'name', label: 'Name', icon: '👤' },
//                 { key: 'role', label: 'Role', icon: '💼' },
//                 { key: 'projects_count', label: 'Projects', icon: '📊' },
//                 { key: 'experience', label: 'Experience', icon: '🎖️' },
//                 { key: 'performance', label: 'Performance', icon: '📈' },
//                 { key: 'rotation', label: 'Rank', icon: '🏆' },
//                 { key: 'status', label: 'Status', icon: '🎯' },
//                 { key: 'project', label: 'Current Project', icon: '📋' },
//                 { key: 'actions', label: 'Actions', icon: '⚙️' },
//               ].map((header) => (
//                 <th
//                   key={header.key}
//                   className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider"
//                 >
//                   <div className="flex items-center space-x-2">
//                     <span>{header.icon}</span>
//                     <span>{header.label}</span>
//                   </div>
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {filteredCollectors.map((c, index) => {
//               const experience = getExperienceLevel(c.projects_count);
//               const isAvailable = c.status === 'available';

//               return (
//                 <tr
//                   key={c.id}
//                   className={`hover:bg-blue-50 transition-colors duration-150 cursor-pointer ${
//                     index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
//                   }`}
//                   onClick={() => {
//                     setSelectedCollector(c);
//                     setIsModalOpen(true);
//                   }}
//                 >
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 bg-gray-100">
//                     {c.ve_code}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
//                       {c.name}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
//                     {c.role}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="flex items-center">
//                       <div className="text-sm font-semibold text-gray-900">{c.projects_count}</div>
//                       <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
//                         <div 
//                           className="bg-blue-500 h-2 rounded-full transition-all duration-300"
//                           style={{ width: `${Math.min((c.projects_count / 10) * 100, 100)}%` }}
//                         ></div>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getExperienceLevelClass(experience)}`}>
//                       {getExperienceIcon(experience)} {experience}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                     <div className="flex items-center">
//                       <span className="font-semibold">{c.performance_score || 'N/A'}</span>
//                       {c.performance_score && (
//                         <div className="ml-2 flex">
//                           {[...Array(5)].map((_, i) => (
//                             <svg
//                               key={i}
//                               className={`h-4 w-4 ${i < Math.floor(c.performance_score / 20) ? 'text-yellow-400' : 'text-gray-300'}`}
//                               fill="currentColor"
//                               viewBox="0 0 20 20"
//                             >
//                               <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//                             </svg>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="flex items-center">
//                       <div className="text-sm font-semibold text-gray-900">#{c.rotation_rank || 'N/A'}</div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
//                       isAvailable 
//                         ? 'bg-green-100 text-green-800 border border-green-200' 
//                         : 'bg-blue-100 text-blue-800 border border-blue-200'
//                     }`}>
//                       <div className={`w-2 h-2 rounded-full mr-2 ${
//                         isAvailable ? 'bg-green-400' : 'bg-blue-400'
//                       }`}></div>
//                       {c.status}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm">
//                     {c.current_project ? (
//                       <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
//                         📋 {c.current_project}
//                       </span>
//                     ) : (
//                       <span className="text-gray-400 italic">Unassigned</span>
//                     )}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                     <div className="flex space-x-2">
//                       <button
//                         className={`inline-flex items-center px-3 py-2 border border-transparent text-xs leading-4 font-medium rounded-lg transition-all duration-200 ${
//                           isAvailable
//                             ? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md transform hover:-translate-y-0.5'
//                             : 'text-gray-400 bg-gray-100 cursor-not-allowed'
//                         }`}
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           isAvailable && handleAssign(c);
//                         }}
//                         disabled={!isAvailable}
//                         title={isAvailable ? 'Assign to project' : 'Member is already deployed'}
//                       >
//                         <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//                         </svg>
//                         Assign
//                       </button>
//                       <button
//                         className="inline-flex items-center px-3 py-2 border border-transparent text-xs leading-4 font-medium rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleDelete(c.id);
//                         }}
//                         title="Delete member"
//                       >
//                         <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                         </svg>
//                         Delete
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>

//         {/* Empty State */}
//         {filteredCollectors.length === 0 && (
//           <div className="text-center py-12 px-6">
//             <svg className="mx-auto h-24 w-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//             </svg>
//             <h3 className="mt-4 text-lg font-medium text-gray-900">No team members found</h3>
//             <p className="mt-2 text-sm text-gray-500">
//               No team members match your current filters. Try adjusting your search criteria.
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Update Modal */}
//       {isModalOpen && selectedCollector && (
//         <UpdateCollectorModal
//           isOpen={isModalOpen}
//           onClose={() => setIsModalOpen(false)}
//           collector={selectedCollector}
//           onUpdate={handleUpdate}
//         />
//       )}
//     </div>
//   );
// };

// const getExperienceLevel = (projects) => {
//   if (projects <= 2) return 'Mobilizer';
//   if (projects === 3) return 'Regular';
//   if (projects === 4) return 'Backchecker';
//   if (projects === 5) return 'Moderator';
//   return 'Supervisor';
// };

// const getExperienceIcon = (level) => {
//   switch (level) {
//     case 'Supervisor': return '👑';
//     case 'Moderator': return '🎯';
//     case 'Regular': return '⭐';
//     case 'Backchecker': return '🔍';
//     case 'Mobilizer': return '🚀';
//     default: return '📝';
//   }
// };

// const getExperienceLevelClass = (level) => {
//   switch (level) {
//     case 'Supervisor': return 'bg-purple-100 text-purple-700 border border-purple-200';
//     case 'Moderator': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
//     case 'Regular': return 'bg-blue-100 text-blue-700 border border-blue-200';
//     case 'Backchecker': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
//     case 'Mobilizer': return 'bg-green-100 text-green-700 border border-green-200';
//     default: return 'bg-gray-100 text-gray-700 border border-gray-200';
//   }
// };

// export default CollectorTable;