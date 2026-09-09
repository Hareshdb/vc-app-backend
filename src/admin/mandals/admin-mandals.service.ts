import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BillingCycle, Prisma, SubscriptionStatus } from '@prisma/client';
import { AppLoggerService } from '../../common/app-logger.service';
import {
  buildPaginationMeta,
  resolvePaginationParams,
} from '../../common/utils/pagination.util';
import { MandalService } from '../../mandal/mandal.service';
import { CreateMandalDto } from '../../mandal/dto/create-mandal.dto';
import { ListMandalMembersQueryDto } from '../../mandal/dto/list-mandal-members-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminUpdateMandalDto } from './dto/admin-update-mandal.dto';
import { ListAdminMandalsQueryDto } from './dto/list-admin-mandals-query.dto';

const mandalSelect = {
  id: true,
  code: true,
  mandalName: true,
  status: true,
  address: true,
  city: true,
  state: true,
  pincode: true,
  mandalStrategy: true,
  mandalPlanId: true,
  amount: true,
  isTrialActive: true,
  mandalStartDate: true,
  createdAt: true,
  updatedAt: true,
  mandalPlan: {
    select: {
      id: true,
      name: true,
      membersCapacity: true,
      planAmount: true,
    },
  },
  _count: {
    select: { members: true },
  },
} satisfies Prisma.MandalMasterSelect;

@Injectable()
export class AdminMandalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mandalService: MandalService,
    private readonly logger: AppLoggerService,
  ) {}

  private formatMandal(
    mandal: Prisma.MandalMasterGetPayload<{ select: typeof mandalSelect }>,
  ) {
    return {
      id: mandal.id,
      code: mandal.code,
      mandalName: mandal.mandalName,
      status: mandal.status,
      address: mandal.address,
      city: mandal.city,
      state: mandal.state,
      pincode: mandal.pincode,
      mandalStrategy: mandal.mandalStrategy,
      mandalPlanId: mandal.mandalPlanId,
      planName: mandal.mandalPlan.name,
      planMembersCapacity: mandal.mandalPlan.membersCapacity,
      planAmount: Number(mandal.mandalPlan.planAmount),
      amount: Number(mandal.amount),
      isTrialActive: mandal.isTrialActive,
      mandalStartDate: mandal.mandalStartDate,
      memberCount: mandal._count.members,
      createdAt: mandal.createdAt,
      updatedAt: mandal.updatedAt,
    };
  }

  async listMandals(query: ListAdminMandalsQueryDto) {
    const { page, limit, skip, take } = resolvePaginationParams(
      query.page,
      query.limit,
    );

    const keyword = query.keyword?.trim();
    const where: Prisma.MandalMasterWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(keyword
        ? {
            OR: [
              { mandalName: { contains: keyword, mode: 'insensitive' } },
              { code: { contains: keyword, mode: 'insensitive' } },
              { city: { contains: keyword, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [mandals, total] = await Promise.all([
      this.prisma.mandalMaster.findMany({
        where,
        select: mandalSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.mandalMaster.count({ where }),
    ]);

    return {
      mandals: mandals.map((mandal) => this.formatMandal(mandal)),
      ...buildPaginationMeta(total, page, limit),
    };
  }

  async getMandalById(id: number) {
    const mandal = await this.prisma.mandalMaster.findFirst({
      where: { id, deletedAt: null },
      select: mandalSelect,
    });

    if (!mandal) {
      throw new NotFoundException('Mandal not found');
    }

    return { mandal: this.formatMandal(mandal) };
  }

  async createMandal(dto: CreateMandalDto) {
    const result = await this.mandalService.createMandal(dto);
    const mandal = await this.getMandalById(result.mandal.id);
    return mandal;
  }

  async updateMandal(id: number, dto: AdminUpdateMandalDto) {
    const existing = await this.prisma.mandalMaster.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Mandal not found');
    }

    let newMemberLimit: number | undefined = undefined;
    if (dto.mandalPlanId) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: dto.mandalPlanId },
      });
      if (!plan) {
        throw new NotFoundException('Mandal plan not found');
      }
      newMemberLimit = plan.membersCapacity;

      const isNewPlanFree =
        Number(plan.planAmount) === 0 ||
        plan.name.toUpperCase().includes('FREE');

      if (!isNewPlanFree) {
        const existingSubscription = await this.prisma.subscription.findFirst({
          where: { mandalId: id, deletedAt: null },
        });

        if (!existingSubscription) {
          const now = new Date();
          const currentPeriodEnd = new Date(now);
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

          await this.prisma.subscription.create({
            data: {
              mandalId: id,
              packageId: dto.mandalPlanId,
              billingCycle: BillingCycle.YEARLY,
              status: SubscriptionStatus.ACTIVE,
              startedAt: now,
              currentPeriodStart: now,
              currentPeriodEnd,
            },
          });
        } else {
          await this.prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              packageId: dto.mandalPlanId,
              status: SubscriptionStatus.ACTIVE,
            },
          });
        }
      }
    }

    const mandal = await this.prisma.mandalMaster.update({
      where: { id },
      data: {
        ...(dto.mandalName !== undefined
          ? { mandalName: dto.mandalName.trim() }
          : {}),
        ...(dto.mandalStrategy !== undefined
          ? { mandalStrategy: dto.mandalStrategy }
          : {}),
        ...(dto.mandalPlanId !== undefined
          ? { mandalPlanId: dto.mandalPlanId, memberLimit: newMemberLimit }
          : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
        ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
        ...(dto.state !== undefined ? { state: dto.state.trim() } : {}),
        ...(dto.pincode !== undefined ? { pincode: dto.pincode.trim() } : {}),
        ...(dto.mandalStartDate !== undefined
          ? { mandalStartDate: new Date(dto.mandalStartDate) }
          : {}),
        ...(dto.isTrialActive !== undefined
          ? { isTrialActive: dto.isTrialActive }
          : {}),
      },
      select: mandalSelect,
    });

    this.logger.log(`Admin updated mandal id=${id}`, AdminMandalsService.name);

    return { mandal: this.formatMandal(mandal) };
  }

  async deleteMandal(id: number) {
    const existing = await this.prisma.mandalMaster.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Mandal not found');
    }

    const activeMembers = await this.prisma.mandalMember.count({
      where: { mandalId: id },
    });

    if (activeMembers > 0) {
      throw new ConflictException(
        'Cannot delete mandal with active members. Deactivate it instead.',
      );
    }

    await this.prisma.mandalMaster.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Admin soft-deleted mandal id=${id}`, AdminMandalsService.name);

    return { message: 'Mandal deleted successfully' };
  }

  async getMandalMembers(id: number, query: ListMandalMembersQueryDto) {
    return this.mandalService.listMandalMembers(id, query);
  }

  async listPlans() {
    const plans = await this.prisma.plan.findMany({
      orderBy: { membersCapacity: 'asc' },
      select: {
        id: true,
        name: true,
        membersCapacity: true,
        planAmount: true,
        description: true,
      },
    });

    return {
      plans: plans.map((plan) => ({
        ...plan,
        planAmount: Number(plan.planAmount),
      })),
    };
  }
}
