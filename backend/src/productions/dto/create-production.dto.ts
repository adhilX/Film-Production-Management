import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductionDto {
  @ApiProperty({ example: 'Avatar 3: Fire and Ash', description: 'Production project title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Sci-fi feature film production', required: false, description: 'Production summary' })
  @IsString()
  @IsOptional()
  description?: string;
}
