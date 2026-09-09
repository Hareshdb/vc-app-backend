import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContributionType, EntryType, PaymentMethodType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateContributionDto {
  @ApiPropertyOptional({ example: 500.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({ enum: ContributionType })
  @IsOptional()
  @IsEnum(ContributionType)
  type?: ContributionType;

  @ApiPropertyOptional({ enum: EntryType })
  @IsOptional()
  @IsEnum(EntryType)
  entryType?: EntryType;

  @ApiPropertyOptional({ enum: PaymentMethodType })
  @IsOptional()
  @IsEnum(PaymentMethodType)
  paymentMethod?: PaymentMethodType;

  @ApiPropertyOptional({ example: 'TXN123456' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'Monthly contribution for August' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: '2026-08-13' })
  @IsOptional()
  @IsDateString()
  contributionDate?: string;
}
