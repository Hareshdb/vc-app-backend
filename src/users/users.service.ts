import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { GENDER, User, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AppLoggerService } from '../common/app-logger.service';
import { R2StorageService } from '../common/storage/r2-storage.service';

const DEFAULT_COUNTRY_CODE = '+91';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly storageService: R2StorageService,
  ) {}

  private normalizeCountryCode(countryCode?: string): string {
    const clean = (countryCode ?? DEFAULT_COUNTRY_CODE).trim();
    return clean.startsWith('+') ? clean : `+${clean}`;
  }

  async createUser(dto: CreateUserDto) {
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
        gender: dto.gender ?? GENDER.OTHER,
        address: dto.address?.trim() ?? 'Not provided',
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        status: UserStatus.ACTIVE,
      },
    });

    this.logger.log(`User created id=${user.id}`, UsersService.name);
    return user;
  }

  async getProfile(user: User) {
    const profile = await this.prisma.user.findFirst({
      where: { id: user.id, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        countryCode: true,
        mobileNumber: true,
        status: true,
        gender: true,
        birthDate: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        profilePicture: true,
        isMobileVerified: true,
        lastLoggedInAt: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          where: { deletedAt: null },
          select: {
            id: true,
            role: true,
            joinedAt: true,
            mandal: {
              select: {
                id: true,
                code: true,
                mandalName: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    return { user: profile };
  }

  async updateProfile(user: User, dto: UpdateProfileDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id: user.id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    let profilePictureKey = dto.profilePicture;
    if (profilePictureKey !== undefined) {
      const cleanPic = profilePictureKey.trim();
      const r2MediaUrl = process.env.R2_MEDIA_URL || process.env.R2_PUBLIC_URL;
      if (r2MediaUrl && cleanPic.startsWith(r2MediaUrl)) {
        profilePictureKey = cleanPic.replace(r2MediaUrl, '').replace(/^\//, '');
      } else {
        profilePictureKey = cleanPic;
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
        ...(dto.email !== undefined && { email: dto.email.trim().toLowerCase() }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.birthDate !== undefined && { birthDate: new Date(dto.birthDate) }),
        ...(dto.address !== undefined && { address: dto.address.trim() }),
        ...(dto.city !== undefined && { city: dto.city.trim() }),
        ...(dto.state !== undefined && { state: dto.state.trim() }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode.trim() }),
        ...(profilePictureKey !== undefined && { profilePicture: profilePictureKey }),
        ...(dto.mobileNumber !== undefined && { mobileNumber: dto.mobileNumber.trim() }),
        ...(dto.countryCode !== undefined && { countryCode: dto.countryCode.trim() }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        countryCode: true,
        mobileNumber: true,
        status: true,
        gender: true,
        birthDate: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        profilePicture: true,
        isMobileVerified: true,
      },
    });

    this.logger.log(`User profile updated id=${user.id}`, UsersService.name);
    return { user: updated };
  }

  async uploadProfilePicture(
    user: User,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const uploadResult = await this.storageService.uploadFile(file, 'profile-pictures');

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { profilePicture: uploadResult.key },
      select: {
        id: true,
        fullName: true,
        email: true,
        countryCode: true,
        mobileNumber: true,
        status: true,
        gender: true,
        birthDate: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        profilePicture: true,
        isMobileVerified: true,
      },
    });

    this.logger.log(`Profile picture updated for user id=${user.id}, key=${uploadResult.key}`, UsersService.name);

    return {
      message: 'Profile picture updated successfully',
      user: updatedUser,
      profilePicture: uploadResult.key,
      url: uploadResult.url,
    };
  }
}
