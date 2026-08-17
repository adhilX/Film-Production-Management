import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, IsMongoId, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductionDto {
  @ApiProperty({
    example: 'Avatar 3: Fire and Ash',
    description: 'Production project title',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Sci-fi feature film production',
    required: false,
    description: 'Production summary',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Drama' })
  @IsString()
  @IsNotEmpty()
  genre: string;

  @ApiProperty({ example: 'English' })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({ example: 'Feature Film' })
  @IsString()
  @IsNotEmpty()
  format: string;

  @ApiProperty({ example: 'A family seeks safety in new regions.', required: false })
  @IsString()
  @IsOptional()
  logline?: string;

  @ApiProperty({ example: 'Detailed synopsis...', required: false })
  @IsString()
  @IsOptional()
  synopsis?: string;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2026-12-31T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ example: 15000000 })
  @IsNumber()
  @IsNotEmpty()
  budget: number;

  @ApiProperty({ example: '6a80a4661a9a9d61e11b64fc' })
  @IsMongoId()
  @IsNotEmpty()
  productionManager: string;

  @ApiProperty({ example: 'Draft', required: false })
  @IsString()
  @IsOptional()
  @IsIn(['Draft', 'Active', 'On Hold', 'Completed', 'Cancelled'])
  status?: string;
}

