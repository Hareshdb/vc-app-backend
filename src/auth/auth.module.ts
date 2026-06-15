import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AppLoggerService } from '../common/app-logger.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AppLoggerService],
})
export class AuthModule {}
