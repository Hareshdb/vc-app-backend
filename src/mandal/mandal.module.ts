import { Module } from '@nestjs/common';
import { MandalController } from './mandal.controller';
import { MandalService } from './mandal.service';
import { AppLoggerService } from '../common/app-logger.service';

@Module({
  controllers: [MandalController],
  providers: [MandalService, AppLoggerService],
})
export class MandalModule {}
