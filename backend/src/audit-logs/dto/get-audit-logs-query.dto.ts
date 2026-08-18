import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsMongoId,
  IsEnum,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetAuditLogsQueryDto {
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
  @Max(100)
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  module?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  action?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  productionId?: string;

  @ApiProperty({ required: false, default: 'timestamp' })
  @IsOptional()
  @IsString()
  @IsIn(['timestamp', 'action', 'module', 'resourceType', 'ipAddress'])
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  sortBy?: string;

  @ApiProperty({ required: false, default: 'desc' })
  @IsOptional()
  @IsString()
  @IsEnum(['asc', 'desc'])
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  sortOrder?: 'asc' | 'desc';
}
