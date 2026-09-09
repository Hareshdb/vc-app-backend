import { ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListAdminMandalsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({ example: 'Alpha' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
