import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCharacterDto {
  @ApiProperty({ example: 'Jake Sully', required: false, description: 'Script character name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'Lead protagonist, Na’vi clan leader',
    required: false,
    description: 'Character description / backstory',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
