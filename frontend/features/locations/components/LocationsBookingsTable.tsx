import React from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import { PermissionGuard } from '@/app/components/permission-guard';
import type { LocationBooking } from '@/features/locations/types';

interface LocationsBookingsTableProps {
  bookings: LocationBooking[];
  handleUpdateBookingStatus: (id: string, status: string) => void;
  handleOpenReject: (id: string) => void;
  canCancelBooking: (booking: LocationBooking) => boolean;
}

export const LocationsBookingsTable: React.FC<LocationsBookingsTableProps> = ({
  bookings,
  handleUpdateBookingStatus,
  handleOpenReject,
  canCancelBooking,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-150">
              <th className="p-4 text-[10px] font-bold text-slate-450 uppercase tracking-wider">Location</th>
              <th className="p-4 text-[10px] font-bold text-slate-455 uppercase tracking-wider">Scheduled Dates</th>
              <th className="p-4 text-[10px] font-bold text-slate-455 uppercase tracking-wider">Requested By</th>
              <th className="p-4 text-[10px] font-bold text-slate-455 uppercase tracking-wider">Status</th>
              <th className="p-4 text-[10px] font-bold text-slate-455 uppercase tracking-wider">Details</th>
              <th className="p-4 text-[10px] font-bold text-slate-455 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {bookings.length > 0 ? (
              bookings.map((booking) => {
                const startStr = new Date(booking.startDate).toLocaleDateString();
                const endStr = new Date(booking.endDate).toLocaleDateString();
                
                // Collision check on frontend for visual alert warnings
                const isOverlapping = bookings.some(
                  (other) =>
                    other._id !== booking._id &&
                    other.locationId?._id === booking.locationId?._id &&
                    other.status === 'Approved' &&
                    new Date(other.startDate) < new Date(booking.endDate) &&
                    new Date(other.endDate) > new Date(booking.startDate)
                );

                return (
                  <tr key={booking._id} className="hover:bg-slate-50/30 transition">
                    <td className="p-4">
                      <span className="font-bold text-slate-700 block">{booking.locationId?.name || 'Deleted Location'}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{booking.locationId?.address}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-slate-650 flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {startStr} — {endStr}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-slate-600 block">{booking.requestedBy?.name || 'Migration Fallback'}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{booking.requestedBy?.email}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`py-0.5 px-2 border rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                            booking.status === 'Approved'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : booking.status === 'Pending'
                              ? 'bg-amber-50 border-amber-100 text-amber-700'
                              : booking.status === 'Rejected'
                              ? 'bg-red-50 border-red-100 text-red-700'
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                        >
                          {booking.status}
                        </span>
                        {isOverlapping && booking.status !== 'Approved' && (
                          <div className="flex items-center gap-1 py-0.5 px-1.5 bg-amber-50 border border-amber-150 text-amber-700 rounded-lg text-[9px] font-bold" title="Overlaps with an approved booking">
                            <AlertTriangle size={10} /> Collision Warn
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 max-w-[200px]">
                      {booking.status === 'Rejected' && booking.rejectionReason && (
                        <span className="text-[10px] text-slate-400 leading-normal block">
                          Reason: &quot;{booking.rejectionReason}&quot;
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {booking.status === 'Pending' && (
                          <PermissionGuard permission="locations.approve">
                            <button
                              onClick={() => handleUpdateBookingStatus(booking._id, 'Approved')}
                              className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-lg text-[10px] cursor-pointer transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenReject(booking._id)}
                              className="py-1 px-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-lg text-[10px] cursor-pointer transition"
                            >
                              Reject
                            </button>
                          </PermissionGuard>
                        )}

                        {(booking.status === 'Approved' || booking.status === 'Pending') && canCancelBooking(booking) && (
                          <button
                            onClick={() => handleUpdateBookingStatus(booking._id, 'Cancelled')}
                            className="py-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-650 font-bold rounded-lg text-[10px] cursor-pointer transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-12 text-slate-400 text-center font-medium">
                  No location bookings found for this project schedule.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LocationsBookingsTable;
