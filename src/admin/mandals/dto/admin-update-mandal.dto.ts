import { ApiPropertyOptional } from '@nestjs/swagger';
import { MANDAL_STRATEGY, Status } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class AdminUpdateMandalDto {
  @ApiPropertyOptional({ example: 'Mandal Alpha' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  mandalName?: string;

  @ApiPropertyOptional({ enum: MANDAL_STRATEGY })
  @IsOptional()
  @IsEnum(MANDAL_STRATEGY)
  mandalStrategy?: MANDAL_STRATEGY;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  mandalPlanId?: number;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({ enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: '400001' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Pincode must be a valid 6-digit number' })
  pincode?: string;

  @ApiPropertyOptional({ example: '2026-06-17' })
  @IsOptional()
  @IsString()
  mandalStartDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isTrialActive?: boolean;
}
