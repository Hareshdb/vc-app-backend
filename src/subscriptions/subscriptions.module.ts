import { Module } from '@nestjs/common';
import { AppLoggerService } from '../common/app-logger.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, AppLoggerService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
