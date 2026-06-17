import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { AppLoggerService } from '../common/app-logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

const DEFAULT_COUNTRY_CODE = '+91';
const OTP_EXPIRY_MINUTES = 30;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private normalizeCountryCode(countryCode?: string): string {
    const clean = (countryCode ?? DEFAULT_COUNTRY_CODE).trim();
    return clean.startsWith('+') ? clean : `+${clean}`;
  }

  private generateOtp(): string {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getJwtSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }
    return secret;
  }

  private createAccessToken(userId: number): string {
    return this.jwtService.sign(
      { sub: userId, type: 'access' },
      {
        secret: this.getJwtSecret(),
        expiresIn: ACCESS_TOKEN_EXPIRY,
      },
    );
  }

  private createRefreshToken(userId: number): string {
    return this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: this.getJwtSecret(),
        expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
      },
    );
  }

  async sendOtp(
    dto: SendOtpDto,
  ): Promise<{ message: string; expireAt: Date; otp: string }> {
    const countryCode = this.normalizeCountryCode(dto.countryCode);
    const otp =
      process.env.ENVIRONMENT === 'production' ? this.generateOtp() : '000000';
    const expireAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.otpMaster.create({
      data: {
        countryCode,
        mobileNumber: dto.mobileNumber.trim(),
        otp,
        expireAt,
        isUsed: false,
      },
    });

    this.logger.log(
      `OTP generated for ${countryCode}${dto.mobileNumber.trim()}. OTP: ${otp}`,
      AuthService.name,
    );

    return { message: 'OTP generated successfully', otp, expireAt };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ verified: boolean }> {
    const countryCode = this.normalizeCountryCode(dto.countryCode);
    const mobileNumber = dto.mobileNumber.trim();
    const otp = dto.otp.trim();

    const otpRow = await this.prisma.otpMaster.findFirst({
      where: {
        countryCode,
        mobileNumber,
        otp,
        isUsed: false,
        expireAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRow) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.$transaction([
      this.prisma.otpMaster.update({
        where: { id: otpRow.id },
        data: { isUsed: true },
      }),
      this.prisma.user.updateMany({
        where: { countryCode, mobileNumber },
        data: { isMobileVerified: true },
      }),
    ]);

    this.logger.log(
      `OTP verified for ${countryCode}${mobileNumber}`,
      AuthService.name,
    );
    return { verified: true };
  }

  private computePackageExpiry(createdAt: Date, durationMonths: number): Date {
    const expiry = new Date(createdAt);
    expiry.setMonth(expiry.getMonth() + durationMonths);
    return expiry;
  }

  async login(dto: LoginDto) {
    const countryCode = this.normalizeCountryCode(dto.countryCode);
    const mobileNumber = dto.mobileNumber.trim();

    const user = await this.prisma.user.findFirst({
      where: { countryCode, mobileNumber, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('No account found for this mobile number');
    }

    if (!user.isMobileVerified) {
      throw new BadRequestException('Mobile number is not verified');
    }

    const membership = await this.prisma.mandalMember.findFirst({
      where: { userId: user.id },
      include: {
        mandal: {
          include: { mandalPlan: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const accessToken = this.createAccessToken(user.id);
    const refreshToken = this.createRefreshToken(user.id);
    const refreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoggedInAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(refreshToken),
          expiresAt: refreshTokenExpiresAt,
        },
      }),
    ]);

    const mandal = membership?.mandal ?? null;

    this.logger.log(`User logged in id=${user.id}`, AuthService.name);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: ACCESS_TOKEN_EXPIRY,
      refreshTokenExpiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
      user: {
        id: user.id,
        userType: user.userType,
        fullName: user.fullName,
        email: user.email,
        countryCode: user.countryCode,
        mobileNumber: user.mobileNumber,
        isMobileVerified: user.isMobileVerified,
        status: user.status,
      },
      mandal: mandal ?? null,
      // ? {
      //     id: mandal.id,
      //     mandalId: mandal.code,
      //     mandalName: mandal.mandalName,
      //     mandalStrategy: mandal.mandalStrategy,
      //     mandalPlanId: mandal.mandalPlanId,
      //     planName: mandal.mandalPlan.name,
      //     amount: Number(mandal.amount),
      //     isTrialActive: mandal.isTrialActive,
      //     packageName: `${mandal.mandalPlan.name} Plan`,
      //     packageExpiryDate: this.computePackageExpiry(
      //       mandal.createdAt,

      //     ).toISOString(),
      //   }
      // : null,
    };
  }

  async refreshAccessToken(dto: RefreshTokenDto) {
    let payload: { sub: number; type: string };

    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.getJwtSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.hashToken(dto.refreshToken);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        userId: payload.sub,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = this.createAccessToken(user.id);
    const refreshToken = this.createRefreshToken(user.id);
    const refreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction([
      this.prisma.refreshToken.delete({ where: { id: storedToken.id } }),
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(refreshToken),
          expiresAt: refreshTokenExpiresAt,
        },
      }),
    ]);

    this.logger.log(`Access token refreshed for user id=${user.id}`, AuthService.name);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: ACCESS_TOKEN_EXPIRY,
      refreshTokenExpiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
    };
  }
}
