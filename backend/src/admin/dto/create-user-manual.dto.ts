import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserManualDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    required: false,
    enum: [
      'Freelancer',
      'Cast',
      'Crew',
      'Supplier',
      'Agent',
      'Cast-Crew Agent',
      'TCS Team',
      'Production Company',
      'None',
    ],
  })
  @IsOptional()
  @IsEnum([
    'Freelancer',
    'Cast',
    'Crew',
    'Supplier',
    'Agent',
    'Cast-Crew Agent',
    'TCS Team',
    'Production Company',
    'None',
  ])
  contractorType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  systemRoleId?: string;

  @ApiProperty({
    required: false,
    enum: ['Draft', 'Pending', 'UnderReview', 'Approved', 'Rejected', 'Changes Requested'],
  })
  @IsOptional()
  @IsEnum(['Draft', 'Pending', 'UnderReview', 'Approved', 'Rejected', 'Changes Requested'])
  status?: string;

  @ApiProperty({
    required: false,
    enum: ['in-progress', 'pending-review', 'approved', 'changes-requested'],
  })
  @IsOptional()
  @IsEnum(['in-progress', 'pending-review', 'approved', 'changes-requested'])
  onboardingStatus?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
