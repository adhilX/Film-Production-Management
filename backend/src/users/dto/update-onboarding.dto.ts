import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOnboardingDto {
  @ApiProperty({
    example: 'Approved',
    enum: [
      'Draft',
      'Pending',
      'UnderReview',
      'Approved',
      'Rejected',
      'Changes Requested',
    ],
    description: 'Target onboarding evaluation status',
  })
  @IsEnum([
    'Draft',
    'Pending',
    'UnderReview',
    'Approved',
    'Rejected',
    'Changes Requested',
  ])
  status: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    required: false,
    description: 'Assigned system role ID on approval',
  })
  @IsOptional()
  @IsString()
  systemRoleId?: string;

  @ApiProperty({
    example: 'Please upload a clearer ID copy.',
    required: false,
    description: 'Notes when changes are requested',
  })
  @IsOptional()
  @IsString()
  adminFeedback?: string;
}
