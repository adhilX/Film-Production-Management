import { IsNotEmpty, IsString, IsDateString, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    example: '6a80a7081a9a9d61e11b6500',
    description: 'Physical Location ID',
  })
  @IsMongoId()
  @IsNotEmpty()
  locationId: string;

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
}
