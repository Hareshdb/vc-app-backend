import { Module } from '@nestjs/common';
import { AppLoggerService } from '../common/app-logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';

@Module({
  controllers: [LoansController],
  providers: [LoansService, PrismaService, AppLoggerService],
  exports: [LoansService],
})
export class LoansModule {}
