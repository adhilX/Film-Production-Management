export interface FundRequest {
  _id: string;
  productionId: string;
  requestedBy: {
    _id: string;
    name: string;
    email: string;
  };
  title: string;
  description: string;
  category: string;
  requestedAmount: number; // Stored in smallest currency units (paise/cents)
  approvedAmount: number;  // Stored in smallest currency units (paise/cents)
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  rejectionReason?: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
