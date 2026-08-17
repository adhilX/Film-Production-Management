import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin@production.com',
    description: 'User login email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'AdminPassword123!', description: 'User password' })
  @IsString()
  @MinLength(6)
  password: string;
}
