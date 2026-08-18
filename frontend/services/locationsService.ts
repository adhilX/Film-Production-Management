import { locationService } from '@/features/locations/services/location.service';

export const locationsService = {
  getLocations: locationService.getLocations.bind(locationService),
  getLocation: locationService.getLocation.bind(locationService),
  createLocation: locationService.createLocation.bind(locationService),
  updateLocation: locationService.updateLocation.bind(locationService),
  deleteLocation: locationService.deleteLocation.bind(locationService),
  getBookings: locationService.getBookings.bind(locationService),
  createBooking: locationService.createBooking.bind(locationService),
  updateBookingStatus: locationService.updateBookingStatus.bind(locationService),
};

export default locationsService;
