import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { GENDER, User, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AppLoggerService } from '../common/app-logger.service';

const DEFAULT_COUNTRY_CODE = '+91';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  private normalizeCountryCode(countryCode?: string): string {
    const clean = (countryCode ?? DEFAULT_COUNTRY_CODE).trim();
    return clean.startsWith('+') ? clean : `+${clean}`;
  }

  async createUser(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const countryCode = this.normalizeCountryCode(dto.countryCode);
    const mobileNumber = dto.mobileNumber.trim();

    const existingUser = await this.prisma.user.findFirst({
      where: { countryCode, mobileNumber, deletedAt: null },
    });

    if (existingUser) {
      throw new ConflictException('User already exists with same mobile number');
    }

    const user = await this.prisma.user.create({
      data: {
        userType: dto.userType,
        fullName: dto.fullName.trim(),
        email,
        countryCode,
        mobileNumber,
        gender: dto.gender ?? GENDER.OTHER,
        address: dto.address?.trim() ?? 'Not provided',
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        status: UserStatus.PENDING,
      },
    });

    this.logger.log(`User created id=${user.id} type=${user.userType}`, UsersService.name);
    return user;
  }

  async getProfile(user: User) {
    const profile = await this.prisma.user.findFirst({
      where: { id: user.id, deletedAt: null },
      select: {
        id: true,
        userType: true,
        fullName: true,
        email: true,
        countryCode: true,
        mobileNumber: true,
        status: true,
        gender: true,
        birthDate: true,
        address: true,
        isMobileVerified: true,
        joinedAt: true,
        lastLoggedInAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    return { user: profile };
  }
}

