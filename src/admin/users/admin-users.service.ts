import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole, Prisma, UserStatus } from '@prisma/client';
import { AppLoggerService } from '../../common/app-logger.service';
import {
  buildPaginationMeta,
  resolvePaginationParams,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';

const DEFAULT_COUNTRY_CODE = '+91';

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  countryCode: true,
  mobileNumber: true,
  status: true,
  gender: true,
  birthDate: true,
  address: true,
  isMobileVerified: true,
  lastLoggedInAt: true,
  createdAt: true,
  updatedAt: true,
  memberships: {
    where: { deletedAt: null },
    select: { role: true },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  private normalizeCountryCode(countryCode?: string): string {
    const clean = (countryCode ?? DEFAULT_COUNTRY_CODE).trim();
    return clean.startsWith('+') ? clean : `+${clean}`;
  }

  private formatUser(user: any) {
    if (!user) return user;
    const { memberships, ...rest } = user;
    const userType = memberships?.[0]?.role ?? 'MEMBER';
    return {
      ...rest,
      userType,
    };
  }

  async listUsers(query: ListAdminUsersQueryDto) {
    const { page, limit, skip, take } = resolvePaginationParams(
      query.page,
      query.limit,
    );

    const keyword = query.keyword?.trim();
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(keyword
        ? {
            OR: [
              { fullName: { contains: keyword, mode: 'insensitive' } },
              { email: { contains: keyword, mode: 'insensitive' } },
              { mobileNumber: { contains: keyword, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => this.formatUser(u)),
      ...buildPaginationMeta(total, page, limit),
    };
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { user: this.formatUser(user) };
  }

  async createUser(dto: AdminCreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const countryCode = this.normalizeCountryCode(dto.countryCode);
    const mobileNumber = dto.mobileNumber.trim();

    const existingUser = await this.prisma.user.findFirst({
      where: { countryCode, mobileNumber, deletedAt: null },
    });

    if (existingUser) {
      throw new ConflictException('User already exists with same mobile number');
    }

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email,
        countryCode,
        mobileNumber,
        gender: dto.gender ?? 'OTHER',
        address: dto.address?.trim() ?? 'Not provided',
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        status: dto.status ?? UserStatus.ACTIVE,
      },
      select: userSelect,
    });

    this.logger.log(
      `Admin created user id=${user.id}`,
      AdminUsersService.name,
    );

    return { user: this.formatUser(user) };
  }

  async updateUser(id: number, dto: AdminUpdateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const countryCode = dto.countryCode
      ? this.normalizeCountryCode(dto.countryCode)
      : undefined;
    const mobileNumber = dto.mobileNumber?.trim();

    if (countryCode || mobileNumber) {
      const nextCountryCode = countryCode ?? existing.countryCode;
      const nextMobileNumber = mobileNumber ?? existing.mobileNumber;

      const duplicate = await this.prisma.user.findFirst({
        where: {
          id: { not: id },
          countryCode: nextCountryCode,
          mobileNumber: nextMobileNumber,
          deletedAt: null,
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Another user already exists with same mobile number',
        );
      }
    }

    if (dto.userType) {
      const role = dto.userType as MemberRole;
      if (Object.values(MemberRole).includes(role)) {
        await this.prisma.mandalMember.updateMany({
          where: { userId: id, deletedAt: null },
          data: { role },
        });
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined
          ? { fullName: dto.fullName.trim() }
          : {}),
        ...(dto.email !== undefined
          ? { email: dto.email.trim().toLowerCase() }
          : {}),
        ...(countryCode !== undefined ? { countryCode } : {}),
        ...(mobileNumber !== undefined ? { mobileNumber } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.address !== undefined
          ? { address: dto.address.trim() }
          : {}),
        ...(dto.birthDate !== undefined
          ? { birthDate: dto.birthDate ? new Date(dto.birthDate) : null }
          : {}),
        ...(dto.isMobileVerified !== undefined
          ? { isMobileVerified: dto.isMobileVerified }
          : {}),
      },
      select: userSelect,
    });

    const updatedUser = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userSelect,
    });

    this.logger.log(`Admin updated user id=${id}`, AdminUsersService.name);

    return { user: this.formatUser(updatedUser ?? user) };
  }

  async deleteUser(id: number) {
    const existing = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Admin soft-deleted user id=${id}`, AdminUsersService.name);

    return { message: 'User deleted successfully' };
  }
}
