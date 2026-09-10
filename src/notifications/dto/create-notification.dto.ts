import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ example: 1, description: 'User ID to send notification to' })
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiPropertyOptional({ example: 1, description: 'Mandal ID (optional)' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  mandalId?: number;

  @ApiProperty({ example: 'Payment Reminder' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Your monthly contribution of ₹500 is due.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.REMINDER })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({
    example: 'LOAN',
    description: 'Module associated with notification (e.g. MANDAL, LOAN, CONTRIBUTION)',
  })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({
    example: 42,
    description: 'ID of the referenced entity (e.g., contribution ID)',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  referenceId?: number;
}
