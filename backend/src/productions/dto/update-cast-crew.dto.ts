import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCastCrewDto {
  @ApiProperty({
    example: 'Lead Actor',
    required: false,
    description: 'Role name within the production',
  })
  @IsString()
  @IsOptional()
  roleInProduction?: string;

  @ApiProperty({
    example: '60d5ecb8b5c9c211b8b2e1f5',
    required: false,
    nullable: true,
    description: 'Optional character ID assigned to cast, or null/empty string to unassign',
  })
  @IsString()
  @IsOptional()
  characterId?: string | null;
}
