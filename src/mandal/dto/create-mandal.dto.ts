import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MANDAL_STRATEGY } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMandalDto {
  @ApiProperty({ example: 'My Mandal Group' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mandalName: string;

  @ApiProperty({ example: MANDAL_STRATEGY.GROWING })
  @IsEnum(MANDAL_STRATEGY)
  @IsNotEmpty()
  mandalStrategy: MANDAL_STRATEGY;

  @ApiProperty({ example: 1, description: 'Plan id from plans table' })
  @IsInt()
  @IsPositive()
  mandalPlanId: number;

  @ApiProperty({ example: 1500.0, description: 'Mandal subscription amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 12, description: 'Mandal duration in months' })
  @IsInt()
  @Min(1)
  duration: number;

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

  @ApiProperty({ example: 'Admin Name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  adminFullName: string;

  @ApiProperty({ example: 'admin@mandal.com' })
  @IsEmail()
  adminEmail: string;

  @ApiPropertyOptional({ example: '+91', default: '+91' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Mobile number must be a valid 10-digit Indian number',
  })
  adminMobileNumber: string;
}
