'use client';

import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function SignaturePad({ value, onChange, error }: SignaturePadProps) {
  const padRef = useRef<SignatureCanvas>(null);
  const [penThickness, setPenThickness] = useState(2.5);
  
  // To avoid resizing coordinate issues, we can track the container width
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If there is an initial value and the pad is currently empty, load it
    if (value && padRef.current && padRef.current.isEmpty()) {
      padRef.current.fromDataURL(value);
    }
  }, [value]);
  
  useEffect(() => {
    // Simple resize handler to fix coordinate mapping when window resizes
    const handleResize = () => {
      if (padRef.current && containerRef.current) {
        const canvas = padRef.current.getCanvas();
        const container = containerRef.current;
        
        // Save current signature
        const data = padRef.current.toDataURL();
        
        // Update intrinsic canvas resolution to match CSS layout
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        
        // Restore signature
        if (data) {
          padRef.current.fromDataURL(data);
        }
      }
    };
    
    // Initial size setup
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEnd = () => {
    if (padRef.current) {
      if (padRef.current.isEmpty()) {
        onChange('');
      } else {
        // Save as base64 png
        onChange(padRef.current.getTrimmedCanvas().toDataURL('image/png'));
      }
    }
  };

  const clearSignature = () => {
    if (padRef.current) {
      padRef.current.clear();
      onChange('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-650 mb-2">Digital Signature Pad</label>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold text-slate-400">Pen Thickness:</span>
            <input 
              type="range" 
              min="1" max="6" step="0.5" 
              value={penThickness} 
              onChange={(e) => setPenThickness(parseFloat(e.target.value))}
              className="w-20 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4f46e5]"
            />
          </div>
        </div>
        <button 
          type="button" 
          onClick={clearSignature}
          className="text-slate-400 hover:text-red-500 text-xs font-semibold flex items-center gap-1 transition mb-1.5"
        >
          <RotateCcw className="w-3 h-3" /> Clear Signature
        </button>
      </div>
      
      <div 
        ref={containerRef}
        className={`relative bg-slate-50 rounded-xl border ${error ? 'border-red-500/50' : 'border-slate-200'} overflow-hidden cursor-crosshair h-40 w-full`}
      >
        <SignatureCanvas
          ref={padRef}
          penColor="#000000"
          maxWidth={penThickness}
          minWidth={penThickness / 2}
          canvasProps={{
            className: "w-full h-full block bg-slate-50"
          }}
          onEnd={handleEnd}
        />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 pointer-events-none select-none">
          Sign inside this area
        </div>
      </div>
      {error && <span className="text-red-505 text-xs block font-semibold">{error}</span>}
    </div>
  );
}
