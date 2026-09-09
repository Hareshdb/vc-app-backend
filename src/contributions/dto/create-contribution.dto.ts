import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContributionType, EntryType, PaymentMethodType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateContributionDto {
  @ApiProperty({ example: 1, description: 'Member ID (MandalMember.id)' })
  @IsInt()
  @IsPositive()
  memberId: number;

  @ApiProperty({ example: 500.0, description: 'Contribution amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: ContributionType, example: ContributionType.MONTHLY_FEE })
  @IsEnum(ContributionType)
  type: ContributionType;

  @ApiPropertyOptional({ enum: EntryType, example: EntryType.CREDIT })
  @IsOptional()
  @IsEnum(EntryType)
  entryType?: EntryType;

  @ApiProperty({ enum: PaymentMethodType, example: PaymentMethodType.CASH })
  @IsEnum(PaymentMethodType)
  paymentMethod: PaymentMethodType;

  @ApiPropertyOptional({ example: 'TXN123456', description: 'Payment reference' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'Monthly contribution for August' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ example: '2026-08-13', description: 'Date of contribution' })
  @IsDateString()
  @IsNotEmpty()
  contributionDate: string;

  @ApiProperty({ example: 1, description: 'User ID of the creator' })
  @IsInt()
  @IsPositive()
  createdBy: number;
}
