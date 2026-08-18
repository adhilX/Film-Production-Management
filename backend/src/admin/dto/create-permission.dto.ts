import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'costumes.burn',
    description: 'Unique name of the new permission',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Allows burning costumes',
    description: 'Description/Label for the permission',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'Costumes & Assets',
    description: 'Category group for grouping in the matrix',
    required: false,
  })
  @IsString()
  @IsOptional()
  group?: string;
}
