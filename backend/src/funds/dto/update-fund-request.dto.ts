import {
  IsInt,
  IsString,
  Min,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFundRequestDto {
  @ApiProperty({ example: 'Camera Equipment Rent', description: 'Title of the request', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;

  @ApiProperty({
    example: 'Rental fee for ARRI Alexa Mini LF.',
    description: 'Detailed description of the fund request',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 'Equipment', description: 'Category of the fund request', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @ApiProperty({ example: 500000, description: 'Requested amount in integer smallest units (paise/cents)', required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  requestedAmount?: number;
}
