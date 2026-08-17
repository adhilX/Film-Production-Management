import { IsEmail, IsNotEmpty, IsString, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'contractor@production.com', description: 'Unique user email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'James Cameron', description: 'Full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Freelancer', enum: ['Freelancer', 'Cast', 'Crew', 'Supplier', 'Agent', 'Cast-Crew Agent', 'TCS Team', 'Production Company'], description: 'Contractor classification' })
  @IsEnum(['Freelancer', 'Cast', 'Crew', 'Supplier', 'Agent', 'Cast-Crew Agent', 'TCS Team', 'Production Company'])
  contractorType: string;
}
