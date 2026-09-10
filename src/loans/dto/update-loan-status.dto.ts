import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoanStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateLoanStatusDto {
  @ApiProperty({ enum: LoanStatus, example: LoanStatus.APPROVED })
  @IsEnum(LoanStatus)
  status: LoanStatus;

  @ApiPropertyOptional({ example: 25000, description: 'Approved loan amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;

  @ApiPropertyOptional({ example: 'Insufficient funds or incomplete documents', description: 'Reason for rejection or action' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @ApiPropertyOptional({ example: 'Approved by board committee', description: 'Additional remarks' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
