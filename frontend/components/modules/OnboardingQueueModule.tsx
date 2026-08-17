'use client';

import React, { useState, useEffect } from 'react';
import adminService from '@/services/adminService';

export default function OnboardingQueueModule() {
  const [systemUsers, setSystemUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchSystemUsers();
  }, []);

  const fetchSystemUsers = async () => {
    try {
      const data = await adminService.getUsers(1, 100);
      setSystemUsers(data.users || data);
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const handleUpdateOnboarding = async (targetUserId: string, status: string, systemRole?: string) => {
    try {
      await adminService.updateOnboardingStatus(targetUserId, { status, systemRole });
      fetchSystemUsers();
    } catch (e) {
      console.error('Error updating onboarding status:', e);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Onboarding Queue</h2>
        <p className="text-xs text-slate-400 mt-1">Review onboarding applications, activate contractor accounts, and assign system roles.</p>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Pending Applications</h3>

        {systemUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-350">
              <thead className="bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Contractor Classification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions / System Role Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {systemUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-950/20">
                    <td className="py-3 px-4 font-semibold text-slate-200">{u.name}</td>
                    <td className="py-3 px-4">{u.email}</td>
                    <td className="py-3 px-4 text-purple-400 font-semibold">{u.contractorType}</td>
                    <td className="py-3 px-4">
                      <span className={`py-0.5 px-1.5 border rounded text-[10px] font-semibold ${
                        u.status === 'Approved'
                          ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400'
                          : u.status === 'Rejected'
                          ? 'bg-red-950/30 border-red-900 text-red-400'
                          : 'bg-slate-950 border-slate-850 text-slate-450'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 items-center justify-center">
                        {u.status !== 'Approved' && (
                          <>
                            <button
                              onClick={() => handleUpdateOnboarding(u._id!, 'Approved', 'User')}
                              className="py-1 px-2.5 bg-emerald-700/20 hover:bg-emerald-700/30 border border-emerald-700/40 rounded text-[10px] font-semibold text-emerald-400 cursor-pointer"
                            >
                              Approve as User
                            </button>
                            <button
                              onClick={() => handleUpdateOnboarding(u._id!, 'Approved', 'Manager')}
                              className="py-1 px-2.5 bg-purple-700/20 hover:bg-purple-700/30 border border-purple-700/40 rounded text-[10px] font-semibold text-purple-400 cursor-pointer"
                            >
                              Approve as Manager
                            </button>
                            <button
                              onClick={() => handleUpdateOnboarding(u._id!, 'Rejected')}
                              className="py-1 px-2.5 bg-red-700/20 hover:bg-red-700/30 border border-red-700/40 rounded text-[10px] font-semibold text-red-450 cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {u.status === 'Approved' && (
                          <span className="text-[10px] text-slate-500 font-medium">Activated ({u.systemRole})</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-xs text-slate-500 text-center py-6">No onboarding requests.</div>
        )}

      </div>
    </div>
  );
}
