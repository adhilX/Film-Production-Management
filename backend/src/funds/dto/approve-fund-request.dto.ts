import { IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveFundRequestDto {
  @ApiProperty({ example: 450000, description: 'Approved amount in integer smallest units (paise/cents)' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  approvedAmount: number;
}
