import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

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
