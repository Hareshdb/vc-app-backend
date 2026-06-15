import { ConflictException, Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';
import { randomBytes } from 'crypto';
import { AppLoggerService } from '../common/app-logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMandalDto } from './dto/create-mandal.dto';

const DEFAULT_COUNTRY_CODE = '+91';

@Injectable()
export class MandalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  private normalizeCountryCode(countryCode?: string): string {
    const clean = (countryCode ?? DEFAULT_COUNTRY_CODE).trim();
    return clean.startsWith('+') ? clean : `+${clean}`;
  }

  private buildMandalCode(): string {
    return `VC-${randomBytes(8).toString('hex').toUpperCase()}`;
  }

  async createMandal(dto: CreateMandalDto) {
    const countryCode = this.normalizeCountryCode(dto.countryCode);
    const mobileNumber = dto.adminMobileNumber.trim();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        countryCode,
        mobileNumber,
        status: Status.ACTIVE,
      },
    });
    if (!existingUser) {
      throw new ConflictException('Admin user not found');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const mandal = await tx.mandalMaster.create({
        data: {
          mandalId: this.buildMandalCode(),
          mandalName: dto.mandalName.trim(),
          mandalStrategy: dto.mandalStrategy,
          mandalSize: dto.mandalSize,
        },
      });

      const memberMap = await tx.mandalMember.create({
        data: {
          mandalId: mandal.id,
          userId: existingUser.id,
        },
      });

      return { mandal, memberMap };
    });

    this.logger.log(
      `Mandal created id=${created.mandal.id} adminUser=${existingUser.id}`,
      MandalService.name,
    );

    return {
      message: 'Mandal created successfully',
      mandal: created.mandal,
      adminUser: existingUser,
    };
  }
}
