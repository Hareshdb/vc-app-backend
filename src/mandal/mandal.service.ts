import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BillingCycle, MemberRole, SubscriptionStatus, UserStatus } from '@prisma/client';

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

import { UpdateMandalProfileDto } from './dto/update-mandal-profile.dto';

import { SaveDrawWinnerDto } from './dto/save-draw-winner.dto';

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
    memberLimit: number | null;
    mandalInterestPercent?: number | null;

    mandalPlan: { name: string; membersCapacity: number };
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

      memberLimit: mandal.memberLimit,

      mandalInterestPercent: mandal.mandalInterestPercent ?? 0,
    };
  }

  private formatMemberUser(user: {
    id: number;

    fullName: string;

    email: string;

    countryCode: string;

    mobileNumber: string;

    status: string;

    gender: string;

    isMobileVerified: boolean;

    profilePicture?: string | null;

    createdAt: Date;
  }) {
    return {
      id: user.id,

      fullName: user.fullName,

      email: user.email,

      countryCode: user.countryCode,

      mobileNumber: user.mobileNumber,

      status: user.status,

      gender: user.gender,

      isMobileVerified: user.isMobileVerified,

      profilePicture: user.profilePicture,

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

    const created = await this.prisma.$transaction(async (tx) => {
      const selectedPlan = await tx.plan.findUnique({
        where: { id: dto.mandalPlanId },
      });

      if (!selectedPlan) {
        throw new NotFoundException('Selected plan not found');
      }

      const mandal = await tx.mandalMaster.create({
        data: {
          code: this.buildMandalCode(),

          mandalName: dto.mandalName.trim(),

          mandalStrategy: dto.mandalStrategy,

          mandalPlanId: dto.mandalPlanId,

          memberLimit: selectedPlan.membersCapacity,

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

          role: MemberRole.MANDAL_ADMIN,

          joinedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: existingUser.id },

        data: {
          status: UserStatus.ACTIVE,
        },
      });

      const isFreePlan =
        Number(selectedPlan.planAmount) === 0 ||
        selectedPlan.name.toUpperCase().includes('FREE');

      let subscription: any = null;
      if (!isFreePlan) {
        const now = new Date();
        const trialEndsAt = new Date(now);
        trialEndsAt.setDate(trialEndsAt.getDate() + 30);
        const currentPeriodEnd = new Date(now);
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

        subscription = await tx.subscription.create({
          data: {
            mandalId: mandal.id,
            packageId: mandal.mandalPlanId,
            billingCycle: BillingCycle.YEARLY,
            status: SubscriptionStatus.TRIAL,
            startedAt: now,
            trialEndsAt,
            currentPeriodStart: now,
            currentPeriodEnd,
          },
        });
      }

      return { mandal, memberMap, subscription };
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

        role: MemberRole.MANDAL_ADMIN,

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

    // Check mandal member limit if set
    if (mandal.memberLimit !== null) {
      const currentCount = await this.prisma.mandalMember.count({
        where: { mandalId: mandal.id, deletedAt: null },
      });

      if (currentCount >= mandal.memberLimit) {
        throw new BadRequestException(
          `Mandal has reached its member limit of ${mandal.memberLimit}`,
        );
      }
    }

    const existingMembership = await this.prisma.mandalMember.findUnique({
      where: {
        mandalId_userId: {
          mandalId: mandal.id,
          userId: userId,
        },
      },
    });

    if (existingMembership && !existingMembership.deletedAt) {
      throw new ConflictException('User is already a member of this mandal');
    }

    let member;
    if (existingMembership && existingMembership.deletedAt) {
      // Re-activate previously removed member
      member = await this.prisma.mandalMember.update({
        where: { id: existingMembership.id },
        data: {
          role: dto.role ?? MemberRole.MEMBER,
          joinedAt: new Date(),
          leftAt: null,
          deletedAt: null,
        },
        include: { user: true },
      });
    } else {
      member = await this.prisma.mandalMember.create({
        data: {
          mandalId: mandal.id,
          userId: userId,
          role: dto.role ?? MemberRole.MEMBER,
          joinedAt: new Date(),
        },

        include: {
          user: true,
        },
      });
    }

    this.logger.log(
      `Member added mandalId=${mandal.id} userId=${userId}`,
      MandalService.name,
    );

    return {
      message: 'Member added to mandal successfully',

      member: {
        id: member.id,
        mandalId: mandal.id,
        role: member.role,
        joinedAt: member.joinedAt,
        user: this.formatMemberUser(member.user),
        createdAt: member.createdAt,
      },
    };
  }

  async removeMemberFromMandal(mandalId: number, memberId: number) {
    await this.findMandalByIdOrCode(mandalId);

    const member = await this.prisma.mandalMember.findFirst({
      where: { id: memberId, mandalId, deletedAt: null },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this mandal');
    }

    const now = new Date();
    await this.prisma.mandalMember.update({
      where: { id: memberId },
      data: {
        leftAt: now,
        deletedAt: now,
      },
    });

    this.logger.log(
      `Member removed (soft) mandalId=${mandalId} memberId=${memberId}`,
      MandalService.name,
    );

    return { message: 'Member removed from mandal successfully' };
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
      deletedAt: null,
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
        role: member.role,
        joinedAt: member.joinedAt,
        leftAt: member.leftAt,
        user: this.formatMemberUser(member.user),
        createdAt: member.createdAt,
      })),
      ...buildPaginationMeta(total, page, limit),
    };
  }

  async updateMandalProfile(mandalId: number, dto: UpdateMandalProfileDto) {
    const mandal = await this.findMandalByIdOrCode(mandalId);

    const updated = await this.prisma.mandalMaster.update({
      where: { id: mandal.id },
      data: {
        ...(dto.mandalName !== undefined && { mandalName: dto.mandalName.trim() }),
        ...(dto.address !== undefined && { address: dto.address.trim() }),
        ...(dto.city !== undefined && { city: dto.city.trim() }),
        ...(dto.state !== undefined && { state: dto.state.trim() }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode.trim() }),
        ...(dto.mandalInterestPercent !== undefined && {
          mandalInterestPercent: dto.mandalInterestPercent,
        }),
      },
      select: {
        id: true,
        code: true,
        mandalName: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        mandalInterestPercent: true,
        status: true,
      },
    });

    this.logger.log(
      `Mandal profile updated id=${mandal.id}`,
      MandalService.name,
    );

    return { message: 'Mandal profile updated successfully', mandal: updated };
  }

  async getDashboardStats(mandalId: number) {
    const mandal = await this.findMandalByIdOrCode(mandalId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const [
      totalSavingsAggregate,
      monthSavingsAggregate,
      activeMembersCount,
      recentContributions,
    ] = await Promise.all([
      this.prisma.contribution.aggregate({
        _sum: { amount: true },
        where: { mandalId: mandal.id, deletedAt: null },
      }),
      this.prisma.contribution.aggregate({
        _sum: { amount: true },
        where: {
          mandalId: mandal.id,
          deletedAt: null,
          contributionDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      this.prisma.mandalMember.count({
        where: { mandalId: mandal.id, deletedAt: null },
      }),
      this.prisma.contribution.findMany({
        where: { mandalId: mandal.id, deletedAt: null },
        include: {
          member: {
            include: { user: true },
          },
        },
        orderBy: { contributionDate: 'desc' },
        take: 5,
      }),
    ]);

    const totalGroupSavings = Number(totalSavingsAggregate._sum.amount ?? 0);
    const collectedThisMonth = Number(monthSavingsAggregate._sum.amount ?? 0);

    return {
      totalGroupSavings,
      collectedThisMonth,
      activeMembersCount,
      recentContributions: recentContributions.map((c) => ({
        id: c.id,
        memberId: c.memberId,
        memberName: c.member.user.fullName,
        memberAvatar: c.member.user.profilePicture,
        amount: Number(c.amount),
        type: c.type,
        paymentMethod: c.paymentMethod,
        contributionDate: c.contributionDate,
        createdAt: c.createdAt,
      })),
    };
  }

  async getDrawEligibleMembers(mandalId: number) {
    const mandal = await this.findMandalByIdOrCode(mandalId);

    const winners = await this.prisma.drawWinner.findMany({
      where: { mandalId: mandal.id, deletedAt: null },
      select: { memberId: true },
    });
    const wonMemberIds = winners.map((w) => w.memberId);

    const members = await this.prisma.mandalMember.findMany({
      where: {
        mandalId: mandal.id,
        deletedAt: null,
        id: { notIn: wonMemberIds.length > 0 ? wonMemberIds : [-1] },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            mobileNumber: true,
            countryCode: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      success: true,
      data: members.map((m) => ({
        id: m.id,
        memberId: m.id,
        userId: m.user.id,
        name: m.user.fullName,
        fullName: m.user.fullName,
        mobile: `${m.user.countryCode} ${m.user.mobileNumber}`,
        mobileNumber: `${m.user.countryCode} ${m.user.mobileNumber}`,
        initial: m.user.fullName ? m.user.fullName.charAt(0).toUpperCase() : 'M',
        role: m.role,
      })),
    };
  }

  async getDrawWinners(mandalId: number) {
    const mandal = await this.findMandalByIdOrCode(mandalId);

    const winners = await this.prisma.drawWinner.findMany({
      where: { mandalId: mandal.id, deletedAt: null },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                mobileNumber: true,
                countryCode: true,
                profilePicture: true,
              },
            },
          },
        },
      },
      orderBy: { wonAt: 'desc' },
    });

    return {
      success: true,
      data: winners.map((w) => ({
        id: w.id,
        memberId: w.memberId,
        userId: w.member.user.id,
        name: w.member.user.fullName,
        fullName: w.member.user.fullName,
        mobile: `${w.member.user.countryCode} ${w.member.user.mobileNumber}`,
        mobileNumber: `${w.member.user.countryCode} ${w.member.user.mobileNumber}`,
        initial: w.member.user.fullName ? w.member.user.fullName.charAt(0).toUpperCase() : 'W',
        wonAt: w.wonAt,
        amount: w.amount ? Number(w.amount) : null,
        remarks: w.remarks,
        hasWon: true,
      })),
    };
  }

  async saveDrawWinner(mandalId: number, dto: SaveDrawWinnerDto) {
    const mandal = await this.findMandalByIdOrCode(mandalId);

    const member = await this.prisma.mandalMember.findFirst({
      where: { id: dto.memberId, mandalId: mandal.id, deletedAt: null },
      include: { user: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this mandal');
    }

    const winner = await this.prisma.drawWinner.create({
      data: {
        mandalId: mandal.id,
        memberId: dto.memberId,
        amount: dto.amount,
        remarks: dto.remarks,
      },
      include: {
        member: {
          include: { user: true },
        },
      },
    });

    return {
      success: true,
      message: 'Draw winner saved successfully',
      data: {
        id: winner.id,
        memberId: winner.memberId,
        userId: winner.member.user.id,
        name: winner.member.user.fullName,
        fullName: winner.member.user.fullName,
        mobile: `${winner.member.user.countryCode} ${winner.member.user.mobileNumber}`,
        wonAt: winner.wonAt,
      },
    };
  }
}

