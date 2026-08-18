import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { GetApplicationsQueryDto } from './dto/get-applications-query.dto';
import { EvaluateApplicationDto } from './dto/evaluate-application.dto';
import { CreateUserManualDto } from './dto/create-user-manual.dto';
import { UpdateUserManualDto } from './dto/update-user-manual.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard-stats')
  @Permissions('users.approve')
  @ApiOperation({ summary: 'Get overall admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics, sparklines, and status distributions.' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('applications')
  @Permissions('users.approve')
  @ApiOperation({
    summary: 'Get onboarding applications with pagination, filtering, search, and KPI metrics',
  })
  @ApiResponse({ status: 200, description: 'List of applications.' })
  getPendingApplications(@Query() query: GetApplicationsQueryDto) {
    return this.adminService.getApplications(query);
  }

  @Get('applications/:id')
  @Permissions('users.approve')
  @ApiOperation({ summary: 'Get details of a specific application' })
  @ApiResponse({ status: 200, description: 'Detailed user application data.' })
  getApplicationDetails(
    @Param('id', new ParseObjectIdPipe('Invalid applicationId format')) id: string,
  ) {
    return this.adminService.getApplicationDetails(id);
  }

  @Patch('applications/:id/evaluate')
  @Permissions('users.approve')
  @ApiOperation({ summary: 'Approve or request changes for an application' })
  @ApiResponse({
    status: 200,
    description: 'Application evaluated successfully.',
  })
  evaluateApplication(
    @Param('id', new ParseObjectIdPipe('Invalid applicationId format')) id: string,
    @Req() req: any,
    @Body() payload: EvaluateApplicationDto,
  ) {
    return this.adminService.evaluateApplication(
      id,
      req.user._id.toString(),
      payload,
    );
  }

  // --- Granular User Operations ---

  @Post('users')
  @Permissions('users.create')
  @ApiOperation({ summary: 'Create a new user manually' })
  createUser(@Req() req: any, @Body() payload: CreateUserManualDto) {
    return this.adminService.createUser(req.user._id.toString(), payload);
  }

  @Patch('users/:id')
  @Permissions('users.update')
  @ApiOperation({ summary: 'Update a user manually' })
  updateUser(
    @Param('id', new ParseObjectIdPipe('Invalid userId format')) id: string,
    @Req() req: any,
    @Body() payload: UpdateUserManualDto,
  ) {
    const requesterPermissions = req.user.permissions || [];
    const requesterRoleName = req.user.systemRoleId?.name || '';
    return this.adminService.updateUser(
      req.user._id.toString(),
      id,
      payload,
      requesterPermissions,
      requesterRoleName,
    );
  }

  // --- System Settings (Roles & Permissions) ---

  @Get('roles')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get all system roles' })
  getRoles() {
    return this.adminService.getRoles();
  }

  @Post('roles')
  @Permissions('roles.manage')
  @ApiOperation({ summary: 'Create a new system role' })
  createRole(@Req() req: any, @Body() payload: CreateRoleDto) {
    const requesterPermissions = req.user.permissions || [];
    const requesterRoleName = req.user.systemRoleId?.name || '';
    return this.adminService.createRole(
      req.user._id.toString(),
      payload,
      requesterPermissions,
      requesterRoleName,
    );
  }

  @Patch('roles/:id')
  @Permissions('roles.manage')
  @ApiOperation({ summary: 'Update a system role' })
  updateRole(
    @Param('id', new ParseObjectIdPipe('Invalid roleId format')) id: string,
    @Req() req: any,
    @Body() payload: UpdateRoleDto,
  ) {
    const requesterPermissions = req.user.permissions || [];
    const requesterRoleName = req.user.systemRoleId?.name || '';
    const requesterRoleId = req.user.systemRoleId?._id?.toString() || '';
    return this.adminService.updateRole(
      req.user._id.toString(),
      id,
      payload,
      requesterPermissions,
      requesterRoleName,
      requesterRoleId,
    );
  }

  // --- Global Permissions Management ---

  @Get('permissions')
  @Permissions('roles.view')
  @ApiOperation({ summary: 'Get all system permissions' })
  getPermissions() {
    return this.adminService.getPermissions();
  }

  @Post('permissions')
  @Permissions('roles.manage')
  @ApiOperation({ summary: 'Create a new global permission string' })
  createPermission(@Req() req: any, @Body() payload: CreatePermissionDto) {
    return this.adminService.createPermission(req.user._id.toString(), payload);
  }
}