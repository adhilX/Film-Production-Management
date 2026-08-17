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
import { FundsService } from './funds.service';
import { CreateFundRequestDto } from './dto/create-fund-request.dto';
import { UpdateFundStatusDto } from './dto/update-fund-status.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CheckProduction } from '../auth/decorators/check-production.decorator';

@ApiTags('Budget & Funds')
@ApiBearerAuth('JWT-auth')
@Controller('productions/:productionId/funds')
@UseGuards(AuthGuard, PermissionsGuard)
@CheckProduction()
export class FundsController {
  constructor(private readonly fundsService: FundsService) {}

  @Post()
  @Permissions('funds.request')
  @ApiOperation({ summary: 'Submit a budget / fund request for a production' })
  @ApiResponse({
    status: 201,
    description: 'Fund request submitted successfully.',
  })
  create(
    @Param('productionId') productionId: string,
    @Body() createDto: CreateFundRequestDto,
    @Req() req: any,
  ) {
    return this.fundsService.create(productionId, createDto, req.user._id);
  }

  @Get()
  @Permissions('funds.view')
  @ApiOperation({ summary: 'List all fund requests for a production' })
  @ApiResponse({ status: 200, description: 'Array of fund request documents.' })
  findAll(@Param('productionId') productionId: string) {
    return this.fundsService.findAll(productionId);
  }

  @Patch(':id/status')
  @Permissions('funds.approve')
  @ApiOperation({
    summary: 'Approve or reject a fund request (recorded in audit logs)',
  })
  @ApiResponse({ status: 200, description: 'Fund status updated.' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateFundStatusDto,
    @Req() req: any,
  ) {
    return this.fundsService.updateStatus(id, updateDto, req.user._id);
  }
}
