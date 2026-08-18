import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignCostumeDto {
  @ApiProperty({ example: '65c9f5a04f29a0b12c3d4e5f', required: false, description: 'Character ID (exactly one of characterId or userId must be provided)' })
  @IsString()
  @IsOptional()
  characterId?: string;

  @ApiProperty({ example: '65c9f5a04f29a0b12c3d4e60', required: false, description: 'User ID (exactly one of characterId or userId must be provided)' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ example: 1, description: 'Quantity of costume items to assign' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ example: 'Good', enum: ['New', 'Good', 'Fair', 'Damaged'] })
  @IsEnum(['New', 'Good', 'Fair', 'Damaged'])
  @IsNotEmpty()
  conditionAtAssignment: string;

  @ApiProperty({ example: 'Needed for the opening ball scene', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
