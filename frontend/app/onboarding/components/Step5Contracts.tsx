'use client';

import React, { useRef, useState, useEffect } from 'react';
import { FileSignature, RotateCcw } from 'lucide-react';

interface Step5Props {
  formData: any;
  errors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFieldChange: (name: string, value: any) => void;
  adminFeedback?: string | null;
}

export default function Step5Contracts({ formData, errors, onChange, onFieldChange, adminFeedback }: Step5Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#f59e0b'; // amber-500 stroke
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    // If signature data exists already, draw it on canvas
    if (formData.signatureData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = formData.signatureData;
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveSignature();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onFieldChange('signatureData', '');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Check if the canvas is blank before saving
    const buffer = new Uint32Array(canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    const isBlank = !buffer.some(color => color !== 0);
    if (!isBlank) {
      onFieldChange('signatureData', canvas.toDataURL());
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <FileSignature className="w-5 h-5 text-amber-500" /> Step 5: NDA & Signatures
      </h2>

      {/* NDA Checkbox */}
      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl cursor-pointer">
          <input 
            type="checkbox"
            name="agreeNda"
            checked={formData.agreeNda}
            onChange={onChange}
            className="mt-0.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-200">Non-Disclosure Agreement (NDA)</span>
            <p className="text-slate-400 mt-0.5 font-mono">I agree to keep all script assets, character details, budget details, and production footage strictly confidential.</p>
          </div>
        </label>
        {errors.agreeNda && <span className="text-red-400 text-xs block">{errors.agreeNda}</span>}

        {/* Terms Checkbox */}
        <label className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl cursor-pointer">
          <input 
            type="checkbox"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={onChange}
            className="mt-0.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-200">Platform Terms & Conditions</span>
            <p className="text-slate-400 mt-0.5 font-mono">I accept all policies regarding contractor verification, payment schedules, and compliance standards.</p>
          </div>
        </label>
        {errors.agreeTerms && <span className="text-red-400 text-xs block">{errors.agreeTerms}</span>}
      </div>

      {/* Digital Signature Drawing Board */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">Digital Signature Pad</label>
          <button 
            type="button" 
            onClick={clearSignature}
            className="text-slate-500 hover:text-amber-500 text-xs font-semibold flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" /> Clear Signature
          </button>
        </div>
        
        <div className={`relative bg-slate-950 rounded-xl border ${errors.signatureData ? 'border-red-500/50' : 'border-slate-800'} overflow-hidden cursor-crosshair`}>
          <canvas
            ref={canvasRef}
            width={600}
            height={160}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-40 block"
          />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 pointer-events-none select-none">
            Sign inside this area
          </div>
        </div>
        {errors.signatureData && <span className="text-red-400 text-xs block">{errors.signatureData}</span>}
      </div>
    </div>
  );
}
