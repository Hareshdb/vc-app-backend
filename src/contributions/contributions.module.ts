import { Module } from '@nestjs/common';
import { AppLoggerService } from '../common/app-logger.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ContributionsController } from './contributions.controller';
import { ContributionsService } from './contributions.service';

@Module({
  imports: [PrismaModule],
  controllers: [ContributionsController],
  providers: [ContributionsService, AppLoggerService],
  exports: [ContributionsService],
})
export class ContributionsModule {}
