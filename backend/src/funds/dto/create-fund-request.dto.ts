import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFundRequestDto {
  @ApiProperty({ example: 5000, description: 'Requested budget amount in USD' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 'Camera lenses rental and transport logistics', description: 'Operational justification' })
  @IsString()
  @IsNotEmpty()
  justification: string;
}
