import { IsNotEmpty, IsInt, Min, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBudgetDto {
  @ApiProperty({ example: 100000000, description: 'Total budget in integer smallest units (paise/cents)' })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  totalBudget: number;

  @ApiProperty({ example: 'INR', description: 'Currency code', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;
}
