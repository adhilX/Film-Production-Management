import React from 'react';
import { User as UserIcon, CheckCircle2, XCircle, Eye, Edit } from 'lucide-react';

interface UsersTableProps {
  users: any[];
  loading: boolean;
  hasUpdatePerm: boolean;
  onSort: (field: string) => void;
  renderSortIcon: (field: string) => React.ReactNode;
  onViewDetails: (id: string) => void;
  onEdit: (user: any) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  loading,
  hasUpdatePerm,
  onSort,
  renderSortIcon,
  onViewDetails,
  onEdit,
}) => {
  return (
    <table className="w-full text-left text-xs text-slate-700">
      <thead className="bg-slate-50 text-slate-505 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
        <tr>
          <th
            className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition select-none"
            onClick={() => onSort('name')}
          >
            User Name & Email {renderSortIcon('name') || renderSortIcon('email')}
          </th>
          <th
            className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition select-none"
            onClick={() => onSort('contractorType')}
          >
            Contractor Type {renderSortIcon('contractorType')}
          </th>
          <th className="px-6 py-4 font-bold">Department</th>
          <th className="px-6 py-4 font-bold">System Role</th>
          <th
            className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition select-none"
            onClick={() => onSort('status')}
          >
            Status & Onboarding {renderSortIcon('status')}
          </th>
          <th className="px-6 py-4 font-bold">State</th>
          <th className="px-6 py-4 font-bold text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {loading ? (
          <tr>
            <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                Loading user directory...
              </div>
            </td>
          </tr>
        ) : users.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-semibold">
              No users found matching your criteria.
            </td>
          </tr>
        ) : (
          users.map((user) => (
            <tr key={user._id} className="hover:bg-slate-50/50 transition">
              {/* Name & Email */}
              <td className="px-6 py-4 font-semibold">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-105 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {user.profile?.photoUrl ? (
                      <img src={user.profile.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div
                      className="font-bold text-slate-800 text-sm hover:text-indigo-650 cursor-pointer"
                      onClick={() => onViewDetails(user._id)}
                    >
                      {user.name || 'Unnamed User'}
                    </div>
                    <div className="text-slate-400 font-semibold text-[11px] mt-0.5">{user.email}</div>
                  </div>
                </div>
              </td>

              {/* Contractor Type */}
              <td className="px-6 py-4">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-655 rounded-lg text-[10px] border border-slate-200/60 font-bold uppercase tracking-wider">
                  {user.contractorType || 'None'}
                </span>
              </td>

              {/* Department */}
              <td className="px-6 py-4 font-semibold text-slate-600">
                {user.profile?.department || 'None'}
              </td>

              {/* System Role */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {user.systemRoleId?.name === 'Super Admin' || user.systemRoleId?.name === 'Production Admin' ? (
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                  ) : ['Production Manager', 'Finance Manager', 'Location Manager', 'Costume Manager'].includes(
                      user.systemRoleId?.name || ''
                    ) ? (
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  ) : user.systemRoleId?.name === 'Cast' || user.systemRoleId?.name === 'Crew' ? (
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                  )}
                  <span className="font-bold text-slate-705">{user.systemRoleId?.name || 'Pending'}</span>
                </div>
              </td>

              {/* Status */}
              <td className="px-6 py-4 font-bold text-slate-750">
                <div className="space-y-1">
                  <span className="block">{user.status}</span>
                  <span className="block text-[9px] text-slate-400 lowercase font-medium">
                    {user.onboardingStatus}
                  </span>
                </div>
              </td>

              {/* Active State */}
              <td className="px-6 py-4">
                {user.isActive ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Active
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                    <XCircle className="w-3.5 h-3.5" />
                    Inactive
                  </div>
                )}
              </td>

              {/* Actions */}
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end items-center gap-2">
                  <button
                    onClick={() => onViewDetails(user._id)}
                    className="inline-flex items-center justify-center p-1.5 text-slate-450 hover:text-indigo-650 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {hasUpdatePerm && (
                    <button
                      onClick={() => onEdit(user)}
                      className="inline-flex items-center justify-center p-1.5 text-slate-450 hover:text-indigo-650 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                      title="Edit User"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default UsersTable;
