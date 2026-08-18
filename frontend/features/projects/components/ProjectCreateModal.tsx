import React, { useRef } from 'react';
import { Film, AlertCircle, Loader2, ImageIcon, Trash2 } from 'lucide-react';

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  formError: string;
  dragActive: boolean;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingImage: boolean;
  imagePreview: string | null;
  imageFile: File | null;
  removeImage: () => void;
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  systemUsers: any[];
  handleSubmit: (e: React.FormEvent) => void;
  errors: Record<string, string>;
}

export const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({
  isOpen,
  onClose,
  formError,
  dragActive,
  handleDrag,
  handleDrop,
  handleFileChange,
  isUploadingImage,
  imagePreview,
  imageFile,
  removeImage,
  formData,
  handleInputChange,
  systemUsers,
  handleSubmit,
  errors,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const getInputClass = (field: string, isSelectOrDate = false) => {
    const base = "w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none transition duration-150";
    if (errors[field]) {
      return `${base} border-rose-300 bg-rose-50/10 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-rose-955 placeholder-rose-300`;
    }
    const textClass = isSelectOrDate ? "text-slate-750 cursor-pointer" : "text-slate-900";
    return `${base} border-slate-250 focus:border-indigo-600 ${textClass}`;
  };

  const getLabelClass = (field: string) => {
    const baseClass = "text-[10px] font-bold uppercase tracking-wider transition-colors duration-150";
    if (errors[field]) {
      return `${baseClass} text-rose-600`;
    }
    return `${baseClass} text-slate-455`;
  };

  const renderFieldError = (field: string) => {
    if (!errors[field]) return null;
    return (
      <span className="text-[10px] text-rose-600 font-bold block mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
        {errors[field]}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-600" /> Create Project
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-655 cursor-pointer font-bold text-xs">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-755 rounded-xl p-3 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* PROJECT COVER IMAGE SECTION */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">
              Project Cover Image
            </span>

            {/* Drag and Drop Container */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`w-full min-h-[140px] border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition duration-200 relative ${
                dragActive ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploadingImage}
              />

              {isUploadingImage ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-500">
                    Uploading cover image to Cloudinary...
                  </span>
                </div>
              ) : imagePreview ? (
                <div className="flex items-center gap-4 w-full px-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-16 h-20 object-cover rounded-lg border border-slate-200 shadow-3xs"
                  />
                  <div className="flex-1 leading-tight min-w-0">
                    <span className="block text-xs font-bold text-slate-800 truncate">
                      {imageFile?.name || 'Uploaded Cover'}
                    </span>
                    <span className="text-[10px] text-emerald-650 font-bold block mt-1">
                      Ready to save
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center p-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Drag and drop your poster, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-indigo-600 hover:text-indigo-800 transition font-black underline cursor-pointer"
                    >
                      browse files
                    </button>
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1 font-medium">
                    Supports: JPG, JPEG, PNG, WEBP (Max 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Input fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={getLabelClass('title')}>Title</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className={getInputClass('title')}
              />
              {renderFieldError('title')}
            </div>
            <div className="space-y-1">
              <label className={getLabelClass('budget')}>Budget ($)</label>
              <input
                type="number"
                name="budget"
                required
                value={formData.budget}
                onChange={handleInputChange}
                className={getInputClass('budget')}
              />
              {renderFieldError('budget')}
            </div>
            <div className="space-y-1">
              <label className={getLabelClass('genre')}>Genre</label>
              <input
                type="text"
                name="genre"
                required
                value={formData.genre}
                onChange={handleInputChange}
                className={getInputClass('genre')}
              />
              {renderFieldError('genre')}
            </div>
            <div className="space-y-1">
              <label className={getLabelClass('format')}>Format</label>
              <input
                type="text"
                name="format"
                required
                value={formData.format}
                onChange={handleInputChange}
                className={getInputClass('format')}
              />
              {renderFieldError('format')}
            </div>
            <div className="space-y-1">
              <label className={getLabelClass('language')}>Language</label>
              <input
                type="text"
                name="language"
                required
                value={formData.language}
                onChange={handleInputChange}
                className={getInputClass('language')}
              />
              {renderFieldError('language')}
            </div>
            <div className="space-y-1">
              <label className={getLabelClass('productionManager')}>Project Manager</label>
              <select
                name="productionManager"
                required
                value={formData.productionManager}
                onChange={handleInputChange}
                className={getInputClass('productionManager', true)}
              >
                <option value="">Select Manager...</option>
                {systemUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
              {renderFieldError('productionManager')}
            </div>
            <div className="space-y-1">
              <label className={getLabelClass('startDate')}>Start Date</label>
              <input
                type="date"
                name="startDate"
                required
                value={formData.startDate}
                onChange={handleInputChange}
                className={getInputClass('startDate', true)}
              />
              {renderFieldError('startDate')}
            </div>
            <div className="space-y-1">
              <label className={getLabelClass('endDate')}>End Date</label>
              <input
                type="date"
                name="endDate"
                required
                value={formData.endDate}
                onChange={handleInputChange}
                className={getInputClass('endDate', true)}
              />
              {renderFieldError('endDate')}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">
              Logline
            </label>
            <input
              type="text"
              name="logline"
              value={formData.logline || ''}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">
              Synopsis
            </label>
            <textarea
              name="synopsis"
              value={formData.synopsis || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 resize-none"
            />
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-655 hover:bg-slate-100 text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isUploadingImage}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreateModal;
