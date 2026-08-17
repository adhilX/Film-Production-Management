import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignCastCrewDto {
  @ApiProperty({
    example: '60d5ecb8b5c9c211b8b2e1f4',
    description: 'Assigned User ID',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 'Lead Actor',
    description: 'Role name within the production',
  })
  @IsString()
  @IsNotEmpty()
  roleInProduction: string;

  @ApiProperty({
    example: '60d5ecb8b5c9c211b8b2e1f5',
    required: false,
    description: 'Optional character ID assigned to cast',
  })
  @IsString()
  @IsOptional()
  characterId?: string;
}
