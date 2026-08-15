import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFundStatusDto {
  @ApiProperty({ example: 'Approved', enum: ['Pending', 'Approved', 'Rejected'], description: 'Target approval status' })
  @IsEnum(['Pending', 'Approved', 'Rejected'])
  @IsNotEmpty()
  status: string;
}
