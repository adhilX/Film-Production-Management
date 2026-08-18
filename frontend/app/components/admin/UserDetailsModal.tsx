import { useState, useEffect } from 'react';
import { X, User, Briefcase, Shield, Film, ListFilter, AlertCircle } from 'lucide-react';
import { adminService } from '@/services/adminService';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export default function UserDetailsModal({ isOpen, onClose, userId }: UserDetailsModalProps) {
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'projects' | 'audit'>('profile');

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
      setActiveTab('profile');
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      if (userId) {
        const data = await adminService.getUser(userId);
        setUserDetails(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch user details:', err);
      setError(err.response?.data?.message || 'Failed to load user details.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              {userDetails?.profile?.photoUrl ? (
                <img src={userDetails.profile.photoUrl} alt={userDetails.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-450" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{userDetails?.name || 'Loading profile...'}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{userDetails?.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-450 hover:text-slate-650 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-white px-6 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 py-3 px-1 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'profile'
                ? 'border-indigo-650 text-indigo-650'
                : 'border-transparent text-slate-450 hover:text-slate-750'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Profile & Info
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 py-3 px-1 ml-6 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'projects'
                ? 'border-indigo-650 text-indigo-650'
                : 'border-transparent text-slate-450 hover:text-slate-750'
            }`}
          >
            <Film className="w-4 h-4" />
            Project Assignments
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 py-3 px-1 ml-6 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'audit'
                ? 'border-indigo-650 text-indigo-650'
                : 'border-transparent text-slate-450 hover:text-slate-750'
            }`}
          >
            <Shield className="w-4 h-4" />
            Audit History
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-450 gap-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-medium">Fetching details...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-red-50/30 rounded-xl border border-red-100">
              <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
              <p className="text-sm font-bold text-slate-800">Error Loading Profile</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">{error}</p>
              <button 
                onClick={fetchUserDetails}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : !userDetails ? (
            <div className="text-center text-xs text-slate-450 py-12">No user data retrieved.</div>
          ) : (
            <div className="space-y-6">
              
              {/* Tab 1: Profile & Info */}
              {activeTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Personal & Professional */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                    <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-500" />
                      Personal & Professional
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Contractor Type</span>
                        <span className="font-bold text-slate-800 mt-1 block uppercase tracking-wider text-[10px] bg-slate-100 px-2 py-0.5 rounded-md w-fit border border-slate-200/50">
                          {userDetails.contractorType || 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Department</span>
                        <span className="font-bold text-slate-800 mt-1 block">{userDetails.profile?.department || 'Not Provided'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Position</span>
                        <span className="font-bold text-slate-800 mt-1 block">{userDetails.profile?.position || 'Not Provided'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Phone Number</span>
                        <span className="font-bold text-slate-800 mt-1 block">{userDetails.profile?.phoneNumber || 'Not Provided'}</span>
                      </div>
                    </div>

                    <div className="text-xs pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block font-medium mb-1.5">Experience & Background</span>
                      {userDetails.profile?.experience && userDetails.profile.experience.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-700 font-medium">
                          {userDetails.profile.experience.map((exp: string, idx: number) => (
                            <li key={idx}>{exp}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-450 italic">No experience records listed.</span>
                      )}
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                    <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-indigo-500" />
                      Account & Access
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">System Role</span>
                        <span className="font-bold text-slate-800 mt-1 block">{userDetails.systemRoleId?.name || 'Pending Approval'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Account Status</span>
                        <span className={`font-bold mt-1 block ${userDetails.isActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {userDetails.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Onboarding Status</span>
                        <span className="font-bold text-slate-800 mt-1 block uppercase tracking-wider text-[10px] bg-indigo-50 text-indigo-750 px-2 py-0.5 rounded-md w-fit border border-indigo-100">
                          {userDetails.onboardingStatus || 'Draft'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Evaluation State</span>
                        <span className="font-bold text-slate-800 mt-1 block">{userDetails.status || 'Draft'}</span>
                      </div>
                    </div>

                    {userDetails.adminFeedback && (
                      <div className="text-xs pt-3 border-t border-slate-100 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                        <span className="text-amber-800 block font-bold mb-1">Latest Rejection Feedback:</span>
                        <p className="text-slate-700 font-medium">{userDetails.adminFeedback}</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Tab 2: Project Assignments */}
              {activeTab === 'projects' && (
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-indigo-500" />
                      Assigned Film Production Projects
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-200/80">
                        <tr>
                          <th className="px-5 py-3 font-bold">Project Name</th>
                          <th className="px-5 py-3 font-bold">Role In Project</th>
                          <th className="px-5 py-3 font-bold">Assigned Character</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {!userDetails.assignments || userDetails.assignments.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-5 py-10 text-center text-slate-450 italic">
                              This user is not currently assigned to any projects.
                            </td>
                          </tr>
                        ) : (
                          userDetails.assignments.map((assignment: any) => (
                            <tr key={assignment._id} className="hover:bg-slate-50/40 transition">
                              <td className="px-5 py-3.5 font-bold text-slate-850">
                                {assignment.productionId?.title || assignment.productionId?.name || 'Unnamed Project'}
                              </td>
                              <td className="px-5 py-3.5 font-medium text-slate-700">
                                {assignment.roleInProduction || 'None'}
                              </td>
                              <td className="px-5 py-3.5 font-medium text-slate-500">
                                {assignment.characterId?.name || 'No Character Assigned'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Audit Logs */}
              {activeTab === 'audit' && (
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ListFilter className="w-4 h-4 text-indigo-500" />
                      User Management Audit Trails
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-200/80">
                        <tr>
                          <th className="px-5 py-3 font-bold">Actor</th>
                          <th className="px-5 py-3 font-bold">Action</th>
                          <th className="px-5 py-3 font-bold">Details</th>
                          <th className="px-5 py-3 font-bold text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {!userDetails.auditLogs || userDetails.auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-10 text-center text-slate-450 italic">
                              No security audit logs found for this account.
                            </td>
                          </tr>
                        ) : (
                          userDetails.auditLogs.map((log: any) => (
                            <tr key={log._id} className="hover:bg-slate-50/40 transition">
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-slate-800">{log.userId?.name || 'System'}</div>
                                <div className="text-slate-400 text-[10px]">{log.userId?.email || ''}</div>
                              </td>
                              <td className="px-5 py-3.5 font-bold text-slate-650 text-[10px] uppercase tracking-wider">
                                {log.action}
                              </td>
                              <td className="px-5 py-3.5 font-medium text-slate-600 max-w-xs truncate" title={JSON.stringify(log.metadata)}>
                                {log.metadata?.newStatus || log.metadata?.newActive !== undefined ? (
                                  <span>
                                    {log.metadata?.newActive !== undefined ? `Active: ${log.metadata.newActive.toString()}` : `Status: ${log.metadata.newStatus}`}
                                  </span>
                                ) : (
                                  JSON.stringify(log.metadata || {})
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-slate-450 text-[10px] text-right font-medium">
                                {new Date(log.createdAt || log.timestamp).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-100 transition text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
