import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CheckProduction } from '../auth/decorators/check-production.decorator';

@ApiTags('Locations Management')
@ApiBearerAuth('JWT-auth')
@Controller('productions/:productionId/locations')
@UseGuards(AuthGuard, PermissionsGuard)
@CheckProduction()
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  // ==========================================
  // BOOKING ENDPOINTS
  // ==========================================

  @Post('bookings')
  @Permissions('locations.book')
  @ApiOperation({ summary: 'Submit a new booking request for a location' })
  @ApiResponse({ status: 201, description: 'Booking request created.' })
  @ApiResponse({ status: 400, description: 'Invalid date range.' })
  createBooking(
    @Param('productionId') productionId: string,
    @Body() createDto: CreateBookingDto,
    @Req() req: any,
  ) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    return this.locationsService.createBooking(productionId, createDto, req.user._id);
  }

  @Get('bookings')
  @Permissions('locations.view')
  @ApiOperation({ summary: 'List all bookings for a production' })
  @ApiResponse({ status: 200, description: 'List of bookings.' })
  getBookings(@Param('productionId') productionId: string) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    return this.locationsService.getBookings(productionId);
  }

  @Patch('bookings/:id/status')
  @ApiOperation({ summary: 'Update booking status (Approve, Reject, or Cancel)' })
  @ApiResponse({ status: 200, description: 'Booking status updated.' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
  @ApiResponse({ status: 409, description: 'Collision / overlap check conflict.' })
  updateBookingStatus(
    @Param('productionId') productionId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateBookingStatusDto,
    @Req() req: any,
  ) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid booking ID format');
    }
    const userPermissions = req.user.permissions || [];
    const isSuperAdmin = userPermissions.includes('roles.manage');
    return this.locationsService.updateBookingStatus(
      productionId,
      id,
      updateDto,
      req.user._id,
      userPermissions,
      isSuperAdmin,
    );
  }

  // ==========================================
  // PHYSICAL LOCATION ENDPOINTS
  // ==========================================

  @Post()
  @Permissions('locations.create')
  @ApiOperation({ summary: 'Create a new physical location' })
  @ApiResponse({ status: 201, description: 'Location created.' })
  @ApiResponse({ status: 409, description: 'Location name duplicate.' })
  create(
    @Param('productionId') productionId: string,
    @Body() createDto: CreateLocationDto,
    @Req() req: any,
  ) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    return this.locationsService.create(productionId, createDto, req.user._id);
  }

  @Get()
  @Permissions('locations.view')
  @ApiOperation({ summary: 'List all physical locations for a production' })
  @ApiResponse({ status: 200, description: 'List of locations.' })
  findAll(@Param('productionId') productionId: string) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    return this.locationsService.findAll(productionId);
  }

  @Get(':id')
  @Permissions('locations.view')
  @ApiOperation({ summary: 'Get a single location by ID' })
  @ApiResponse({ status: 200, description: 'The location.' })
  @ApiResponse({ status: 404, description: 'Location not found.' })
  findOne(
    @Param('productionId') productionId: string,
    @Param('id') id: string,
  ) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid location ID format');
    }
    return this.locationsService.findOne(productionId, id);
  }

  @Patch(':id')
  @Permissions('locations.update')
  @ApiOperation({ summary: 'Update a physical location' })
  @ApiResponse({ status: 200, description: 'Location updated.' })
  @ApiResponse({ status: 409, description: 'Location name duplicate.' })
  update(
    @Param('productionId') productionId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateLocationDto,
    @Req() req: any,
  ) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid location ID format');
    }
    return this.locationsService.update(productionId, id, updateDto, req.user._id);
  }

  @Delete(':id')
  @Permissions('locations.delete')
  @ApiOperation({ summary: 'Delete a physical location' })
  @ApiResponse({ status: 200, description: 'Location deleted.' })
  @ApiResponse({ status: 409, description: 'Cannot delete location with active bookings.' })
  delete(
    @Param('productionId') productionId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid location ID format');
    }
    return this.locationsService.delete(productionId, id, req.user._id);
  }
}
