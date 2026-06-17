import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async listPlans() {
    const plans = await this.prisma.plan.findMany({
      orderBy: { minUsers: 'asc' },
      select: {
        id: true,
        name: true,
        minUsers: true,
        maxUsers: true,
        pricePerPerson: true,
        description: true,
      },
    });

    return { plans };
  }
}
