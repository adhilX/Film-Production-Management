import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Location, LocationDocument } from './schemas/location.schema';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationStatusDto } from './dto/update-location-status.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createDto: CreateLocationDto): Promise<Location> {
    const { productionId, name, address, startDate, endDate, status } = createDto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new UnprocessableEntityException('Start date must be before end date');
    }

    // Default status to 'Requested' if not provided
    const bookingStatus = status || 'Requested';

    const location = new this.locationModel({
      productionId: new Types.ObjectId(productionId),
      name,
      address,
      startDate: start,
      endDate: end,
      status: bookingStatus,
    });

    if (bookingStatus === 'Booked') {
      // Overlap check
      const overlapping = await this.locationModel.findOne({
        name,
        status: 'Booked',
        $or: [
          { startDate: { $lt: end }, endDate: { $gt: start } },
        ],
      }).exec();

      if (overlapping) {
        throw new UnprocessableEntityException(
          `Location double-booking detected: "${name}" is already booked during this period.`,
        );
      }
    }

    await location.save();
    return location;
  }

  async findAll(productionId: string): Promise<Location[]> {
    return this.locationModel.find({ productionId: new Types.ObjectId(productionId) }).exec();
  }

  async findOne(id: string): Promise<Location> {
    const loc = await this.locationModel.findById(id).exec();
    if (!loc) {
      throw new NotFoundException('Location not found');
    }
    return loc;
  }

  async updateStatus(
    id: string,
    updateDto: UpdateLocationStatusDto,
    userId: string,
  ): Promise<Location> {
    const { status: nextStatus } = updateDto;
    const location = await this.locationModel.findById(id).exec();
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const previousStatus = location.status;
    if (previousStatus === nextStatus) {
      return location;
    }

    // Try Mongoose Transaction
    let session: any = null;
    try {
      session = await this.connection.startSession();
      session.startTransaction();
    } catch (e) {
      // Transactions not supported by deployment (e.g. standalone local mongo)
      session = null;
    }

    try {
      if (nextStatus === 'Booked') {
        // Atomic conflict check: find overlapping Booked schedules for the same location name
        const overlapping = await this.locationModel.findOne(
          {
            name: location.name,
            status: 'Booked',
            _id: { $ne: location._id },
            $or: [
              { startDate: { $lt: location.endDate }, endDate: { $gt: location.startDate } },
            ],
          },
          null,
          session ? { session } : {},
        ).exec();

        if (overlapping) {
          throw new UnprocessableEntityException(
            `Location double-booking conflict: "${location.name}" is already booked during this period.`,
          );
        }
      }

      location.status = nextStatus;
      if (session) {
        await location.save({ session });
        await this.auditLogsService.log(
          userId,
          'LOCATION_STATUS_CHANGE',
          (location._id as any).toString(),
          'Location',
          previousStatus,
          nextStatus,
          session,
        );
        await session.commitTransaction();
      } else {
        await location.save();
        await this.auditLogsService.log(
          userId,
          'LOCATION_STATUS_CHANGE',
          (location._id as any).toString(),
          'Location',
          previousStatus,
          nextStatus,
        );
      }
    } catch (err) {
      if (session) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      if (session) {
        session.endSession();
      }
    }

    return this.findOne(id);
  }
}
