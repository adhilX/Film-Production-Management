import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFundStatusDto {
  @ApiProperty({
    example: 'Approved',
    enum: ['Pending', 'Approved', 'Rejected'],
    description: 'Target approval status',
  })
  @IsEnum(['Pending', 'Approved', 'Rejected'])
  @IsNotEmpty()
  status: string;

  @ApiProperty({
    example: 'Insufficient budget remaining',
    description: 'Required when rejecting a request',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
