import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLocationDto {
  @ApiProperty({
    example: '60d5ecb8b5c9c211b8b2e1f4',
    description: 'Production ID',
  })
  @IsMongoId()
  @IsNotEmpty()
  productionId: string;

  @ApiProperty({ example: 'Stage B Studio Lot', description: 'Location name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '100 Universal City Plaza, Universal City, CA',
    description: 'Address / location details',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    example: 'Main soundstage for interior spaceship scenes',
    required: false,
    description: 'Description of the location',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 34.1381, required: false, description: 'Latitude coordinate' })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: -118.3534, required: false, description: 'Longitude coordinate' })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ example: 'Studio', required: false, description: 'Type of location' })
  @IsString()
  @IsOptional()
  locationType?: string;

  @ApiProperty({ example: 'John Doe (Stage Manager) - 555-0199', required: false, description: 'Contact info' })
  @IsString()
  @IsOptional()
  contactInfo?: string;

  @ApiProperty({ example: 'https://example.com/stage-b.jpg', required: false, description: 'Image URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
