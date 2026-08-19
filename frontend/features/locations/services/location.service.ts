import { apiClient } from '@/services/api/api-client';
import type { Location, LocationBooking } from '@/features/locations/types';

export const locationService = {
  // Physical Locations CRUD
  async getLocations(productionId: string): Promise<Location[]> {
    const res = await apiClient.get<Location[]>(`/productions/${productionId}/locations`);
    return res.data;
  },

  async getLocation(productionId: string, locationId: string): Promise<Location> {
    const res = await apiClient.get<Location>(`/productions/${productionId}/locations/${locationId}`);
    return res.data;
  },

  async createLocation(productionId: string, payload: Partial<Location>): Promise<Location> {
    const res = await apiClient.post<Location>(`/productions/${productionId}/locations`, payload);
    return res.data;
  },

  async updateLocation(productionId: string, locationId: string, payload: Partial<Location>): Promise<Location> {
    const res = await apiClient.patch<Location>(`/productions/${productionId}/locations/${locationId}`, payload);
    return res.data;
  },

  async deleteLocation(productionId: string, locationId: string): Promise<void> {
    await apiClient.delete(`/productions/${productionId}/locations/${locationId}`);
  },

  // Location Bookings
  async getBookings(productionId: string): Promise<LocationBooking[]> {
    const res = await apiClient.get<LocationBooking[]>(`/productions/${productionId}/locations/bookings`);
    return res.data;
  },

  async createBooking(
    productionId: string,
    payload: { locationId: string; startDate: string; endDate: string },
  ): Promise<LocationBooking> {
    const res = await apiClient.post<LocationBooking>(`/productions/${productionId}/locations/bookings`, payload);
    return res.data;
  },

  async updateBookingStatus(
    productionId: string,
    bookingId: string,
    payload: { status: string; rejectionReason?: string },
  ): Promise<LocationBooking> {
    const res = await apiClient.patch<LocationBooking>(
      `/productions/${productionId}/locations/bookings/${bookingId}/status`,
      payload,
    );
    return res.data;
  },
};

export default locationService;
