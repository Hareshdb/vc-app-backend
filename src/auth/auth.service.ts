import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppLoggerService } from '../common/app-logger.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

const DEFAULT_COUNTRY_CODE = '+91';
const OTP_EXPIRY_MINUTES = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  private normalizeCountryCode(countryCode?: string): string {
    const clean = (countryCode ?? DEFAULT_COUNTRY_CODE).trim();
    return clean.startsWith('+') ? clean : `+${clean}`;
  }

  private generateOtp(): string {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }

  async sendOtp(
    dto: SendOtpDto,
  ): Promise<{ message: string; expireAt: Date; otp: string }> {
    const countryCode = this.normalizeCountryCode(dto.countryCode);
    const otp = this.generateOtp();
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
}
