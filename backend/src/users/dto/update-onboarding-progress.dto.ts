import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BankDetailsDto {
  @ApiProperty({ required: false, description: 'Bank Name' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ required: false, description: 'Bank Account Number' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({ required: false, description: 'Routing Number' })
  @IsOptional()
  @IsString()
  routingNumber?: string;
}

export class ProfileDataDto {
  @ApiProperty({ required: false, description: 'Full Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, description: 'Profile Photo URL' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiProperty({ required: false, description: 'Phone Number' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ required: false, description: 'Secondary Email' })
  @IsOptional()
  @IsString()
  secondaryEmail?: string;

  @ApiProperty({ required: false, description: 'Department Name' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ required: false, description: 'Current Position' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({ required: false, description: 'Work Experience Summary' })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiProperty({ required: false, description: 'Contractor Type' })
  @IsOptional()
  @IsString()
  contractorType?: string;

  @ApiProperty({
    type: BankDetailsDto,
    required: false,
    description: 'Bank Account Information',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @ApiProperty({ required: false, description: 'Uploaded Tax Form URL' })
  @IsOptional()
  @IsString()
  taxFormUrl?: string;

  @ApiProperty({ required: false, description: 'Government ID Type' })
  @IsOptional()
  @IsString()
  governmentIdType?: string;

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Uploaded Identity Document URLs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  identityDocs?: string[];

  @ApiProperty({ required: false, description: 'Agreed to NDA' })
  @IsOptional()
  @IsBoolean()
  agreeNda?: boolean;

  @ApiProperty({ required: false, description: 'Agreed to Terms of Service' })
  @IsOptional()
  @IsBoolean()
  agreeTerms?: boolean;

  @ApiProperty({ required: false, description: 'Signature Data / Path' })
  @IsOptional()
  @IsString()
  signatureData?: string;
}

export class UpdateOnboardingProgressDto {
  @ApiProperty({
    minimum: 1,
    maximum: 6,
    required: false,
    description: 'Current active onboarding step number',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(6)
  currentStep?: number;

  @ApiProperty({
    type: ProfileDataDto,
    required: false,
    description: 'Onboarding profile values',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileDataDto)
  profileData?: ProfileDataDto;
}
