import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserStatus, UserType, GENDER } from '@prisma/client';

import { randomBytes } from 'crypto';

import { AppLoggerService } from '../common/app-logger.service';

import {
  buildPaginationMeta,
  resolvePaginationParams,
} from '../common/utils/pagination.util';

import { PrismaService } from '../prisma/prisma.service';

import { AddMemberToMandalDto } from './dto/add-member-to-mandal.dto';

import { CreateMandalDto } from './dto/create-mandal.dto';

import { ListMandalMembersQueryDto } from './dto/list-mandal-members-query.dto';

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

  // private async findPlanById(planId: number) {
  //   const plan = await this.prisma.plan.findUnique({
  //     where: { id: planId },
  //   });

  //   if (!plan) {
  //     throw new NotFoundException('Mandal plan not found');
  //   }

  //   return plan;
  // }

  private async findMandalByIdOrCode(mandalId: number) {
    const mandal = await this.prisma.mandalMaster.findFirst({
      where: {
        id: mandalId,

        deletedAt: null,
      },

      include: { mandalPlan: true },
    });

    if (!mandal) {
      throw new NotFoundException('Mandal not found');
    }

    return mandal;
  }

  private formatMandalResponse(mandal: {
    id: number;

    code: string;

    mandalName: string;

    mandalStrategy: string;

    mandalPlanId: number;

    amount: { toString(): string };
    isTrialActive: boolean;

    mandalPlan: { name: string; maxUsers: number };
  }) {
    return {
      id: mandal.id,

      mandalId: mandal.code,

      mandalName: mandal.mandalName,

      mandalStrategy: mandal.mandalStrategy,

      mandalPlanId: mandal.mandalPlanId,

      planName: mandal.mandalPlan.name,

      amount: Number(mandal.amount),

      isTrialActive: mandal.isTrialActive,
    };
  }

  private formatMemberUser(user: {
    id: number;

    userType: string;

    fullName: string;

    email: string;

    countryCode: string;

    mobileNumber: string;

    status: string;

    gender: string;

    isMobileVerified: boolean;

    joinedAt: Date | null;

    createdAt: Date;
  }) {
    return {
      id: user.id,

      userType: user.userType,

      fullName: user.fullName,

      email: user.email,

      countryCode: user.countryCode,

      mobileNumber: user.mobileNumber,

      status: user.status,

      gender: user.gender,

      isMobileVerified: user.isMobileVerified,

      joinedAt: user.joinedAt,

      createdAt: user.createdAt,
    };
  }

  async createMandal(dto: CreateMandalDto) {
    const countryCode = this.normalizeCountryCode(dto.countryCode);

    const mobileNumber = dto.adminMobileNumber.trim();

    const existingUser = await this.prisma.user.findFirst({
      where: {
        countryCode,

        mobileNumber,

        deletedAt: null,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('Admin user not found');
    }

    // await this.findPlanById(dto.mandalPlanId);

    const created = await this.prisma.$transaction(async (tx) => {
      const mandal = await tx.mandalMaster.create({
        data: {
          code: this.buildMandalCode(),

          mandalName: dto.mandalName.trim(),

          mandalStrategy: dto.mandalStrategy,

          mandalPlanId: dto.mandalPlanId,

          amount: dto.amount,

          address: dto.address?.trim() ?? 'Not provided',

          city: dto.city?.trim() ?? 'Not provided',

          state: dto.state?.trim() ?? 'Not provided',

          pincode: dto.pincode?.trim() ?? '000000',

          mandalStartDate: dto.mandalStartDate
            ? new Date(dto.mandalStartDate)
            : new Date(),
        },

        include: { mandalPlan: true },
      });

      const memberMap = await tx.mandalMember.create({
        data: {
          mandalId: mandal.id,

          userId: existingUser.id,
        },
      });

      await tx.user.update({
        where: { id: existingUser.id },

        data: {
          userType: UserType.MANDAL_ADMIN,

          status: UserStatus.ACTIVE,

          joinedAt: existingUser.joinedAt
            ? new Date(existingUser.joinedAt)
            : new Date(),
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

      mandal: this.formatMandalResponse(created.mandal),

      adminUser: {
        id: existingUser.id,

        userType: UserType.MANDAL_ADMIN,

        fullName: existingUser.fullName,

        email: existingUser.email,

        countryCode: existingUser.countryCode,

        mobileNumber: existingUser.mobileNumber,

        isMobileVerified: existingUser.isMobileVerified,

        status: UserStatus.ACTIVE,
      },
    };
  }

  async addMemberToMandal(mandalId: number, dto: AddMemberToMandalDto) {
    const mandal = await this.findMandalByIdOrCode(mandalId);

    const userId = dto.userId;
    const existingMembership = await this.prisma.mandalMember.findUnique({
      where: {
        mandalId_userId: {
          mandalId: mandal.id,
          userId: userId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this mandal');
    }

    const member = await this.prisma.mandalMember.create({
      data: {
        mandalId: mandal.id,
        userId: userId,
      },

      include: {
        user: true,
      },
    });

    this.logger.log(
      `Member added mandalId=${mandal.id} userId=${userId}`,
      MandalService.name,
    );

    return {
      message: 'Member added to mandal successfully',

      member: {
        id: member.id,
        mandalId: mandal.id,
        user: this.formatMemberUser(member.user),
        createdAt: member.createdAt,
      },
    };
  }

  async listMandalMembers(mandalId: number, query: ListMandalMembersQueryDto) {
    const mandal = await this.findMandalByIdOrCode(mandalId);
    const { page, limit, skip, take } = resolvePaginationParams(
      query.page,
      query.limit,
    );

    const keyword = query.keyword?.trim();
    const userWhere = keyword
      ? {
          deletedAt: null,
          OR: [
            { fullName: { contains: keyword, mode: 'insensitive' as const } },
            { email: { contains: keyword, mode: 'insensitive' as const } },
            {
              mobileNumber: { contains: keyword, mode: 'insensitive' as const },
            },
          ],
        }
      : { deletedAt: null };

    const where = {
      mandalId: mandal.id,
      user: userWhere,
    };

    const [members, total] = await Promise.all([
      this.prisma.mandalMember.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'asc' },
        skip,
        take,
      }),
      this.prisma.mandalMember.count({ where }),
    ]);

    return {
      mandal: this.formatMandalResponse(mandal),
      members: members.map((member) => ({
        id: member.id,
        mandalId: member.mandalId,
        user: this.formatMemberUser(member.user),
        createdAt: member.createdAt,
      })),
      ...buildPaginationMeta(total, page, limit),
    };
  }
}
