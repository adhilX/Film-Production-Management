import { IsNotEmpty, IsArray, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({
    example: ['60d5ec4986422830f0f5b111'],
    description: 'Array of permission ObjectIds to assign to this role',
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  permissions: string[];
}
