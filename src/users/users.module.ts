import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../common/storage/storage.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AppLoggerService } from '../common/app-logger.service';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [UsersController],
  providers: [UsersService, AppLoggerService],
  exports: [UsersService],
})
export class UsersModule {}
