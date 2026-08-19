import React from 'react';
import { X } from 'lucide-react';
import type { Location } from '@/app/types';

interface LocationAddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  bookingLocationId: string;
  setBookingLocationId: (val: string) => void;
  bookingStart: string;
  setBookingStart: (val: string) => void;
  bookingEnd: string;
  setBookingEnd: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  bookingFieldErrors?: Record<string, string>;
}

export const LocationAddBookingModal: React.FC<LocationAddBookingModalProps> = ({
  isOpen,
  onClose,
  locations,
  bookingLocationId,
  setBookingLocationId,
  bookingStart,
  setBookingStart,
  bookingEnd,
  setBookingEnd,
  onSubmit,
  bookingFieldErrors = {},
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center bg-slate-50/50 px-6 py-4 border-b border-slate-200">
          <span className="text-sm font-extrabold text-slate-800">Submit Booking Request</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-655 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Select Location *</label>
            <select
              value={bookingLocationId}
              onChange={(e) => setBookingLocationId(e.target.value)}
              className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 cursor-pointer font-semibold ${
                bookingFieldErrors.locationId ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
              }`}
            >
              <option value="">-- Choose Location --</option>
              {locations.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name} ({l.address})
                </option>
              ))}
            </select>
            {bookingFieldErrors.locationId && (
              <p className="text-[10px] text-red-500 font-bold mt-1">{bookingFieldErrors.locationId}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1">Start Date *</label>
            <input
              type="date"
              required
              value={bookingStart}
              onChange={(e) => setBookingStart(e.target.value)}
              className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 cursor-pointer font-semibold ${
                bookingFieldErrors.startDate ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
              }`}
            />
            {bookingFieldErrors.startDate && (
              <p className="text-[10px] text-red-500 font-bold mt-1">{bookingFieldErrors.startDate}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1">End Date *</label>
            <input
              type="date"
              required
              value={bookingEnd}
              onChange={(e) => setBookingEnd(e.target.value)}
              className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 cursor-pointer font-semibold ${
                bookingFieldErrors.endDate ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
              }`}
            />
            {bookingFieldErrors.endDate && (
              <p className="text-[10px] text-red-500 font-bold mt-1">{bookingFieldErrors.endDate}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-slate-105 hover:bg-slate-200 border border-slate-250 text-slate-655 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationAddBookingModal;
