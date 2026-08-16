import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOnboardingDto {
  @ApiProperty({ example: 'Approved', enum: ['Draft', 'Pending', 'UnderReview', 'Approved', 'Rejected', 'Changes Requested'], description: 'Target onboarding evaluation status' })
  @IsEnum(['Draft', 'Pending', 'UnderReview', 'Approved', 'Rejected', 'Changes Requested'])
  status: string;

  @ApiProperty({ example: 'User', enum: ['Admin', 'Manager', 'User'], required: false, description: 'Assigned system role on approval' })
  @IsOptional()
  @IsEnum(['Admin', 'Manager', 'User'])
  systemRole?: string;

  @ApiProperty({ example: 'Please upload a clearer ID copy.', required: false, description: 'Notes when changes are requested' })
  @IsOptional()
  @IsString()
  adminFeedback?: string;
}
