import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersService } from './users.service';
import { UpdateOnboardingProgressDto } from './dto/update-onboarding-progress.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@ApiTags('Users & Onboarding')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(AuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @Permissions('users.view')
  @ApiOperation({ summary: 'List all registered contractors and system users' })
  @ApiResponse({ status: 200, description: 'Paginated user documents.' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('contractorType') contractorType?: string,
    @Query('systemRoleId', new ParseObjectIdPipe('Invalid systemRoleId format')) systemRoleId?: string,
    @Query('status') status?: string,
    @Query('onboardingStatus') onboardingStatus?: string,
    @Query('isActive') isActive?: string,
    @Query('department') department?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);
    const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;
    const result = await this.usersService.findAll({
      page: pageNum,
      limit: limitNum,
      search: search || '',
      contractorType,
      systemRoleId,
      status,
      onboardingStatus,
      isActive: isActiveBool,
      department,
      sortBy,
      sortOrder,
    });
    if (result.users) {
      result.users = result.users.map((u: any) => {
        const uObj = u.toJSON ? u.toJSON() : JSON.parse(JSON.stringify(u));
        if (uObj.profile) {
          delete uObj.profile.bankDetails;
          delete uObj.profile.taxFormUrl;
          delete uObj.profile.governmentIdType;
          delete uObj.profile.identityDocs;
          delete uObj.profile.signatureData;
        }
        return uObj;
      });
    }
    return result;
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user detail profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile with onboarding details.',
  })
  getMe(@Req() req: any) {
    return this.usersService.getMe(req.user._id.toString());
  }

  @Get('me/status')
  @ApiOperation({ summary: 'Get current user onboarding/system status' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding and system status of current user.',
  })
  getMeStatus(@Req() req: any) {
    const user = req.user;
    return {
      status: user.status,
      isActive: user.isActive,
      systemRoleId: user.systemRoleId,
      onboardingStatus: user.onboardingStatus,
      permissions: user.permissions || [],
    };
  }

  @Get('me/dashboard-stats')
  @ApiOperation({ summary: 'Get crew dashboard stats for current user' })
  @ApiResponse({
    status: 200,
    description: 'Crew stats and assignments.',
  })
  getCrewDashboardStats(@Req() req: any) {
    return this.usersService.getCrewDashboardStats(req.user._id.toString());
  }

  @Patch('onboarding')
  @ApiOperation({ summary: 'Update progress step and onboarding profile data' })
  @ApiResponse({
    status: 200,
    description: 'Updated onboarding progress record.',
  })
  updateOnboardingProgress(
    @Req() req: any,
    @Body() dto: UpdateOnboardingProgressDto,
  ) {
    return this.usersService.updateOnboardingProgress(
      req.user._id.toString(),
      dto.currentStep,
      dto.profileData,
    );
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async uploadFile(
    @UploadedFile() file: any,
    @Req() req: any,
    @Body('documentType') documentType: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Size limit check: 5MB
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('File size exceeds the limit of 5 MB');
    }

    // MIME type check
    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported file format. Only PDF, PNG, and JPEG are allowed.');
    }

    // Upload the file stream to Cloudinary
    const cloudinaryResponse = await this.cloudinaryService
      .uploadFile(file, 'cine-factory/documents')
      .catch(() => {
        throw new BadRequestException('Invalid file type or upload failed.');
      });

    // Create Audit Log USER_DOCUMENT_UPLOADED
    await this.auditLogsService.create(
      req.user._id.toString(),
      req.user._id.toString(),
      'USER_DOCUMENT_UPLOADED',
      {
        documentType: documentType || 'unknown',
        action: 'upload',
      },
      'UserOnboarding',
    );

    return {
      fileUrl: cloudinaryResponse.secure_url,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch user profile details by ID' })
  @ApiResponse({ status: 200, description: 'User document details.' })
  async findOne(
    @Param('id', new ParseObjectIdPipe('Invalid userId format')) id: string,
    @Req() req: any,
  ) {
    const isSelf = req.user._id.toString() === id;
    const hasViewPerm = req.user.permissions && req.user.permissions.includes('users.view');
    if (!isSelf && !hasViewPerm) {
      throw new ForbiddenException('Access denied: Cannot view another user\'s profile');
    }
    const user = await this.usersService.findOne(id);
    const uObj = (user as any).toJSON ? (user as any).toJSON() : JSON.parse(JSON.stringify(user));
    if (!isSelf) {
      if (uObj.profile) {
        delete uObj.profile.bankDetails;
        delete uObj.profile.taxFormUrl;
        delete uObj.profile.governmentIdType;
        delete uObj.profile.identityDocs;
        delete uObj.profile.signatureData;
      }
    }
    if (isSelf || hasViewPerm) {
      uObj.assignments = await this.usersService.findUserAssignments(id, req.user);
      uObj.auditLogs = await this.usersService.findAuditLogs(id);
    }
    return uObj;
  }
}
