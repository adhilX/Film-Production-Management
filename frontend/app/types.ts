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
  contractorType: 'Freelancer' | 'Cast' | 'Crew' | 'Supplier' | 'Agent' | 'Cast-Crew Agent' | 'TCS Team' | 'Production Company' | 'None';
  systemRoleId?: string | { _id: string; name: string } | null;
  status: 'Draft' | 'Pending' | 'UnderReview' | 'Approved' | 'Rejected';
  isActive: boolean;
  profile?: any;
}

export interface Production {
  _id: string;
  title: string;
  description?: string;
  genre: string;
  language: string;
  format: string;
  logline?: string;
  synopsis?: string;
  startDate: string;
  endDate: string;
  budget: number;
  productionManager: string | User;
  status: 'Draft' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled';
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
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

export interface Location {
  _id: string;
  productionId: string;
  name: string;
  address: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  locationType?: string;
  contactInfo?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

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
  rejectionReason?: string;
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
