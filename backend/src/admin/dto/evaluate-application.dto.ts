import { IsNotEmpty, IsEnum, IsOptional, IsMongoId, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EvaluateApplicationDto {
  @ApiProperty({ enum: ['approved', 'changes-requested'] })
  @IsNotEmpty()
  @IsEnum(['approved', 'changes-requested'])
  status: 'approved' | 'changes-requested';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  systemRoleId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  adminFeedback?: string;
}
