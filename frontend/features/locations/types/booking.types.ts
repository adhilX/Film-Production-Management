import type { Location } from './location.types';

export interface LocationBooking {
  _id: string;
  productionId: string;
  locationId: Location;
  requestedBy: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  startDate: string;
  endDate: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}
