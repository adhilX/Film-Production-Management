import React from 'react';
import { X, Upload, RefreshCw } from 'lucide-react';
import type { Costume } from '@/app/types';

interface CostumeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCostume: Costume | null;
  costumeForm: {
    name: string;
    category: string;
    description: string;
    size: string;
    imageUrl: string;
    quantity: number;
    condition: Costume['condition'];
  };
  setCostumeForm: React.Dispatch<React.SetStateAction<{
    name: string;
    category: string;
    description: string;
    size: string;
    imageUrl: string;
    quantity: number;
    condition: Costume['condition'];
  }>>;
  costumeErrors: Record<string, string>;
  setCostumeErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isUploading: boolean;
  isSubmitting: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onSubmit: (e: React.FormEvent) => void;
}

export const CostumeEditModal: React.FC<CostumeEditModalProps> = ({
  isOpen,
  onClose,
  selectedCostume,
  costumeForm,
  setCostumeForm,
  costumeErrors,
  setCostumeErrors,
  isUploading,
  isSubmitting,
  handleImageUpload,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-lg w-full space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-black text-slate-900 text-base">
            {selectedCostume ? 'Edit Costume details' : 'Log Costume Asset'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-650 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Image Upload field */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Item Image</label>
            <div className="flex gap-4 items-center">
              <label className="flex-1 border border-dashed border-slate-250 hover:border-indigo-400 bg-slate-55/50 hover:bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition">
                {isUploading ? (
                  <RefreshCw className="animate-spin text-indigo-600 w-6 h-6" />
                ) : (
                  <Upload className="text-slate-400 w-6 h-6" />
                )}
                <span className="text-[10px] font-bold text-slate-700">PNG, JPG, WEBP up to 5MB</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="hidden" />
              </label>

              {costumeForm.imageUrl && (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                  <img src={costumeForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCostumeForm((prev) => ({ ...prev, imageUrl: '' }))}
                    className="absolute top-1 right-1 bg-slate-950/60 hover:bg-red-650 text-white rounded-full p-0.5 transition"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Costume Name *</label>
            <input
              type="text"
              placeholder="e.g. Juliet Renaissance Dress"
              value={costumeForm.name}
              onChange={(e) => {
                setCostumeForm((prev) => ({ ...prev, name: e.target.value }));
                if (costumeErrors.name) {
                  setCostumeErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.name;
                    return updated;
                  });
                }
              }}
              className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 ${
                costumeErrors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
              }`}
            />
            {costumeErrors.name && (
              <p className="text-[10px] text-red-500 font-bold">{costumeErrors.name}</p>
            )}
          </div>

          {/* Category & Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Category *</label>
              <input
                type="text"
                placeholder="e.g. Period, Sci-Fi"
                value={costumeForm.category}
                onChange={(e) => {
                  setCostumeForm((prev) => ({ ...prev, category: e.target.value }));
                  if (costumeErrors.category) {
                    setCostumeErrors((prev) => {
                      const updated = { ...prev };
                      delete updated.category;
                      return updated;
                    });
                  }
                }}
                className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 ${
                  costumeErrors.category ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
                }`}
              />
              {costumeErrors.category && (
                <p className="text-[10px] text-red-500 font-bold">{costumeErrors.category}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Size (Optional)</label>
              <input
                type="text"
                placeholder="e.g. M, L, XL"
                value={costumeForm.size}
                onChange={(e) => {
                  setCostumeForm((prev) => ({ ...prev, size: e.target.value }));
                  if (costumeErrors.size) {
                    setCostumeErrors((prev) => {
                      const updated = { ...prev };
                      delete updated.size;
                      return updated;
                    });
                  }
                }}
                className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 ${
                  costumeErrors.size ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
                }`}
              />
              {costumeErrors.size && (
                <p className="text-[10px] text-red-500 font-bold">{costumeErrors.size}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Description</label>
            <textarea
              placeholder="Wardrobe details, material type, style notes, etc..."
              value={costumeForm.description}
              onChange={(e) => {
                setCostumeForm((prev) => ({ ...prev, description: e.target.value }));
                if (costumeErrors.description) {
                  setCostumeErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.description;
                    return updated;
                  });
                }
              }}
              rows={2}
              className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 resize-none ${
                costumeErrors.description ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
              }`}
            />
            {costumeErrors.description && (
              <p className="text-[10px] text-red-500 font-bold">{costumeErrors.description}</p>
            )}
          </div>

          {/* Quantity & Initial Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Stock quantity *</label>
              <input
                type="number"
                min={1}
                value={costumeForm.quantity}
                onChange={(e) => {
                  setCostumeForm((prev) => ({ ...prev, quantity: Number(e.target.value) }));
                  if (costumeErrors.quantity) {
                    setCostumeErrors((prev) => {
                      const updated = { ...prev };
                      delete updated.quantity;
                      return updated;
                    });
                  }
                }}
                className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 ${
                  costumeErrors.quantity ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
                }`}
              />
              {costumeErrors.quantity && (
                <p className="text-[10px] text-red-500 font-bold">{costumeErrors.quantity}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Condition *</label>
              <select
                value={costumeForm.condition}
                onChange={(e) => setCostumeForm((prev) => ({ ...prev, condition: e.target.value as any }))}
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 cursor-pointer"
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CostumeEditModal;
