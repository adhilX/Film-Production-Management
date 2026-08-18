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

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    @InjectModel(LocationBooking.name) private bookingModel: Model<LocationBookingDocument>,
    @InjectModel(Production.name) private productionModel: Model<ProductionDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Helper to retrieve a transaction session if running in a replica set environment.
   * Otherwise returns null to bypass transactions.
   */
  private async getSession(): Promise<any> {
    try {
      const connAny = this.connection as any;
      const isReplica = connAny.client?.topology?.description?.type?.includes('ReplicaSet') ||
                        Array.from(connAny.client?.topology?.description?.servers?.values() || []).some(
                          (server: any) => server.type?.includes('ReplicaSet')
                        );
      if (isReplica) {
        const session = await this.connection.startSession();
        session.startTransaction();
        return session;
      }
    } catch (e) {
      // Fallback to standalone
    }
    return null;
  }

  // ==========================================
  // PHYSICAL LOCATION CRUD
  // ==========================================

  async create(productionId: string, createDto: CreateLocationDto, userId: string): Promise<Location> {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new NotFoundException(`Production with ID ${productionId} not found.`);
    }
    const session = await this.getSession();

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
    const session = await this.getSession();

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
      Object.assign(location, updateDto);
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
    const session = await this.getSession();

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
    if (!Types.ObjectId.isValid(createDto.locationId) || !Types.ObjectId.isValid(productionId)) {
      throw new NotFoundException(`Location with ID ${createDto.locationId} not found in this production.`);
    }
    const session = await this.getSession();

    try {
      // 1. Verify location exists and belongs to this production
      const query = this.locationModel.findOne({
        _id: new Types.ObjectId(createDto.locationId),
        productionId: new Types.ObjectId(productionId),
      });
      const location = session ? await query.session(session).exec() : await query.exec();

      if (!location) {
        throw new NotFoundException(`Location with ID ${createDto.locationId} not found in this production.`);
      }

      // 2. Validate dates
      const start = new Date(createDto.startDate);
      const end = new Date(createDto.endDate);

      if (start >= end) {
        throw new BadRequestException('Start date must be before end date.');
      }

      const newBooking = new this.bookingModel({
        productionId: new Types.ObjectId(productionId),
        locationId: location._id,
        requestedBy: new Types.ObjectId(userId),
        startDate: start,
        endDate: end,
        status: 'Pending',
      });
      const saved = session ? await newBooking.save({ session }) : await newBooking.save();

      // Audit Log
      await this.auditLogsService.log(
        userId,
        'LOCATION_BOOKING_CREATED',
        saved._id.toString(),
        'LocationBooking',
        '',
        JSON.stringify({ locationId: saved.locationId, startDate: saved.startDate, endDate: saved.endDate }),
        session || undefined,
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

  async getBookings(productionId: string): Promise<LocationBooking[]> {
    if (!Types.ObjectId.isValid(productionId)) {
      return [];
    }
    return this.bookingModel
      .find({ productionId: new Types.ObjectId(productionId) })
      .populate('locationId')
      .populate('requestedBy', 'email name')
      .exec();
  }

  async updateBookingStatus(
    productionId: string,
    bookingId: string,
    updateDto: UpdateBookingStatusDto,
    userId: string,
    userPermissions: string[],
    isSuperAdmin: boolean,
  ): Promise<LocationBooking> {
    if (!Types.ObjectId.isValid(bookingId) || !Types.ObjectId.isValid(productionId)) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found in this production.`);
    }
    const session = await this.getSession();

    try {
      const query = this.bookingModel.findOne({
        _id: new Types.ObjectId(bookingId),
        productionId: new Types.ObjectId(productionId),
      });
      const booking = session ? await query.session(session).exec() : await query.exec();

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found in this production.`);
      }

      // Check if user is the Production Manager
      const prodQuery = this.productionModel.findById(productionId);
      const production = session ? await prodQuery.session(session).exec() : await prodQuery.exec();
      const isProductionManager = production && production.productionManager && production.productionManager.toString() === userId.toString();

      // Granular Security Enforcements
      if (updateDto.status === 'Approved' || updateDto.status === 'Rejected') {
        const canApprove = isSuperAdmin || userPermissions.includes('locations.approve');
        if (!canApprove) {
          throw new ForbiddenException('You do not have permission to approve or reject location bookings.');
        }
      } else if (updateDto.status === 'Cancelled') {
        const isRequester = booking.requestedBy.toString() === userId.toString();
        const canCancel = isRequester || isProductionManager || isSuperAdmin || userPermissions.includes('locations.approve');
        if (!canCancel) {
          throw new ForbiddenException('You do not have permission to cancel this location booking.');
        }
      } else {
        throw new BadRequestException(`Unsupported status transition to: "${updateDto.status}"`);
      }

      // Validate transitions
      if (booking.status === 'Cancelled') {
        throw new BadRequestException('Cannot modify status of a cancelled booking.');
      }
      if (booking.status === 'Rejected' && updateDto.status !== 'Cancelled') {
        throw new BadRequestException('Cannot modify status of a rejected booking unless cancelling.');
      }

      // Check collision/overlap on Approval
      if (updateDto.status === 'Approved') {
        const start = booking.startDate;
        const end = booking.endDate;

        const overlapQuery = this.bookingModel.findOne({
          locationId: booking.locationId,
          status: 'Approved',
          _id: { $ne: booking._id },
          $or: [
            { startDate: { $lt: end }, endDate: { $gt: start } }
          ],
        });
        const overlappingApprovedBooking = session ? await overlapQuery.session(session).exec() : await overlapQuery.exec();

        if (overlappingApprovedBooking) {
          throw new ConflictException('The location is already booked for the selected dates.');
        }
      }

      const previousStatus = booking.status;
      booking.status = updateDto.status;
      if (updateDto.status === 'Rejected') {
        booking.rejectionReason = updateDto.rejectionReason;
      }
      
      const saved = session ? await booking.save({ session }) : await booking.save();

      // Audit Log mapping
      let action = 'LOCATION_BOOKING_UPDATED';
      if (updateDto.status === 'Approved') action = 'LOCATION_BOOKING_APPROVED';
      if (updateDto.status === 'Rejected') action = 'LOCATION_BOOKING_REJECTED';
      if (updateDto.status === 'Cancelled') action = 'LOCATION_BOOKING_CANCELLED';

      await this.auditLogsService.log(
        userId,
        action,
        saved._id.toString(),
        'LocationBooking',
        previousStatus,
        updateDto.status,
        session || undefined,
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
}
