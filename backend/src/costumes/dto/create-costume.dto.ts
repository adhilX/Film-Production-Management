import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  IsOptional,
  IsEnum,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCostumeDto {
  @ApiProperty({ example: 'Victorian Suit', description: 'Name of the costume' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Wardrobe', description: 'Category of the costume/asset' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category: string;

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

  @ApiProperty({ example: 5, description: 'Total stock quantity' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ example: 'New', enum: ['New', 'Good', 'Fair', 'Damaged'], required: false })
  @IsEnum(['New', 'Good', 'Fair', 'Damaged'])
  @IsOptional()
  condition?: 'New' | 'Good' | 'Fair' | 'Damaged';
}
