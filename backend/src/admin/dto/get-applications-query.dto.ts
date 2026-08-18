import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetApplicationsQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  department?: string;

  @ApiProperty({ required: false, enum: ['Cast', 'Crew', 'Freelancer', 'None', 'all'] })
  @IsOptional()
  @IsEnum(['Cast', 'Crew', 'Freelancer', 'None', 'all'])
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  contractorType?: 'Cast' | 'Crew' | 'Freelancer' | 'None' | 'all';

  @ApiProperty({ required: false, enum: ['draft', 'pending-review', 'changes-requested', 'approved', 'all'] })
  @IsOptional()
  @IsEnum(['draft', 'pending-review', 'changes-requested', 'approved', 'all'])
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  onboardingStatus?: 'draft' | 'pending-review' | 'changes-requested' | 'approved' | 'all';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  stale?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  sortBy?: string;

  @ApiProperty({ required: false, enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  sortOrder?: 'asc' | 'desc';
}
