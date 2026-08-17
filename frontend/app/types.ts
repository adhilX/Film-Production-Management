export interface Role {
  _id: string;
  name: string;
  permissions: string[];
}

export interface User {
  id?: string;
  _id?: string;
  email: string;
  name: string;
  contractorType: 'Freelancer' | 'Cast' | 'Crew' | 'Supplier' | 'Agent' | 'Production Company' | 'None';
  systemRoleId?: string | { _id: string; name: string } | null;
  status: 'Draft' | 'Pending' | 'UnderReview' | 'Approved' | 'Rejected';
  isActive: boolean;
}

export interface Production {
  _id: string;
  title: string;
  description?: string;
  status: string;
}

export interface Character {
  _id: string;
  productionId: string;
  name: string;
  description?: string;
  assignments: string[] | User[];
}

export interface CastCrew {
  _id: string;
  userId: User;
  productionId: string;
  roleInProduction: string;
  characterId?: Character | null;
}

export interface LocationBooking {
  _id: string;
  productionId: string;
  name: string;
  address: string;
  status: 'Requested' | 'Under Review' | 'Approved' | 'Booked' | 'Completed';
  startDate: string;
  endDate: string;
}

export interface FundRequest {
  _id: string;
  productionId: string;
  requestedBy: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  justification: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  resourceId: string;
  resourceType: string;
  previousState?: string;
  newState?: string;
  timestamp: string;
}
