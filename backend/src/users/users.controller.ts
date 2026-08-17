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
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { UpdateOnboardingProgressDto } from './dto/update-onboarding-progress.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';

@ApiTags('Users & Onboarding')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @Permissions('users.approve')
  @ApiOperation({ summary: 'List all registered contractors and system users' })
  @ApiResponse({ status: 200, description: 'Paginated user documents.' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);
    return this.usersService.findAll(pageNum, limitNum, search || '');
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

    // Upload the file stream to Cloudinary
    const cloudinaryResponse = await this.cloudinaryService
      .uploadFile(file, 'cine-factory/documents')
      .catch(() => {
        throw new BadRequestException('Invalid file type or upload failed.');
      });

    return {
      fileUrl: cloudinaryResponse.secure_url,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch user profile details by ID' })
  @ApiResponse({ status: 200, description: 'User document details.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/onboard')
  @Permissions('users.approve')
  @ApiOperation({
    summary:
      'Evaluate and transition contractor onboarding status and assign systemRole',
  })
  @ApiResponse({ status: 200, description: 'Updated user onboarding record.' })
  updateOnboarding(
    @Param('id') id: string,
    @Body() updateDto: UpdateOnboardingDto,
    @Req() req: any,
  ) {
    return this.usersService.updateOnboarding(
      id,
      updateDto,
      req.user._id.toString(),
    );
  }
}
