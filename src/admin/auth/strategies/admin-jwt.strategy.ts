import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

export type AdminJwtPayload = {
  sub: number;
  type: 'admin-access';
};

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: AdminJwtPayload) {
    if (payload.type !== 'admin-access') {
      throw new UnauthorizedException('Invalid admin access token');
    }

    const admin = await this.prisma.adminUser.findFirst({
      where: { id: payload.sub, deletedAt: null, status: 'ACTIVE' },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin user not found');
    }

    return admin;
  }
}
