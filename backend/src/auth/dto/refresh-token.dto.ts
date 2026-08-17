import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description:
      'Long-lived refresh token (optional if sent via HttpOnly cookie)',
    required: false,
  })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}
