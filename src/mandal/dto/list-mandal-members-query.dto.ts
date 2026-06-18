import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListMandalMembersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search members by name, email, or mobile number',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  keyword?: string;
}
