import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminUser } from '@prisma/client';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminAuthService } from './admin-auth.service';
import { AdminChangePasswordDto } from './dto/admin-change-password.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminUpdateProfileDto } from './dto/admin-update-profile.dto';
import { AdminJwtGuard } from './guards/admin-jwt.guard';

@ApiTags('admin-auth')
@Controller('admin/api/v1/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login with email and password' })
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }

  @Get('profile')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current admin profile' })
  getProfile(@CurrentAdmin() admin: AdminUser) {
    return this.adminAuthService.getProfile(admin);
  }

  @Patch('profile')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current admin profile' })
  updateProfile(
    @CurrentAdmin() admin: AdminUser,
    @Body() dto: AdminUpdateProfileDto,
  ) {
    return this.adminAuthService.updateProfile(admin, dto);
  }

  @Post('change-password')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current admin password' })
  changePassword(
    @CurrentAdmin() admin: AdminUser,
    @Body() dto: AdminChangePasswordDto,
  ) {
    return this.adminAuthService.changePassword(admin, dto);
  }
}
