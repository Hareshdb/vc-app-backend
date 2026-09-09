import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AdminUpdateProfileDto {
  @ApiProperty({ example: 'Admin User' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: 'admin@mandal.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
