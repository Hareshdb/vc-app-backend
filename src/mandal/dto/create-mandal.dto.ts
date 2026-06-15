import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MANDAL_SIZE, MANDAL_STRATEGY } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import Api from 'twilio/lib/rest/Api';

export class CreateMandalDto {
  @ApiProperty({ example: 'My Mandal Group' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mandalName: string;

  @ApiProperty({ example: 'VC-000000001' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(255)
  mandalId: string;

  @ApiProperty({ example: MANDAL_STRATEGY.GROWING })
  @IsEnum(MANDAL_STRATEGY)
  @IsNotEmpty()
  mandalStrategy: MANDAL_STRATEGY;
  
  @ApiProperty({ example: MANDAL_SIZE.SMALL })
  @IsEnum(MANDAL_SIZE)
  @IsNotEmpty()
  mandalSize: MANDAL_SIZE;


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
