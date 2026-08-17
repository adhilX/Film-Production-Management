import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCharacterDto {
  @ApiProperty({ example: 'Jake Sully', description: 'Script character name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Lead protagonist, Na’vi clan leader',
    required: false,
    description: 'Character description / backstory',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
