import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { AdminUsersService } from './admin-users.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';

@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(AdminJwtGuard)
@Controller('admin/api/v1/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users with pagination and filters' })
  listUsers(@Query() query: ListAdminUsersQueryDto) {
    return this.adminUsersService.listUsers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.adminUsersService.getUserById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  createUser(@Body() dto: AdminCreateUserDto) {
    return this.adminUsersService.createUser(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.adminUsersService.updateUser(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete user by ID' })
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminUsersService.deleteUser(id);
  }
}
