import { IsNotEmpty, IsNumber, IsString, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFundRequestDto {
  @ApiProperty({ example: 5000, description: 'Requested budget amount in USD' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 'Camera lenses rental and transport logistics', description: 'Operational justification' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  justification: string;
}
