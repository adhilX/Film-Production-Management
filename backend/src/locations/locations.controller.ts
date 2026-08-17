import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationStatusDto } from './dto/update-location-status.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CheckProduction } from '../auth/decorators/check-production.decorator';

@ApiTags('Location Bookings')
@ApiBearerAuth('JWT-auth')
@Controller('productions/:productionId/locations')
@UseGuards(AuthGuard, PermissionsGuard)
@CheckProduction()
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @Permissions('locations.book')
  @ApiOperation({
    summary: 'Submit a new location booking request for a production',
  })
  @ApiResponse({
    status: 201,
    description: 'Location booking request submitted.',
  })
  @ApiResponse({
    status: 422,
    description: 'Double-booking date conflict or invalid date range.',
  })
  create(@Body() createDto: CreateLocationDto) {
    return this.locationsService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all scheduled location bookings for a production',
  })
  @ApiResponse({ status: 200, description: 'Array of location bookings.' })
  findAll(@Param('productionId') productionId: string) {
    return this.locationsService.findAll(productionId);
  }

  @Patch(':id/status')
  @Permissions('locations.approve')
  @ApiOperation({
    summary:
      'Update location booking status with Mongoose transaction & overlap conflict checks',
  })
  @ApiResponse({
    status: 200,
    description: 'Location booking status updated successfully.',
  })
  @ApiResponse({
    status: 422,
    description: 'Date collision conflict with an existing booked location.',
  })
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateLocationStatusDto,
    @Req() req: any,
  ) {
    return this.locationsService.updateStatus(id, updateDto, req.user._id);
  }
}
