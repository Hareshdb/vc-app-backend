import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a notification for a user' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get notifications for the authenticated user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  findAll(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('isRead', new ParseBoolPipe({ optional: true })) isRead?: boolean,
  ) {
    return this.notificationsService.findAll(user, { page, limit, isRead });
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mark a notification as read / update' })
  markAsRead(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNotificationDto,
  ) {
    return this.notificationsService.markAsRead(user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a notification' })
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.remove(user, id);
  }
}
