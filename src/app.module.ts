import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AppLoggerService } from './common/app-logger.service';
import { MandalModule } from './mandal/mandal.module';
import { PlansModule } from './plans/plans.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    MandalModule,
    PlansModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppLoggerService],
})
export class AppModule {}
