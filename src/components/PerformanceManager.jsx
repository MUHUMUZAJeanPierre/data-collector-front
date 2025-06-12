import React, { useState } from 'react';
import { updateTeamMember } from '../api/api';

const PerformanceManager = ({ collectors, refresh }) => {
  const [veCode, setVeCode] = useState('');
  const [score, setScore] = useState('');

  const handleUpdate = async () => {
    const member = collectors.find(c => c.ve_code === veCode);
    if (!member) return alert('VE Code not found.');
    const updated = { ...member, performance_score: parseInt(score) };
    await updateTeamMember(member.id, updated);
    refresh();
    alert(`Updated ${member.name}'s performance to ${score}`);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">⭐ Performance Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col">
          <label htmlFor="veCode" className="mb-1 font-medium text-gray-700">VE Code</label>
          <input
            id="veCode"
            type="text"
            value={veCode}
            onChange={e => setVeCode(e.target.value)}
            className="border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="score" className="mb-1 font-medium text-gray-700">Performance Score (1–15)</label>
          <input
            id="score"
            type="number"
            min="1"
            max="15"
            value={score}
            onChange={e => setScore(e.target.value)}
            className="border px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
          />
        </div>
      </div>
      <button
        className="bg-green-600 text-white px-5 py-2 rounded font-semibold hover:bg-green-700"
        onClick={handleUpdate}
      >
        Update Score
      </button>
    </div>
  );
};

export default PerformanceManager;
