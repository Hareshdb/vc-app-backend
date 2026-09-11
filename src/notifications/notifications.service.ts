import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { AppLoggerService } from '../common/app-logger.service';
import {
  buildPaginationMeta,
  resolvePaginationParams,
} from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async create(dto: CreateNotificationDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    if (dto.mandalId) {
      const mandal = await this.prisma.mandalMaster.findFirst({
        where: { id: dto.mandalId, deletedAt: null },
      });
      if (!mandal) throw new NotFoundException('Mandal not found');
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        mandalId: dto.mandalId ?? null,
        title: dto.title,
        message: dto.message,
        type: dto.type,
        module: dto.module ?? null,
        referenceId: dto.referenceId ?? null,
      },
    });

    this.logger.log(
      `Notification created id=${notification.id} userId=${dto.userId}`,
      NotificationsService.name,
    );

    return { message: 'Notification created successfully', notification };
  }

  async findAll(
    currentUser: User,
    query: { page?: number; limit?: number; isRead?: boolean },
  ) {
    const { page, limit, skip, take } = resolvePaginationParams(
      query.page,
      query.limit,
    );

    const where: any = { userId: currentUser.id, deletedAt: null };
    if (query.isRead !== undefined) where.isRead = query.isRead;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      ...buildPaginationMeta(total, page, limit),
    };
  }

  async markAsRead(currentUser: User, id: number, dto: UpdateNotificationDto) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId: currentUser.id, deletedAt: null },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        ...(dto.isRead !== undefined && { isRead: dto.isRead }),
      },
    });

    return { message: 'Notification updated successfully', notification: updated };
  }

  async markAllAsRead(currentUser: User) {
    await this.prisma.notification.updateMany({
      where: { userId: currentUser.id, isRead: false, deletedAt: null },
      data: { isRead: true },
    });

    return { message: 'All notifications marked as read' };
  }

  async remove(currentUser: User, id: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId: currentUser.id, deletedAt: null },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    await this.prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(
      `Notification soft-deleted id=${id}`,
      NotificationsService.name,
    );

    return { message: 'Notification deleted successfully' };
  }
}
