import React from 'react';

interface UserStatsProps {
  total: number;
  activeCount: number;
  limit: number;
}

export const UserStats: React.FC<UserStatsProps> = ({ total, activeCount, limit }) => {
  const inactiveCount = total > 0 ? total - activeCount : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total System Users</span>
        <div className="text-xl font-bold text-slate-800 mt-1">{total}</div>
      </div>
      <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Accounts</span>
        <div className="text-xl font-bold text-slate-800 mt-1">{activeCount}</div>
      </div>
      <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inactive Accounts</span>
        <div className="text-xl font-bold text-slate-800 mt-1">{inactiveCount}</div>
      </div>
      <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected Items Limit</span>
        <div className="text-xl font-bold text-slate-800 mt-1">{limit} / page</div>
      </div>
    </div>
  );
};

export default UserStats;
