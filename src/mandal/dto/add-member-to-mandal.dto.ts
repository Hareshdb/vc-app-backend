import { ApiPropertyOptional } from '@nestjs/swagger';
import { GENDER, UserType } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class AddMemberToMandalDto {
  @ApiPropertyOptional({
    example: 2,
    description: 'Existing user id to add as member',
  })
  @ValidateIf((dto: AddMemberToMandalDto) => !dto.fullName)
  @IsInt()
  @IsNotEmpty()
  userId?: number;

  @ApiPropertyOptional({ example: 'MEMBER' })
  @ValidateIf((dto: AddMemberToMandalDto) => !dto.userId)
  @IsEnum(UserType)
  userType?: UserType;

  @ApiPropertyOptional({ example: 'Member Name' })
  @ValidateIf((dto: AddMemberToMandalDto) => !dto.userId)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional({ example: 'member@example.com' })
  @ValidateIf((dto: AddMemberToMandalDto) => !dto.userId)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+91', default: '+91' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @ValidateIf((dto: AddMemberToMandalDto) => !dto.userId)
  @IsString()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Mobile number must be a valid 10-digit Indian number',
  })
  mobileNumber?: string;

  @ApiPropertyOptional({ example: 'MALE' })
  @ValidateIf((dto: AddMemberToMandalDto) => !dto.userId)
  @IsOptional()
  @IsEnum(GENDER)
  gender?: GENDER;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @ValidateIf((dto: AddMemberToMandalDto) => !dto.userId)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: '1998-08-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
