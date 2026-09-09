import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateMandalProfileDto {
  @ApiPropertyOptional({ example: 'Shree Ram Mandal' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  mandalName?: string;

  @ApiPropertyOptional({ example: '123 Temple Road' })
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

  @ApiPropertyOptional({ example: 5, description: 'Mandal interest percentage (1-100)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  mandalInterestPercent?: number;
}
