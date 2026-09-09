import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContributionType } from '@prisma/client';
import { AppLoggerService } from '../common/app-logger.service';
import {
  buildPaginationMeta,
  resolvePaginationParams,
} from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';

@Injectable()
export class ContributionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  private async validateMandal(mandalId: number) {
    const mandal = await this.prisma.mandalMaster.findFirst({
      where: { id: mandalId, deletedAt: null },
    });
    if (!mandal) throw new NotFoundException('Mandal not found');
    return mandal;
  }

  private async validateMember(memberId: number, mandalId: number) {
    const member = await this.prisma.mandalMember.findFirst({
      where: { id: memberId, mandalId, deletedAt: null },
    });
    if (!member) throw new NotFoundException('Member not found in this mandal');
    return member;
  }

  async create(mandalId: number, dto: CreateContributionDto) {
    await this.validateMandal(mandalId);
    await this.validateMember(dto.memberId, mandalId);

    const createdBy = dto.createdBy;
    if (!createdBy) {
      throw new BadRequestException('createdBy user ID is required');
    }

    if (dto.type === ContributionType.MONTHLY_FEE) {
      const targetDate = new Date(dto.contributionDate);
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endOfMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const existingMonthlyContribution = await this.prisma.contribution.findFirst({
        where: {
          mandalId,
          memberId: dto.memberId,
          type: ContributionType.MONTHLY_FEE,
          deletedAt: null,
          contributionDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        include: {
          member: {
            include: {
              user: true,
            },
          },
        },
      });

      if (existingMonthlyContribution) {
        const memberName =
          existingMonthlyContribution.member?.user?.fullName || 'Selected member';
        const monthName = targetDate.toLocaleString('en-IN', {
          month: 'long',
          year: 'numeric',
        });
        throw new BadRequestException(
          `Mandal EMI contribution already recorded for ${memberName} for ${monthName}.`,
        );
      }
    }

    const contribution = await this.prisma.contribution.create({
      data: {
        mandalId,
        memberId: dto.memberId,
        amount: dto.amount,
        type: dto.type,
        ...(dto.entryType && { entryType: dto.entryType }),
        paymentMethod: dto.paymentMethod,
        reference: dto.reference,
        note: dto.note,
        contributionDate: new Date(dto.contributionDate),
        createdBy,
      },
      include: {
        member: { include: { user: true } },
        mandal: true,
      },
    });

    this.logger.log(
      `Contribution created id=${contribution.id} mandalId=${mandalId} memberId=${dto.memberId}`,
      ContributionsService.name,
    );

    return { message: 'Contribution created successfully', contribution };
  }

  async findAll(
    mandalId: number,
    query: { page?: number; limit?: number; memberId?: number },
  ) {
    await this.validateMandal(mandalId);

    const { page, limit, skip, take } = resolvePaginationParams(
      query.page,
      query.limit,
    );

    const where: any = { mandalId, deletedAt: null };
    if (query.memberId) where.memberId = query.memberId;

    const [contributions, total] = await Promise.all([
      this.prisma.contribution.findMany({
        where,
        include: { member: { include: { user: true } } },
        orderBy: { contributionDate: 'desc' },
        skip,
        take,
      }),
      this.prisma.contribution.count({ where }),
    ]);

    return {
      contributions,
      ...buildPaginationMeta(total, page, limit),
    };
  }

  async findOne(mandalId: number, id: number) {
    await this.validateMandal(mandalId);

    const contribution = await this.prisma.contribution.findFirst({
      where: { id, mandalId, deletedAt: null },
      include: { member: { include: { user: true } }, mandal: true },
    });

    if (!contribution) throw new NotFoundException('Contribution not found');

    return { contribution };
  }

  async update(mandalId: number, id: number, dto: UpdateContributionDto) {
    await this.validateMandal(mandalId);

    const existing = await this.prisma.contribution.findFirst({
      where: { id, mandalId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Contribution not found');

    const targetType = dto.type ?? existing.type;
    if (targetType === ContributionType.MONTHLY_FEE) {
      const targetDate = dto.contributionDate
        ? new Date(dto.contributionDate)
        : existing.contributionDate;
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endOfMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const duplicate = await this.prisma.contribution.findFirst({
        where: {
          id: { not: id },
          mandalId,
          memberId: existing.memberId,
          type: ContributionType.MONTHLY_FEE,
          deletedAt: null,
          contributionDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        include: {
          member: {
            include: {
              user: true,
            },
          },
        },
      });

      if (duplicate) {
        const memberName = duplicate.member?.user?.fullName || 'Selected member';
        const monthName = targetDate.toLocaleString('en-IN', {
          month: 'long',
          year: 'numeric',
        });
        throw new BadRequestException(
          `Mandal EMI contribution already recorded for ${memberName} for ${monthName}.`,
        );
      }
    }

    const updated = await this.prisma.contribution.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.type && { type: dto.type }),
        ...(dto.entryType && { entryType: dto.entryType }),
        ...(dto.paymentMethod && { paymentMethod: dto.paymentMethod }),
        ...(dto.reference !== undefined && { reference: dto.reference }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.contributionDate && {
          contributionDate: new Date(dto.contributionDate),
        }),
      },
      include: { member: { include: { user: true } }, mandal: true },
    });

    this.logger.log(
      `Contribution updated id=${id}`,
      ContributionsService.name,
    );

    return { message: 'Contribution updated successfully', contribution: updated };
  }

  async remove(mandalId: number, id: number) {
    await this.validateMandal(mandalId);

    const existing = await this.prisma.contribution.findFirst({
      where: { id, mandalId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Contribution not found');

    await this.prisma.contribution.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(
      `Contribution soft-deleted id=${id}`,
      ContributionsService.name,
    );

    return { message: 'Contribution deleted successfully' };
  }
}
