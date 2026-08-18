import { axiosClient } from '@/lib/axios';
import type { Location, LocationBooking } from '@/app/types';

export const locationsService = {
  // Physical Locations CRUD
  async getLocations(productionId: string): Promise<Location[]> {
    const res = await axiosClient.get<Location[]>(`/productions/${productionId}/locations`);
    return res.data;
  },

  async getLocation(productionId: string, locationId: string): Promise<Location> {
    const res = await axiosClient.get<Location>(`/productions/${productionId}/locations/${locationId}`);
    return res.data;
  },

  async createLocation(productionId: string, payload: Partial<Location>): Promise<Location> {
    const res = await axiosClient.post<Location>(`/productions/${productionId}/locations`, payload);
    return res.data;
  },

  async updateLocation(productionId: string, locationId: string, payload: Partial<Location>): Promise<Location> {
    const res = await axiosClient.patch<Location>(`/productions/${productionId}/locations/${locationId}`, payload);
    return res.data;
  },

  async deleteLocation(productionId: string, locationId: string): Promise<void> {
    await axiosClient.delete(`/productions/${productionId}/locations/${locationId}`);
  },

  // Location Bookings
  async getBookings(productionId: string): Promise<LocationBooking[]> {
    const res = await axiosClient.get<LocationBooking[]>(`/productions/${productionId}/locations/bookings`);
    return res.data;
  },

  async createBooking(
    productionId: string,
    payload: { locationId: string; startDate: string; endDate: string },
  ): Promise<LocationBooking> {
    const res = await axiosClient.post<LocationBooking>(`/productions/${productionId}/locations/bookings`, payload);
    return res.data;
  },

  async updateBookingStatus(
    productionId: string,
    bookingId: string,
    payload: { status: string; rejectionReason?: string },
  ): Promise<LocationBooking> {
    const res = await axiosClient.patch<LocationBooking>(
      `/productions/${productionId}/locations/bookings/${bookingId}/status`,
      payload,
    );
    return res.data;
  },
};

export default locationsService;
