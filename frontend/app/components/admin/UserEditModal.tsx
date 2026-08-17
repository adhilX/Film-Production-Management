import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { adminService } from '@/services/adminService';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any; // User object if editing, null if creating
  onSave: () => void;
}

export default function UserEditModal({ isOpen, onClose, user, onSave }: UserEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contractorType: '',
    systemRole: 'User',
    roleId: '',
    onboardingStatus: 'approved',
    isActive: true,
  });
  
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          contractorType: user.contractorType || '',
          systemRole: user.systemRole || 'User',
          roleId: user.roleId || '',
          onboardingStatus: user.onboardingStatus || 'approved',
          isActive: user.isActive !== undefined ? user.isActive : true,
        });
      } else {
        setFormData({
          name: '',
          email: '',
          contractorType: '',
          systemRole: 'User',
          roleId: '',
          onboardingStatus: 'approved',
          isActive: true,
        });
      }
    }
  }, [isOpen, user]);

  const fetchRoles = async () => {
    try {
      const data = await adminService.getRoles();
      setRoles(data);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    }
    
    // Auto-map system role if custom role dropdown changes
    if (name === 'roleId') {
      const selected = roles.find(r => r._id === value);
      if (selected) {
        if (selected.name === 'Admin') setFormData(prev => ({ ...prev, roleId: value, systemRole: 'Admin' }));
        else if (selected.name.includes('Manager')) setFormData(prev => ({ ...prev, roleId: value, systemRole: 'Manager' }));
        else setFormData(prev => ({ ...prev, roleId: value, systemRole: 'User' }));
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (user) {
        await adminService.updateUser(user._id, formData);
      } else {
        await adminService.createUser(formData);
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-100">{user ? 'Edit User' : 'Create User'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 transition"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 transition"
                placeholder="john@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contractor Type</label>
                <input
                  type="text"
                  name="contractorType"
                  value={formData.contractorType}
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 transition"
                  placeholder="e.g. Cast, Crew"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System Role</label>
                <select
                  name="systemRole"
                  value={formData.systemRole}
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 transition appearance-none"
                >
                  <option value="User">User (Standard)</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assigned RBAC Role</label>
              <select
                name="roleId"
                value={formData.roleId}
                onChange={handleChange}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 transition appearance-none"
              >
                <option value="">-- No Specific Role --</option>
                {roles.map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Onboarding Status</label>
                <select
                  name="onboardingStatus"
                  value={formData.onboardingStatus}
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 transition appearance-none"
                >
                  <option value="draft">Draft</option>
                  <option value="pending-review">Pending Review</option>
                  <option value="changes-requested">Changes Requested</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3 pt-6">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  <span className="ml-3 text-sm font-medium text-slate-300">Account Active</span>
                </label>
              </div>
            </div>

            {!user && (
              <p className="text-xs text-amber-500/80 mt-2 bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
                A temporary password <strong className="text-amber-400">TempPass123!</strong> will be generated for manually created users.
              </p>
            )}

          </form>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3 mt-auto">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-sm font-semibold"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="user-form"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 transition text-sm font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (
              <>
                <Save className="w-4 h-4" />
                {user ? 'Save Changes' : 'Create User'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
