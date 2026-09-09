import { GENDER } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: GENDER.OTHER, enum: GENDER })
  @IsOptional()
  @IsEnum(GENDER)
  gender?: GENDER;

  @ApiPropertyOptional({ example: '1998-08-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

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
  @MaxLength(20)
  pincode?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobileNumber?: string;

  @ApiPropertyOptional({ example: '+91' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  countryCode?: string;

  @ApiPropertyOptional({ example: 'https://vc-app-media.account.r2.cloudflarestorage.com/profiles/avatar.jpg' })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}
