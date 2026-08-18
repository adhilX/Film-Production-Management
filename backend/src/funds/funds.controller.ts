import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { FundsService } from './funds.service';
import { CreateFundRequestDto } from './dto/create-fund-request.dto';
import { UpdateFundRequestDto } from './dto/update-fund-request.dto';
import { ApproveFundRequestDto } from './dto/approve-fund-request.dto';
import { RejectFundRequestDto } from './dto/reject-fund-request.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
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

  private validateObjectId(id: string, name: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${name} format`);
    }
  }

  @Get('budget')
  @Permissions('funds.view')
  @ApiOperation({ summary: 'Get budget configuration for a production' })
  @ApiResponse({ status: 200, description: 'Budget document.' })
  getBudget(
    @Param('productionId') productionId: string,
    @Req() req: any,
  ) {
    this.validateObjectId(productionId, 'productionId');
    return this.fundsService.getOrCreateBudget(productionId, req.user._id);
  }

  @Patch('budget')
  @Permissions('funds.approve')
  @ApiOperation({ summary: 'Update budget configuration for a production' })
  @ApiResponse({ status: 200, description: 'Updated budget document.' })
  updateBudget(
    @Param('productionId') productionId: string,
    @Body() updateDto: UpdateBudgetDto,
    @Req() req: any,
  ) {
    this.validateObjectId(productionId, 'productionId');
    return this.fundsService.updateBudget(productionId, updateDto, req.user._id);
  }

  @Get('requests')
  @Permissions('funds.view')
  @ApiOperation({ summary: 'List all fund requests for a production' })
  @ApiResponse({ status: 200, description: 'Array of fund request documents.' })
  getFundRequests(@Param('productionId') productionId: string) {
    this.validateObjectId(productionId, 'productionId');
    return this.fundsService.findAll(productionId);
  }

  // Supporting fallback alias
  @Get()
  @Permissions('funds.view')
  @ApiOperation({ summary: 'List all fund requests for a production (fallback)' })
  @ApiResponse({ status: 200, description: 'Array of fund request documents.' })
  findAll(@Param('productionId') productionId: string) {
    this.validateObjectId(productionId, 'productionId');
    return this.fundsService.findAll(productionId);
  }

  @Get('requests/:id')
  @Permissions('funds.view')
  @ApiOperation({ summary: 'Get a specific fund request' })
  @ApiResponse({ status: 200, description: 'Fund request document.' })
  getFundRequest(
    @Param('productionId') productionId: string,
    @Param('id') id: string,
  ) {
    this.validateObjectId(productionId, 'productionId');
    this.validateObjectId(id, 'requestId');
    return this.fundsService.findOne(productionId, id);
  }

  @Post('requests')
  @Permissions('funds.create')
  @ApiOperation({ summary: 'Submit a new fund request' })
  @ApiResponse({ status: 201, description: 'Fund request created successfully.' })
  create(
    @Param('productionId') productionId: string,
    @Body() createDto: CreateFundRequestDto,
    @Req() req: any,
  ) {
    this.validateObjectId(productionId, 'productionId');
    return this.fundsService.create(productionId, createDto, req.user._id);
  }

  @Patch('requests/:id')
  @ApiOperation({ summary: 'Update a pending fund request' })
  @ApiResponse({ status: 200, description: 'Fund request updated successfully.' })
  async update(
    @Param('productionId') productionId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateFundRequestDto,
    @Req() req: any,
  ) {
    this.validateObjectId(productionId, 'productionId');
    this.validateObjectId(id, 'requestId');
    
    // Check ownership or update permission
    const requestDoc = await this.fundsService.findOne(productionId, id);
    const hasUpdatePerm = req.user.permissions?.includes('funds.update');
    const isOwner = requestDoc.requestedBy?._id?.toString() === req.user._id?.toString();
    const isSuperAdmin = req.user.role === 'Super Admin' || req.user.systemRoleId?.name === 'Super Admin';

    if (!hasUpdatePerm && !isOwner && !isSuperAdmin) {
      throw new ForbiddenException('You do not have permission to update this fund request.');
    }

    return this.fundsService.update(productionId, id, updateDto, req.user._id);
  }

  @Patch('requests/:id/approve')
  @Permissions('funds.approve')
  @ApiOperation({ summary: 'Approve a fund request' })
  @ApiResponse({ status: 200, description: 'Fund request approved.' })
  approve(
    @Param('productionId') productionId: string,
    @Param('id') id: string,
    @Body() approveDto: ApproveFundRequestDto,
    @Req() req: any,
  ) {
    this.validateObjectId(productionId, 'productionId');
    this.validateObjectId(id, 'requestId');
    return this.fundsService.approve(productionId, id, approveDto, req.user._id);
  }

  @Patch('requests/:id/reject')
  @Permissions('funds.approve')
  @ApiOperation({ summary: 'Reject a fund request' })
  @ApiResponse({ status: 200, description: 'Fund request rejected.' })
  reject(
    @Param('productionId') productionId: string,
    @Param('id') id: string,
    @Body() rejectDto: RejectFundRequestDto,
    @Req() req: any,
  ) {
    this.validateObjectId(productionId, 'productionId');
    this.validateObjectId(id, 'requestId');
    return this.fundsService.reject(productionId, id, rejectDto, req.user._id);
  }

  @Patch('requests/:id/cancel')
  @ApiOperation({ summary: 'Cancel a pending fund request' })
  @ApiResponse({ status: 200, description: 'Fund request cancelled.' })
  cancel(
    @Param('productionId') productionId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    this.validateObjectId(productionId, 'productionId');
    this.validateObjectId(id, 'requestId');
    const isSuperAdmin = req.user.role === 'Super Admin' || req.user.systemRoleId?.name === 'Super Admin';
    return this.fundsService.cancel(
      productionId,
      id,
      req.user._id,
      req.user.permissions || [],
      isSuperAdmin,
    );
  }
}
