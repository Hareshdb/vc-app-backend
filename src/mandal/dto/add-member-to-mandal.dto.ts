import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class AddMemberToMandalDto {
  @ApiPropertyOptional({
    example: 2,
    description: 'Existing user id to add as member',
  })
  // @ValidateIf((dto: AddMemberToMandalDto) => !dto.fullName)
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
