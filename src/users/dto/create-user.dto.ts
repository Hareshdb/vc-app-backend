import { GENDER } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  email: string;

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
  mobileNumber: string;

  @ApiPropertyOptional({ example: GENDER.OTHER, default: GENDER.OTHER })
  @IsOptional()
  @IsEnum(GENDER)
  gender?: GENDER;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: '1998-08-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
