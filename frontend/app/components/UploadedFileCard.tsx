'use client';

import React, { useState } from 'react';
import { CheckCircle2, Eye, Trash2 } from 'lucide-react';
import DocumentPreview from './DocumentPreview';

interface UploadedFileCardProps {
  fileUrl: string;
  fileName?: string;
  label?: string;
  successMessage?: string;
  onRemove: () => void;
}

export default function UploadedFileCard({
  fileUrl,
  fileName,
  label = 'Document',
  successMessage = 'Document uploaded successfully',
  onRemove,
}: UploadedFileCardProps) {
  const [showPreview, setShowPreview] = useState(true);

  if (!fileUrl) return null;

  const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
  const displayName = fileName || fileUrl.split('/').pop() || 'document.pdf';

  return (
    <div className="border border-slate-200/80 rounded-2xl p-4.5 bg-slate-50/50 space-y-4">
      {/* File details */}
      <div className="flex items-start gap-4">
        {/* Document icon thumbnail */}
        <div className="w-14 h-16 rounded-xl border border-slate-200 bg-white shadow-sm shrink-0 overflow-hidden flex items-center justify-center relative">
          {isPdf ? (
            <div className="w-full h-full flex flex-col p-1.5 gap-1 shrink-0 select-none overflow-hidden bg-indigo-50/30">
              <div className="w-6 h-1.5 bg-indigo-200 rounded" />
              <div className="w-full h-1 bg-slate-100 rounded" />
              <div className="w-full h-1 bg-slate-105 rounded" />
              <div className="w-4/5 h-1 bg-slate-100 rounded" />
              <div className="w-full h-2 bg-indigo-50 rounded border border-dashed border-indigo-200 mt-auto flex items-center justify-center text-[5px] font-bold text-[#4f46e5]">
                PDF
              </div>
            </div>
          ) : (
            <img src={fileUrl} alt="Thumbnail" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-emerald-755 text-xs font-bold mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in duration-200" />
            <span>{successMessage}</span>
          </div>
          <h4 className="text-xs font-bold text-slate-905 truncate">
            {displayName}
          </h4>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">
            {isPdf ? 'PDF' : 'Image'} • Uploaded just now
          </p>
        </div>

        {/* Trash Action */}
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-655 text-slate-400 transition"
          title="Delete file"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Actions Bar */}
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition flex items-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{showPreview ? 'Hide Preview' : 'Preview'}</span>
        </button>
      </div>

      {/* Embedded Document Preview */}
      {showPreview && (
        <DocumentPreview fileUrl={fileUrl} alt={`${label} Preview`} />
      )}
    </div>
  );
}
