import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUrl,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCostumeDto {
  @ApiProperty({ example: 'Victorian Suit', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: 'Wardrobe', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @ApiProperty({ example: 'Late 19th century three-piece suit', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 'L / 42', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  size?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @ApiProperty({ example: 'Good', enum: ['New', 'Good', 'Fair', 'Damaged'], required: false })
  @IsEnum(['New', 'Good', 'Fair', 'Damaged'])
  @IsOptional()
  condition?: 'New' | 'Good' | 'Fair' | 'Damaged';

  @ApiProperty({ example: 'Available', enum: ['Available', 'Assigned', 'Damaged', 'Lost'], required: false })
  @IsEnum(['Available', 'Assigned', 'Damaged', 'Lost'])
  @IsOptional()
  status?: 'Available' | 'Assigned' | 'Damaged' | 'Lost';
}
