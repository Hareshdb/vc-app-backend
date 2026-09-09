import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppLoggerService } from '../common/app-logger.service';
import { MandalModule } from '../mandal/mandal.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminJwtGuard } from './auth/guards/admin-jwt.guard';
import { AdminJwtStrategy } from './auth/strategies/admin-jwt.strategy';
import { AdminMandalsController } from './mandals/admin-mandals.controller';
import { AdminMandalsService } from './mandals/admin-mandals.service';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';

@Module({
  imports: [
    PrismaModule,
    MandalModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AdminAuthController, AdminUsersController, AdminMandalsController],
  providers: [
    AdminAuthService,
    AdminUsersService,
    AdminMandalsService,
    AdminJwtStrategy,
    AdminJwtGuard,
    AppLoggerService,
  ],
})
export class AdminModule {}
