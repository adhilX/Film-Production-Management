import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLocationDto {
  @ApiProperty({
    example: '60d5ecb8b5c9c211b8b2e1f4',
    description: 'Production ID',
  })
  @IsString()
  @IsNotEmpty()
  productionId: string;

  @ApiProperty({ example: 'Stage B Studio Lot', description: 'Location name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '100 Universal City Plaza, Universal City, CA',
    description: 'Address / location details',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    example: '2026-09-01T08:00:00.000Z',
    description: 'Booking start date',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    example: '2026-09-05T18:00:00.000Z',
    description: 'Booking end date',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    example: 'Requested',
    enum: ['Requested', 'Under Review', 'Approved', 'Booked', 'Completed'],
    required: false,
    description: 'Initial booking status',
  })
  @IsOptional()
  @IsEnum(['Requested', 'Under Review', 'Approved', 'Booked', 'Completed'])
  status?: string;
}
