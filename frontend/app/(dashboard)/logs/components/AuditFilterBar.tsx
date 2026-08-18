'use client';

import React from 'react';

interface AuditFilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  moduleFilter: string;
  setModuleFilter: (v: string) => void;
  actionFilter: string;
  setActionFilter: (v: string) => void;
}

export const AuditFilterBar: React.FC<AuditFilterBarProps> = ({
  search, setSearch, moduleFilter, setModuleFilter, actionFilter, setActionFilter
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex-1">
        <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Search</label>
        <input
          type="text"
          placeholder="Search by IP, ID, or detail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
        />
      </div>
      
      <div className="w-full sm:w-48">
        <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Module</label>
        <select
          value={moduleFilter}
          onChange={e => setModuleFilter(e.target.value)}
          className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-705 cursor-pointer"
        >
          <option value="All">All Modules</option>
          <option value="FUNDS">FUNDS</option>
          <option value="USERS">USERS</option>
          <option value="LOCATIONS">LOCATIONS</option>
          <option value="SECURITY">SECURITY</option>
        </select>
      </div>

      <div className="w-full sm:w-48">
        <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Action</label>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-705 cursor-pointer"
        >
          <option value="All">All Actions</option>
          <option value="FUND_APPROVED">FUND_APPROVED</option>
          <option value="FUND_REJECTED">FUND_REJECTED</option>
          <option value="FUND_CREATED">FUND_CREATED</option>
          <option value="USER_ONBOARDING_STATUS_CHANGE">ONBOARDING_CHANGE</option>
          <option value="SECURITY_DENIAL">SECURITY_DENIAL</option>
        </select>
      </div>
    </div>
  );
};
