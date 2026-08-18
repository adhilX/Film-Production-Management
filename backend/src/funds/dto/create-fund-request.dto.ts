import {
  IsNotEmpty,
  IsInt,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFundRequestDto {
  @ApiProperty({ example: 'Camera Equipment Rent', description: 'Title of the request' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example: 'Rental fee for ARRI Alexa Mini LF and Signature Primes.',
    description: 'Detailed description of the fund request',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @ApiProperty({ example: 'Equipment', description: 'Category of the fund request' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category: string;

  @ApiProperty({ example: 500000, description: 'Requested amount in integer smallest units (paise/cents)' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  requestedAmount: number;
}
