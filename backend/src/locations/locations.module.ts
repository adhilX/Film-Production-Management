import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { Location, LocationSchema } from './schemas/location.schema';
import { LocationBooking, LocationBookingSchema } from './schemas/location-booking.schema';
import { ProductionsModule } from '../productions/productions.module';
import { LocationBookingsService } from './services/location-bookings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Location.name, schema: LocationSchema },
      { name: LocationBooking.name, schema: LocationBookingSchema },
    ]),
    ProductionsModule,
  ],
  controllers: [LocationsController],
  providers: [LocationsService, LocationBookingsService],
  exports: [MongooseModule, LocationsService, LocationBookingsService],
})
export class LocationsModule {}
