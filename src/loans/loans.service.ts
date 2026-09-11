import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LoanStatus, NotificationType, User } from '@prisma/client';
import { AppLoggerService } from '../common/app-logger.service';
import {
  buildPaginationMeta,
  resolvePaginationParams,
} from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanStatusDto } from './dto/update-loan-status.dto';

@Injectable()
export class LoansService {
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

  async create(mandalId: number, dto: CreateLoanDto, currentUser: User) {
    await this.validateMandal(mandalId);

    let memberId = dto.memberId;
    if (!memberId) {
      const member = await this.prisma.mandalMember.findFirst({
        where: { mandalId, userId: currentUser.id, deletedAt: null },
      });
      if (!member) {
        throw new BadRequestException('Current user is not a member of this mandal');
      }
      memberId = member.id;
    }

    const member = await this.prisma.mandalMember.findFirst({
      where: { id: memberId, mandalId, deletedAt: null },
      include: { user: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found in this mandal');
    }

    const loanNumber = `LN-${mandalId}-${Date.now().toString().slice(-6)}`;

    const loan = await this.prisma.loan.create({
      data: {
        loanNumber,
        mandalId,
        memberId: member.id,
        requestedAmount: dto.requestedAmount,
        loanPurpose: dto.loanPurpose,
        description: dto.description,
        status: LoanStatus.PENDING,
        requestedAt: new Date(),
      },
    });

    await this.prisma.loanApproval.create({
      data: {
        loanId: loan.id,
        action: 'SUBMITTED',
        newStatus: LoanStatus.PENDING,
        remarks: 'Loan application submitted',
        actionBy: currentUser.id,
      },
    });

    // Notify all members of the mandal about the new loan request
    const allMembers = await this.prisma.mandalMember.findMany({
      where: {
        mandalId,
        deletedAt: null,
        user: { status: 'ACTIVE', deletedAt: null },
      },
      select: { userId: true },
    });

    const targetUserIds = Array.from(
      new Set(allMembers.map((m) => m.userId)),
    );

    const formattedAmount = `₹${Number(dto.requestedAmount).toLocaleString('en-IN')}`;
    for (const userId of targetUserIds) {
      await this.prisma.notification.create({
        data: {
          userId,
          mandalId,
          title: 'New Loan Request',
          message: `${member.user.fullName} applied for a loan of ${formattedAmount}.`,
          type: NotificationType.ALERT,
          module: 'LOAN',
        },
      });
    }

    this.logger.log(
      `Loan created id=${loan.id} mandalId=${mandalId} memberId=${member.id}`,
      LoansService.name,
    );

    return {
      message: 'Loan application created successfully',
      loan: this.formatLoan(loan, member.user),
    };
  }

  async findAll(
    mandalId: number,
    query: { status?: LoanStatus; page?: number; limit?: number },
  ) {
    await this.validateMandal(mandalId);

    const { page, limit, skip, take } = resolvePaginationParams(
      query.page,
      query.limit,
    );

    const where: any = { mandalId };
    if (query.status) {
      where.status = query.status;
    }

    const [loans, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        include: {
          member: {
            include: { user: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.loan.count({ where }),
    ]);

    return {
      loans: loans.map((loan) => this.formatLoan(loan, loan.member.user)),
      ...buildPaginationMeta(total, page, limit),
    };
  }

  async findOne(mandalId: number, id: string | number) {
    await this.validateMandal(mandalId);

    const loanId = BigInt(id);
    const loan = await this.prisma.loan.findFirst({
      where: { id: loanId, mandalId },
      include: {
        member: {
          include: { user: true },
        },
        approvals: {
          include: {
            actionUser: {
              select: { id: true, fullName: true, email: true },
            },
          },
          orderBy: { actionAt: 'desc' },
        },
      },
    });

    if (!loan) throw new NotFoundException('Loan not found');

    return {
      loan: this.formatLoan(loan, loan.member.user),
      approvals: loan.approvals.map((a) => ({
        id: String(a.id),
        loanId: String(a.loanId),
        action: a.action,
        previousStatus: a.previousStatus,
        newStatus: a.newStatus,
        approvedAmount: a.approvedAmount ? Number(a.approvedAmount) : null,
        reason: a.reason,
        remarks: a.remarks,
        actionBy: a.actionBy,
        actionByName: a.actionUser.fullName,
        actionAt: a.actionAt,
        createdAt: a.createdAt,
      })),
    };
  }

  async updateStatus(
    mandalId: number,
    id: string | number,
    dto: UpdateLoanStatusDto,
    currentUser: User,
  ) {
    await this.validateMandal(mandalId);

    const loanId = BigInt(id);
    const loan = await this.prisma.loan.findFirst({
      where: { id: loanId, mandalId },
      include: {
        member: {
          include: { user: true },
        },
      },
    });

    if (!loan) throw new NotFoundException('Loan not found');

    const previousStatus = loan.status;
    const now = new Date();

    const updateData: any = {
      status: dto.status,
    };

    if (dto.status === LoanStatus.UNDER_REVIEW) {
      updateData.reviewedAt = now;
    } else if (dto.status === LoanStatus.APPROVED) {
      updateData.approvedAt = now;
      updateData.approvedAmount = dto.approvedAmount ?? loan.requestedAmount;
      updateData.principalAmount = updateData.approvedAmount;
      updateData.outstandingAmount = updateData.approvedAmount;
    } else if (dto.status === LoanStatus.REJECTED) {
      updateData.rejectedAt = now;
      updateData.rejectionReason = dto.reason ?? null;
    } else if (dto.status === LoanStatus.DISBURSED) {
      updateData.disbursedAt = now;
      updateData.disbursedAmount =
        dto.approvedAmount ?? loan.approvedAmount ?? loan.requestedAmount;
      if (!loan.principalAmount || Number(loan.principalAmount) === 0) {
        updateData.principalAmount = updateData.disbursedAmount;
        updateData.outstandingAmount = updateData.disbursedAmount;
      }
    }

    const updatedLoan = await this.prisma.loan.update({
      where: { id: loanId },
      data: updateData,
    });

    await this.prisma.loanApproval.create({
      data: {
        loanId,
        action: dto.status,
        previousStatus,
        newStatus: dto.status,
        approvedAmount: dto.approvedAmount
          ? dto.approvedAmount
          : updatedLoan.approvedAmount,
        reason: dto.reason,
        remarks: dto.remarks,
        actionBy: currentUser.id,
        actionAt: now,
      },
    });

    // Create Notification in database for borrower member
    const applicantUserId = loan.member.userId;
    let notifTitle = 'Loan Status Updated';
    let notifMsg = `Your loan request status has been updated to ${dto.status.replace('_', ' ')}.`;

    if (dto.status === LoanStatus.REJECTED) {
      notifTitle = 'Loan Request Rejected';
      notifMsg = `Your loan request for ₹${Number(loan.requestedAmount).toLocaleString('en-IN')} was REJECTED.${dto.reason ? ` Reason: ${dto.reason}` : ''}`;
    } else if (dto.status === LoanStatus.APPROVED) {
      notifTitle = 'Loan Request Approved';
      const approvedAmt = updatedLoan.approvedAmount
        ? Number(updatedLoan.approvedAmount).toLocaleString('en-IN')
        : Number(loan.requestedAmount).toLocaleString('en-IN');
      notifMsg = `Your loan request for ₹${approvedAmt} has been APPROVED!`;
    } else if (dto.status === LoanStatus.DISBURSED) {
      notifTitle = 'Loan Amount Disbursed';
      const disbAmt = updatedLoan.disbursedAmount
        ? Number(updatedLoan.disbursedAmount).toLocaleString('en-IN')
        : Number(loan.requestedAmount).toLocaleString('en-IN');
      notifMsg = `₹${disbAmt} has been disbursed for your loan request.`;
    }

    await this.prisma.notification.create({
      data: {
        userId: applicantUserId,
        mandalId,
        title: notifTitle,
        message: notifMsg,
        type:
          dto.status === LoanStatus.REJECTED
            ? NotificationType.ALERT
            : NotificationType.INFO,
        module: 'LOAN',
      },
    });

    this.logger.log(
      `Loan status updated id=${loanId} from=${previousStatus} to=${dto.status}`,
      LoansService.name,
    );

    return {
      message: `Loan status updated to ${dto.status}`,
      loan: this.formatLoan(updatedLoan, loan.member.user),
    };
  }

  async calculateMemberLoanInterest(mandalId: number, memberId: number) {
    const mandal = await this.validateMandal(mandalId);
    const member = await this.prisma.mandalMember.findFirst({
      where: { id: memberId, mandalId, deletedAt: null },
    });
    if (!member) throw new NotFoundException('Member not found in this mandal');

    const activeLoans = await this.prisma.loan.findMany({
      where: {
        mandalId,
        memberId,
        status: LoanStatus.DISBURSED,
        outstandingAmount: { gt: 0 },
      },
    });

    const interestPercent = Number(mandal.mandalInterestPercent ?? 2);
    let totalOutstanding = 0;
    let calculatedInterest = 0;

    for (const loan of activeLoans) {
      const outstanding = Number(loan.outstandingAmount);
      totalOutstanding += outstanding;
      calculatedInterest += (outstanding * interestPercent) / 100;
    }

    return {
      hasActiveLoans: activeLoans.length > 0,
      loansCount: activeLoans.length,
      totalOutstanding,
      interestPercent,
      calculatedInterest: Math.round(calculatedInterest * 100) / 100,
    };
  }

  private formatLoan(loan: any, user: any) {
    return {
      id: String(loan.id),
      loanNumber: loan.loanNumber ?? `LN-${loan.mandalId}-${loan.id}`,
      mandalId: loan.mandalId,
      memberId: loan.memberId,
      memberName: user ? user.fullName : 'Unknown Member',
      memberAvatar: user ? user.profilePicture : null,
      memberMobile: user
        ? `${user.countryCode || '+91'} ${user.mobileNumber}`
        : '',
      requestedAmount: Number(loan.requestedAmount),
      approvedAmount: loan.approvedAmount ? Number(loan.approvedAmount) : null,
      disbursedAmount: loan.disbursedAmount
        ? Number(loan.disbursedAmount)
        : null,
      principalAmount: Number(loan.principalAmount ?? loan.approvedAmount ?? loan.disbursedAmount ?? 0),
      outstandingAmount: Number(loan.outstandingAmount ?? loan.approvedAmount ?? loan.disbursedAmount ?? 0),
      loanPurpose: loan.loanPurpose,
      description: loan.description,
      status: loan.status,
      rejectionReason: loan.rejectionReason,
      requestedAt: loan.requestedAt,
      reviewedAt: loan.reviewedAt,
      approvedAt: loan.approvedAt,
      rejectedAt: loan.rejectedAt,
      disbursedAt: loan.disbursedAt,
      closedAt: loan.closedAt,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
    };
  }
}
