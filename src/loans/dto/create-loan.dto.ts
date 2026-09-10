import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLoanDto {
  @ApiPropertyOptional({ example: 1, description: 'Member ID (optional, defaults to current user member ID)' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  memberId?: number;

  @ApiProperty({ example: 25000, description: 'Requested loan amount' })
  @IsNumber()
  @Min(1)
  requestedAmount: number;

  @ApiPropertyOptional({ example: 'Medical Emergency', description: 'Purpose of the loan' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  loanPurpose?: string;

  @ApiPropertyOptional({ example: 'Hospital expenses for family member', description: 'Detailed description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
