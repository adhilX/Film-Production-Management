import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBookingStatusDto {
  @ApiProperty({
    example: 'Approved',
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    description: 'Target booking status',
  })
  @IsEnum(['Pending', 'Approved', 'Rejected', 'Cancelled'])
  @IsNotEmpty()
  status: string;

  @ApiProperty({
    example: 'Date collision with main filming schedule',
    required: false,
    description: 'Rejection reason if status is Rejected',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
