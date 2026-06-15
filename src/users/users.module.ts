import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AppLoggerService } from '../common/app-logger.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, AppLoggerService],
  exports: [UsersService],
})
export class UsersModule {}
