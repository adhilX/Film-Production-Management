import { IsNotEmpty, IsString, IsArray, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Custom Manager',
    description: 'The unique name of the custom role',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: ['60d5ec4986422830f0f5b111'],
    description: 'Array of permission ObjectIds to assign to this role',
  })
  @IsArray()
  @IsMongoId({ each: true })
  permissions: string[];
}
