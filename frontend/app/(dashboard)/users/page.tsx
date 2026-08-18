'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { User, CheckCircle2, XCircle, Search, Edit, UserPlus } from 'lucide-react';
import UserEditModal from '@/app/components/admin/UserEditModal';
import Pagination from '@/app/components/Pagination';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers(page, limit, debouncedSearch);
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await adminService.getRoles();
      setRoles(data || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [page, debouncedSearch]);

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.systemRoleId?._id === filterRole;
    return matchesRole;
  });

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-end">
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer text-xs"
        >
          <UserPlus className="w-4 h-4" />
          Create User
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition"
          />
        </div>
        <select 
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-white border border-slate-250 rounded-xl px-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 transition w-full sm:w-auto appearance-none cursor-pointer"
        >
          <option value="all">All Roles</option>
          {roles.map((r) => (
            <option key={r._id} value={r._id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-4 font-bold">User Details</th>
                <th className="px-6 py-4 font-bold">Contractor Type</th>
                <th className="px-6 py-4 font-bold">System Role</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      Loading directory...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {user.profile?.photoUrl ? (
                            <img src={user.profile.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{user.name || 'Unnamed User'}</div>
                          <div className="text-slate-400 mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-650 rounded-lg text-[10px] border border-slate-200/60 font-bold uppercase tracking-wider">
                        {user.contractorType || 'None'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.systemRoleId?.name === 'Super Admin' || user.systemRoleId?.name === 'Production Admin' ? (
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                        ) : ['Production Manager', 'Finance Manager', 'Location Manager', 'Costume Manager'].includes(user.systemRoleId?.name || '') ? (
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        ) : user.systemRoleId?.name === 'Cast' || user.systemRoleId?.name === 'Crew' ? (
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                        )}
                        <span className="font-bold text-slate-700">{user.systemRoleId?.name || 'Pending'}</span>
                      </div>
                    </td>
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
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination component */}
        <Pagination
          page={page}
          pages={pages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(size) => {
            setLimit(size);
            setPage(1);
          }}
          itemName="users"
        />
      </div>

      <UserEditModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onSave={fetchUsers}
      />
    </div>
  );
}
