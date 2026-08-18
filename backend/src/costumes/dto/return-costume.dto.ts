import {
  IsNotEmpty,
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReturnCostumeDto {
  @ApiProperty({ example: 1, required: false, description: 'Quantity being returned' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiProperty({ example: 'Good', enum: ['New', 'Good', 'Fair', 'Damaged'] })
  @IsEnum(['New', 'Good', 'Fair', 'Damaged'])
  @IsNotEmpty()
  conditionAtReturn: string;

  @ApiProperty({ example: 'Returned with minor dirt on sleeves', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
