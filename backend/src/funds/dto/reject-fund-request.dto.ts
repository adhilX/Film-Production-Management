import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectFundRequestDto {
  @ApiProperty({ example: 'Insufficient project budget remaining.', description: 'Rejection reason' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  rejectionReason: string;
}
