import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class AddMemberToMandalDto {
  @ApiProperty({
    example: 2,
    description: 'Existing user id to add as member',
  })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiPropertyOptional({
    enum: MemberRole,
    default: MemberRole.MEMBER,
    description: 'Role of the member in the mandal',
  })
  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;
}
