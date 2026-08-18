import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Location, LocationDocument } from './schemas/location.schema';
import { LocationBooking, LocationBookingDocument } from './schemas/location-booking.schema';
import { Production, ProductionDocument } from '../productions/schemas/production.schema';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getTransactionSession } from '../common/utils/transaction.util';

import { LocationBookingsService } from './services/location-bookings.service';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    @InjectModel(LocationBooking.name) private bookingModel: Model<LocationBookingDocument>,
    @InjectModel(Production.name) private productionModel: Model<ProductionDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly auditLogsService: AuditLogsService,
    private readonly locationBookingsService: LocationBookingsService,
  ) {}

  // ==========================================
  // PHYSICAL LOCATION CRUD
  // ==========================================

  async create(productionId: string, createDto: CreateLocationDto, userId: string): Promise<Location> {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new NotFoundException(`Production with ID ${productionId} not found.`);
    }
    const session = await getTransactionSession(this.connection);

    try {
      // 1. Check duplicate location names within the same project
      const normalizedName = createDto.name.trim();
      const query = this.locationModel.findOne({
        productionId: new Types.ObjectId(productionId),
        name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
      });

      const duplicate = session ? await query.session(session).exec() : await query.exec();

      if (duplicate) {
        throw new ConflictException(`Location with name "${createDto.name}" already exists in this production.`);
      }

      const newLocation = new this.locationModel({
        ...createDto,
        productionId: new Types.ObjectId(productionId),
      });
      const saved = session ? await newLocation.save({ session }) : await newLocation.save();

      // Audit Log
      await this.auditLogsService.log(
        userId,
        'LOCATION_CREATED',
        saved._id.toString(),
        'Location',
        '',
        JSON.stringify({ name: saved.name, address: saved.address }),
        session || undefined,
        'LOCATIONS',
        { productionId },
      );

      if (session) {
        await session.commitTransaction();
      }
      return saved;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  async findAll(productionId: string): Promise<Location[]> {
    if (!Types.ObjectId.isValid(productionId)) {
      return [];
    }
    return this.locationModel.find({ productionId: new Types.ObjectId(productionId) }).exec();
  }

  async findOne(productionId: string, id: string): Promise<Location> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(productionId)) {
      throw new NotFoundException(`Location with ID ${id} not found in this production.`);
    }
    const location = await this.locationModel.findOne({
      _id: new Types.ObjectId(id),
      productionId: new Types.ObjectId(productionId),
    }).exec();

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found in this production.`);
    }
    return location;
  }

  async update(
    productionId: string,
    id: string,
    updateDto: UpdateLocationDto,
    userId: string,
  ): Promise<Location> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(productionId)) {
      throw new NotFoundException(`Location with ID ${id} not found in this production.`);
    }
    const session = await getTransactionSession(this.connection);

    try {
      const query = this.locationModel.findOne({
        _id: new Types.ObjectId(id),
        productionId: new Types.ObjectId(productionId),
      });
      const location = session ? await query.session(session).exec() : await query.exec();

      if (!location) {
        throw new NotFoundException(`Location with ID ${id} not found in this production.`);
      }

      // Check name duplicate if it's being changed
      if (updateDto.name && updateDto.name.trim().toLowerCase() !== location.name.toLowerCase()) {
        const normalizedName = updateDto.name.trim();
        const dupQuery = this.locationModel.findOne({
          productionId: new Types.ObjectId(productionId),
          name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
          _id: { $ne: location._id },
        });
        const duplicate = session ? await dupQuery.session(session).exec() : await dupQuery.exec();

        if (duplicate) {
          throw new ConflictException(`Location with name "${updateDto.name}" already exists in this production.`);
        }
      }

      const previousState = JSON.stringify({ name: location.name, address: location.address });
      
      // Update fields
      for (const [key, value] of Object.entries(updateDto)) {
        if (value !== undefined) {
          (location as any)[key] = value;
        }
      }
      const saved = session ? await location.save({ session }) : await location.save();

      // Audit Log
      await this.auditLogsService.log(
        userId,
        'LOCATION_UPDATED',
        saved._id.toString(),
        'Location',
        previousState,
        JSON.stringify({ name: saved.name, address: saved.address }),
        session || undefined,
        'LOCATIONS',
        { productionId },
      );

      if (session) {
        await session.commitTransaction();
      }
      return saved;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  async delete(productionId: string, id: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(productionId)) {
      throw new NotFoundException(`Location with ID ${id} not found in this production.`);
    }
    const session = await getTransactionSession(this.connection);

    try {
      const query = this.locationModel.findOne({
        _id: new Types.ObjectId(id),
        productionId: new Types.ObjectId(productionId),
      });
      const location = session ? await query.session(session).exec() : await query.exec();

      if (!location) {
        throw new NotFoundException(`Location with ID ${id} not found in this production.`);
      }

      // Safe deletion: prevent deletion if active bookings exist (Pending or Approved)
      const bookingQuery = this.bookingModel.findOne({
        locationId: location._id,
        status: { $in: ['Pending', 'Approved'] },
      });
      const activeBookings = session ? await bookingQuery.session(session).exec() : await bookingQuery.exec();

      if (activeBookings) {
        throw new ConflictException('Location has active bookings and cannot be deleted.');
      }

      const previousState = JSON.stringify({ name: location.name, address: location.address });
      
      if (session) {
        await this.locationModel.deleteOne({ _id: location._id }).session(session).exec();
      } else {
        await this.locationModel.deleteOne({ _id: location._id }).exec();
      }

      // Audit Log
      await this.auditLogsService.log(
        userId,
        'LOCATION_DELETED',
        location._id.toString(),
        'Location',
        previousState,
        '',
        session || undefined,
        'LOCATIONS',
        { productionId },
      );

      if (session) {
        await session.commitTransaction();
      }
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  // ==========================================
  // BOOKING OPERATIONS
  // ==========================================

  async createBooking(productionId: string, createDto: CreateBookingDto, userId: string): Promise<LocationBooking> {
    return this.locationBookingsService.createBooking(productionId, createDto, userId);
  }

  async getBookings(productionId: string): Promise<LocationBooking[]> {
    return this.locationBookingsService.getBookings(productionId);
  }

  async updateBookingStatus(
    productionId: string,
    bookingId: string,
    updateDto: UpdateBookingStatusDto,
    userId: string,
    userPermissions: string[],
    isSuperAdmin: boolean,
  ): Promise<LocationBooking> {
    return this.locationBookingsService.updateBookingStatus(
      productionId,
      bookingId,
      updateDto,
      userId,
      userPermissions,
      isSuperAdmin,
    );
  }
}
