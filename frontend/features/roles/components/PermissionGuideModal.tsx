import React from 'react';
import { ShieldCheck, X, Check, Minus, AlertTriangle } from 'lucide-react';

interface PermissionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PermissionGuideModal: React.FC<PermissionGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-lg w-full space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-650" />
            Permission Matrix Guide
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-650 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-slate-705 max-h-[60vh] overflow-y-auto pr-1">
          <p className="font-semibold text-slate-600">
            The permission matrix defines access levels for user roles in the system. Access is categorized in three states:
          </p>
          <div className="space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                <Check size={11} className="stroke-[3]" />
              </div>
              <div>
                <strong className="text-slate-900 font-bold block">Allow</strong>
                <span className="text-slate-500 font-medium">
                  Users with this role are explicitly allowed to perform the action.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                <Minus size={11} className="stroke-[3]" />
              </div>
              <div>
                <strong className="text-slate-900 font-bold block">Deny</strong>
                <span className="text-slate-500 font-medium">
                  Users with this role are explicitly denied access. Toggling allowed cells will set them to Deny.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                <Minus size={9} className="stroke-[3]" />
              </div>
              <div>
                <strong className="text-slate-900 font-bold block">No Access</strong>
                <span className="text-slate-500 font-medium">
                  The permission is out of scope for the role and is disabled by default.
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-4 text-[11px] text-amber-700 bg-amber-50/70 p-3 rounded-xl border border-amber-200/50 font-semibold flex gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              Only administrators with "Manage Roles & RBAC" permissions can edit the matrix. Changes take effect
              immediately.
            </span>
          </div>
        </div>

        <div className="pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionGuideModal;
