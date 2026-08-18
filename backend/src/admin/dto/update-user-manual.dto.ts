import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsBoolean,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserManualDto {
  @ApiProperty({ required: false, example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

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

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((o, v) => v !== null)
  @IsMongoId()
  systemRoleId?: string | null;

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
