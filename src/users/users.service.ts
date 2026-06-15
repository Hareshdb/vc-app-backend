import { ConflictException, Injectable } from '@nestjs/common';
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
      where: {
        OR: [{ email }, { countryCode, mobileNumber }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User already exists with same email or mobile number');
    }

    const user = await this.prisma.user.create({
      data: {
        userType: dto.userType,
        fullName: dto.fullName.trim(),
        email,
        countryCode,
        mobileNumber,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      },
    });

    this.logger.log(`User created id=${user.id} type=${user.userType}`, UsersService.name);
    return user;
  }
}
