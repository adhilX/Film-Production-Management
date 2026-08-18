import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ example: 'Stage B Studio Lot', required: false, description: 'Location name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: '100 Universal City Plaza, Universal City, CA',
    required: false,
    description: 'Address / location details',
  })
  @IsString()
  @IsOptional()
  address?: string;

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
