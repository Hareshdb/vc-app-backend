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
import { CreateMandalDto } from '../../mandal/dto/create-mandal.dto';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { AdminMandalsService } from './admin-mandals.service';
import { AdminUpdateMandalDto } from './dto/admin-update-mandal.dto';
import { ListAdminMandalsQueryDto } from './dto/list-admin-mandals-query.dto';
import { ListMandalMembersQueryDto } from '../../mandal/dto/list-mandal-members-query.dto';

@ApiTags('admin-mandals')
@ApiBearerAuth()
@UseGuards(AdminJwtGuard)
@Controller('admin/api/v1/mandals')
export class AdminMandalsController {
  constructor(private readonly adminMandalsService: AdminMandalsService) {}

  @Get()
  @ApiOperation({ summary: 'List mandals with pagination' })
  listMandals(@Query() query: ListAdminMandalsQueryDto) {
    return this.adminMandalsService.listMandals(query);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List mandal plans' })
  listPlans() {
    return this.adminMandalsService.listPlans();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mandal by id' })
  getMandalById(@Param('id', ParseIntPipe) id: number) {
    return this.adminMandalsService.getMandalById(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List members of a mandal' })
  getMandalMembers(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListMandalMembersQueryDto,
  ) {
    return this.adminMandalsService.getMandalMembers(id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create mandal' })
  createMandal(@Body() dto: CreateMandalDto) {
    return this.adminMandalsService.createMandal(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update mandal' })
  updateMandal(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateMandalDto,
  ) {
    return this.adminMandalsService.updateMandal(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete mandal' })
  deleteMandal(@Param('id', ParseIntPipe) id: number) {
    return this.adminMandalsService.deleteMandal(id);
  }
}
