import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, ShieldAlert } from 'lucide-react';
import { adminService } from '@/services/adminService';

interface RoleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: any; // Role object if editing, null if creating
  onSave: () => void;
}

export default function RoleEditModal({ isOpen, onClose, role, onSave }: RoleEditModalProps) {
  const [name, setName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (role) {
        setName(role.name || '');
        const initialPerms = (role.permissions || []).map((p: any) => typeof p === 'object' ? (p._id || p.id) : p);
        setSelectedPermissions(initialPerms);
      } else {
        setName('');
        setSelectedPermissions([]);
      }
    }
  }, [isOpen, role]);

  useEffect(() => {
    if (isOpen) {
      const fetchPermissions = async () => {
        try {
          const data = await adminService.getPermissions();
          const grouped: Record<string, any[]> = {};
          
          data.forEach((perm: any) => {
            const groupName = perm.group || 'Custom Perms';
            if (!grouped[groupName]) {
              grouped[groupName] = [];
            }
            grouped[groupName].push({
              id: perm._id || perm.id,
              label: perm.description || perm.name,
            });
          });

          const groupsArray = Object.keys(grouped).map(name => ({
            name,
            permissions: grouped[name]
          }));

          setPermissionGroups(groupsArray);
        } catch (err) {
          console.error('Failed to load permissions:', err);
          setError('Failed to load permissions list from the backend.');
        }
      };

      fetchPermissions();
    }
  }, [isOpen]);

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId) 
        : [...prev, permId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (role) {
        await adminService.updateRole(role._id, { permissions: selectedPermissions });
      } else {
        await adminService.createRole({ name, permissions: selectedPermissions });
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save role.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isAdminRole = role?.name === 'Admin' || role?.name === 'Super Admin' || role?.name === 'Production Admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-800">{role ? 'Edit System Role' : 'Create System Role'}</h2>
            {isAdminRole && (
              <span className="px-2 py-0.5 bg-red-50 text-red-650 border border-red-200 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Core System Role
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-650 transition cursor-pointer">
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

          <form id="role-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Role Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!!role} // Prevent renaming existing roles for safety
                required
                className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition disabled:opacity-50"
                placeholder="e.g. Guest Contractor"
              />
              {role && <p className="text-[11px] text-slate-450 mt-1.5 font-medium">Role names cannot be changed after creation to maintain RBAC integrity.</p>}
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-3">Permission Matrix</h3>
              <div className="space-y-4">
                {permissionGroups.map((group) => (
                  <div key={group.name} className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100/60 px-4 py-2 border-b border-slate-200/60">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{group.name}</h4>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.permissions.map((perm: any) => (
                        <label key={perm.id} className="flex items-center gap-3 cursor-pointer group/label">
                          <div className="relative flex items-center">
                            <input 
                              type="checkbox" 
                              checked={selectedPermissions.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              disabled={isAdminRole} // Don't let them lock out the core Admin role
                              className="peer sr-only" 
                            />
                            <div className="w-5 h-5 border border-slate-350 rounded bg-white peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all peer-focus:ring-2 peer-focus:ring-indigo-600/30 flex items-center justify-center peer-disabled:opacity-50">
                              <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <div className={`text-xs font-bold transition ${isAdminRole ? 'text-slate-400' : 'text-slate-700 group-hover/label:text-indigo-600'}`}>
                              {perm.label}
                            </div>
                            <div className="text-[9px] text-slate-450 font-mono mt-0.5">{perm.id}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {isAdminRole && (
              <p className="text-xs text-red-750 mt-2 bg-red-50 p-3 rounded-xl border border-red-250 font-medium">
                You cannot modify the permissions of the core <strong>Admin</strong> role to prevent accidental lockouts.
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
            form="role-form"
            disabled={loading || isAdminRole}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Saving...' : (
              <>
                <Save className="w-4 h-4" />
                {role ? 'Save Matrix' : 'Create Role'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
