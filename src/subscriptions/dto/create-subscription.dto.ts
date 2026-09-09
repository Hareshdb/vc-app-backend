import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingCycle, SubscriptionStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 1, description: 'Mandal ID' })
  @IsInt()
  @IsPositive()
  mandalId: number;

  @ApiProperty({ example: 1, description: 'Plan/Package ID' })
  @IsInt()
  @IsPositive()
  packageId: number;

  @ApiProperty({ enum: BillingCycle, example: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiPropertyOptional({
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIAL,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional({ example: '2026-08-15' })
  @IsOptional()
  @IsDateString()
  trialEndsAt?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  currentPeriodStart?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  currentPeriodEnd?: string;
}
