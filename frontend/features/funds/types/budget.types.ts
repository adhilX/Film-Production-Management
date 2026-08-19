export interface Budget {
  _id: string;
  productionId: string;
  totalBudget: number;      // Stored in smallest currency units (paise/cents)
  allocatedAmount: number;  // Stored in smallest currency units (paise/cents)
  remainingAmount: number;  // Stored in smallest currency units (paise/cents)
  currency: string;
  createdBy: string;
  updatedBy: string;
  createdAt?: string;
  updatedAt?: string;
}
