import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { AppLoggerService } from '../common/app-logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async create(dto: CreateSubscriptionDto) {
    const mandal = await this.prisma.mandalMaster.findFirst({
      where: { id: dto.mandalId, deletedAt: null },
    });
    if (!mandal) throw new NotFoundException('Mandal not found');

    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.packageId },
    });
    if (!plan) throw new NotFoundException('Plan/Package not found');

    const subscription = await this.prisma.subscription.create({
      data: {
        mandalId: dto.mandalId,
        packageId: dto.packageId,
        billingCycle: dto.billingCycle,
        status: dto.status ?? SubscriptionStatus.TRIAL,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : null,
        trialEndsAt: dto.trialEndsAt ? new Date(dto.trialEndsAt) : null,
        currentPeriodStart: dto.currentPeriodStart
          ? new Date(dto.currentPeriodStart)
          : null,
        currentPeriodEnd: dto.currentPeriodEnd
          ? new Date(dto.currentPeriodEnd)
          : null,
      },
      include: { mandal: true, package: true },
    });

    this.logger.log(
      `Subscription created id=${subscription.id} mandalId=${dto.mandalId}`,
      SubscriptionsService.name,
    );

    return { message: 'Subscription created successfully', subscription };
  }

  async findAll(mandalId?: number) {
    const where: any = { deletedAt: null };
    if (mandalId) where.mandalId = mandalId;

    const subscriptions = await this.prisma.subscription.findMany({
      where,
      include: { mandal: true, package: true },
      orderBy: { createdAt: 'desc' },
    });

    return { subscriptions };
  }

  async findOne(id: number) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, deletedAt: null },
      include: { mandal: true, package: true },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');

    return { subscription };
  }

  async update(id: number, dto: UpdateSubscriptionDto) {
    const existing = await this.prisma.subscription.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Subscription not found');

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        ...(dto.billingCycle && { billingCycle: dto.billingCycle }),
        ...(dto.status && { status: dto.status }),
        ...(dto.startedAt && { startedAt: new Date(dto.startedAt) }),
        ...(dto.trialEndsAt && { trialEndsAt: new Date(dto.trialEndsAt) }),
        ...(dto.currentPeriodStart && {
          currentPeriodStart: new Date(dto.currentPeriodStart),
        }),
        ...(dto.currentPeriodEnd && {
          currentPeriodEnd: new Date(dto.currentPeriodEnd),
        }),
        ...(dto.cancelledAt && { cancelledAt: new Date(dto.cancelledAt) }),
      },
      include: { mandal: true, package: true },
    });

    this.logger.log(
      `Subscription updated id=${id}`,
      SubscriptionsService.name,
    );

    return { message: 'Subscription updated successfully', subscription: updated };
  }

  async remove(id: number) {
    const existing = await this.prisma.subscription.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Subscription not found');

    await this.prisma.subscription.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(
      `Subscription soft-deleted id=${id}`,
      SubscriptionsService.name,
    );

    return { message: 'Subscription deleted successfully' };
  }
}
