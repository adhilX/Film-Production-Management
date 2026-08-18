import React from 'react';
import { X } from 'lucide-react';

interface RawLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLog: any;
  prettyPrintJson: (str: any) => string;
}

export const RawLogModal: React.FC<RawLogModalProps> = ({
  isOpen,
  onClose,
  selectedLog,
  prettyPrintJson,
}) => {
  if (!isOpen || !selectedLog) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-extrabold text-slate-800 text-xs">Full Audit Log Payload</h3>
            <p className="text-[10px] text-slate-450 font-mono mt-0.5">Log ID: {selectedLog._id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-455 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Raw Metadata & Payload JSON
            </label>
            <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-[10px] text-slate-700 overflow-x-auto leading-relaxed max-h-[50vh]">
              {prettyPrintJson(selectedLog.metadata || selectedLog)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-750 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RawLogModal;
