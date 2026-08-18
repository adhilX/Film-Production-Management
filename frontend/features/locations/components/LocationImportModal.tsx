import React from 'react';
import { X, Upload } from 'lucide-react';

interface LocationImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const LocationImportModal: React.FC<LocationImportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center bg-slate-50/50 px-6 py-4 border-b border-slate-200">
          <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <Upload size={16} className="text-indigo-600" /> Import Production Locations
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-655 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
            <Upload size={32} className="text-slate-350" />
            <div>
              <span className="text-xs font-bold text-slate-700 block">Select CSV or JSON file</span>
              <span className="text-[10px] text-slate-450 mt-1 block">Max file size: 5MB</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl">
            <span className="text-[10px] text-slate-450 leading-relaxed block font-medium">
              Clicking &quot;Simulate Import&quot; will automatically load 6 high-quality movie production locations (Studio Lot 4, Forest Location, Downtown Street, Malibu Beach, Desert Location, Stage B) into your database.
            </span>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-655 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Simulate Import
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationImportModal;
