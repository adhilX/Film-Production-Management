import { IsOptional, IsString, IsNumber, IsDateString, IsMongoId, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductionDto {
  @ApiProperty({ example: 'Avatar 3: Fire and Ash', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Sci-fi feature film', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Drama', required: false })
  @IsString()
  @IsOptional()
  genre?: string;

  @ApiProperty({ example: 'English', required: false })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ example: 'Feature Film', required: false })
  @IsString()
  @IsOptional()
  format?: string;

  @ApiProperty({ example: 'A family seeks safety...', required: false })
  @IsString()
  @IsOptional()
  logline?: string;

  @ApiProperty({ example: 'Detailed synopsis...', required: false })
  @IsString()
  @IsOptional()
  synopsis?: string;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2026-12-31T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: 15000000, required: false })
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiProperty({ example: '6a80a4661a9a9d61e11b64fc', required: false })
  @IsMongoId()
  @IsOptional()
  productionManager?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', required: false, nullable: true })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 'Active', required: false })
  @IsString()
  @IsOptional()
  @IsIn(['Draft', 'Active', 'On Hold', 'Completed', 'Cancelled'])
  status?: string;
}
