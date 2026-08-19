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
