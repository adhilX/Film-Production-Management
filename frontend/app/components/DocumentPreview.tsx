'use client';

import React, { useState } from 'react';

interface DocumentPreviewProps {
  fileUrl: string;
  className?: string;
  maxHeight?: string | number;
  alt?: string;
}

export default function DocumentPreview({
  fileUrl,
  className = '',
  maxHeight = 380,
  alt = 'Document Preview',
}: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);
  if (!fileUrl) return null;

  const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
  const heightStyle = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;

  return (
    <div className={`w-full relative overflow-hidden flex items-center justify-center bg-slate-50/50 rounded-xl border border-slate-200/60 ${className}`} style={{ minHeight: '120px' }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10">
          <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isPdf ? (
        <iframe
          src={fileUrl}
          style={{ height: heightStyle }}
          onLoad={() => setLoading(false)}
          className="w-full bg-white rounded-lg pointer-events-auto"
          title="PDF Preview"
        />
      ) : (
        <img
          src={fileUrl}
          alt={alt}
          style={{ maxHeight: heightStyle }}
          onLoad={() => setLoading(false)}
          className="max-w-full object-contain rounded-lg shadow-sm"
        />
      )}
    </div>
  );
}
