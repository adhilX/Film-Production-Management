import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationStatusDto {
  @ApiProperty({
    example: 'Booked',
    enum: ['Requested', 'Under Review', 'Approved', 'Booked', 'Completed'],
    description: 'Target booking status',
  })
  @IsEnum(['Requested', 'Under Review', 'Approved', 'Booked', 'Completed'])
  @IsNotEmpty()
  status: string;
}
