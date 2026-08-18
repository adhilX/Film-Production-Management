import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { Location, LocationSchema } from './schemas/location.schema';
import { LocationBooking, LocationBookingSchema } from './schemas/location-booking.schema';
import { Production, ProductionSchema } from '../productions/schemas/production.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Location.name, schema: LocationSchema },
      { name: LocationBooking.name, schema: LocationBookingSchema },
      { name: Production.name, schema: ProductionSchema },
    ]),
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
