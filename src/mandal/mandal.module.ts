import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MandalController } from './mandal.controller';
import { MandalService } from './mandal.service';
import { AppLoggerService } from '../common/app-logger.service';

@Module({
  imports: [AuthModule],
  controllers: [MandalController],
  providers: [MandalService, AppLoggerService],
  exports: [MandalService],
})
export class MandalModule {}
