import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';

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
    systemRoleId: '',
    onboardingStatus: 'approved',
    isActive: true,
  });
  
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Name Validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    } else if (formData.name.length > 100) {
      errors.name = 'Name cannot exceed 100 characters.';
    }

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Please resolve all validation errors before submitting.');
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
      setFieldErrors({});
      setError(null);
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          contractorType: user.contractorType || '',
          systemRoleId: user.systemRoleId?._id || user.systemRoleId || '',
          onboardingStatus: user.onboardingStatus || 'approved',
          isActive: user.isActive !== undefined ? user.isActive : true,
        });
      } else {
        setFormData({
          name: '',
          email: '',
          contractorType: '',
          systemRoleId: '',
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
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (user) {
        await adminService.updateUser(user._id, formData as any);
        
        // Doc 5 sync: Refresh local store user profile on current logged-in user profile update
        const currentUser = useAuthStore.getState().user;
        const currentUserId = currentUser ? (currentUser.id || (currentUser as any)._id) : null;
        if (currentUserId && currentUserId === user._id) {
          const freshProfile = await authService.getProfile(currentUserId);
          useAuthStore.setState({ user: freshProfile });
        }
      } else {
        await adminService.createUser(formData as any);
      }
      onSave();
      onClose();
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError("You don't have permission to perform this action.");
      } else {
        const message = err.response?.data?.message;
        if (Array.isArray(message)) {
          setError(message.join(', '));
        } else {
          setError(message || err.message || 'Failed to save user.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-800">{user ? 'Edit User' : 'Create User'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-750 font-medium">{error}</p>
            </div>
          )}

          <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full bg-white border rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition ${
                  fieldErrors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
                }`}
                placeholder="John Doe"
              />
              {fieldErrors.name && (
                <p className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full bg-white border rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition ${
                  fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
                }`}
                placeholder="john@example.com"
              />
              {fieldErrors.email && (
                <p className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Contractor Type</label>
                <select
                  name="contractorType"
                  value={formData.contractorType}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition appearance-none cursor-pointer"
                >
                  <option value="">-- Select Type --</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Cast">Cast</option>
                  <option value="Crew">Crew</option>
                  <option value="Supplier">Supplier</option>
                  <option value="Agent">Agent</option>
                  <option value="Cast-Crew Agent">Cast-Crew Agent</option>
                  <option value="TCS Team">TCS Team</option>
                  <option value="Production Company">Production Company</option>
                  <option value="None">None</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Onboarding Status</label>
                <select
                  name="onboardingStatus"
                  value={formData.onboardingStatus}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition appearance-none cursor-pointer"
                >
                  <option value="draft">Draft</option>
                  <option value="pending-review">Pending Review</option>
                  <option value="changes-requested">Changes Requested</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Assigned System Role</label>
              <select
                name="systemRoleId"
                value={formData.systemRoleId}
                onChange={handleChange}
                className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition appearance-none cursor-pointer"
              >
                <option value="">-- No Specific Role (Pending) --</option>
                {roles.map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 py-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-3 text-xs font-bold text-slate-700">Account Active</span>
              </label>
            </div>

            {!user && (
              <p className="text-[11px] text-amber-800 mt-2 bg-amber-50 p-3 rounded-xl border border-amber-200/60 font-medium">
                A temporary password <strong className="text-amber-900">TempPass123!</strong> will be generated for manually created users.
              </p>
            )}

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 mt-auto">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-100 transition text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="user-form"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
