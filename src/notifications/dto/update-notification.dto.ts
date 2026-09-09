import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationDto {
  @ApiPropertyOptional({ example: true, description: 'Mark notification as read' })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
