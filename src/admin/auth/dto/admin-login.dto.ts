import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@mandal.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'change-this-admin-password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
