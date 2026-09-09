import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AdminUser } from '@prisma/client';
import { AppLoggerService } from '../../common/app-logger.service';
import { hashPassword, verifyPassword } from '../../common/utils/password.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminChangePasswordDto } from './dto/admin-change-password.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminUpdateProfileDto } from './dto/admin-update-profile.dto';

const ADMIN_ACCESS_TOKEN_EXPIRY = '8h';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getJwtSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }
    return secret;
  }

  private createAccessToken(adminId: number): string {
    return this.jwtService.sign(
      { sub: adminId, type: 'admin-access' },
      {
        secret: this.getJwtSecret(),
        expiresIn: ADMIN_ACCESS_TOKEN_EXPIRY,
      },
    );
  }

  async login(dto: AdminLoginDto) {
    const email = dto.email.trim().toLowerCase();

    const admin = await this.prisma.adminUser.findFirst({
      where: { email, deletedAt: null },
    });

    if (!admin || admin.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!verifyPassword(dto.password, admin.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.createAccessToken(admin.id);

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`Admin logged in id=${admin.id}`, AdminAuthService.name);

    return {
      accessToken,
      accessTokenExpiresIn: ADMIN_ACCESS_TOKEN_EXPIRY,
      admin: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
      },
    };
  }

  async getProfile(admin: AdminUser) {
    return {
      admin: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        status: admin.status,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    };
  }

  async updateProfile(admin: AdminUser, dto: AdminUpdateProfileDto) {
    const email = dto.email.trim().toLowerCase();

    const duplicate = await this.prisma.adminUser.findFirst({
      where: {
        email,
        id: { not: admin.id },
        deletedAt: null,
      },
    });

    if (duplicate) {
      throw new ConflictException('Another admin already uses this email');
    }

    const updated = await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        fullName: dto.fullName.trim(),
        email,
      },
    });

    this.logger.log(`Admin updated profile id=${admin.id}`, AdminAuthService.name);

    return {
      admin: {
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        status: updated.status,
        lastLoginAt: updated.lastLoginAt,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    };
  }

  async changePassword(admin: AdminUser, dto: AdminChangePasswordDto) {
    if (!verifyPassword(dto.currentPassword, admin.password)) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { password: hashPassword(dto.newPassword) },
    });

    this.logger.log(`Admin changed password id=${admin.id}`, AdminAuthService.name);

    return { message: 'Password changed successfully' };
  }
}
