import { UserStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListAdminUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search users by name, email, or mobile number',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  keyword?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
