import { Module } from '@nestjs/common';
import { AppLoggerService } from '../common/app-logger.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, AppLoggerService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
