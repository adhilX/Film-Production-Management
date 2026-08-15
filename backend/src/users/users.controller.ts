import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Users & Onboarding')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @Permissions('users.approve')
  @ApiOperation({ summary: 'List all registered contractors and system users' })
  @ApiResponse({ status: 200, description: 'Array of user documents.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch user profile details by ID' })
  @ApiResponse({ status: 200, description: 'User document details.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/onboard')
  @Permissions('users.approve')
  @ApiOperation({ summary: 'Evaluate and transition contractor onboarding status and assign systemRole' })
  @ApiResponse({ status: 200, description: 'Updated user onboarding record.' })
  updateOnboarding(@Param('id') id: string, @Body() updateDto: UpdateOnboardingDto) {
    return this.usersService.updateOnboarding(id, updateDto);
  }
}
