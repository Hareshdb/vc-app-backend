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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMandalDto } from './dto/create-mandal.dto';
import { MandalService } from './mandal.service';
import { AddMemberToMandalDto } from './dto/add-member-to-mandal.dto';
import { ListMandalMembersQueryDto } from './dto/list-mandal-members-query.dto';
import { UpdateMandalProfileDto } from './dto/update-mandal-profile.dto';
import { SaveDrawWinnerDto } from './dto/save-draw-winner.dto';

@ApiTags('mandals')
@Controller('mandals')
export class MandalController {
  constructor(private readonly mandalService: MandalService) {}

  @Post()
  @ApiOperation({
    summary: 'Create mandal and map admin user as first member',
  })
  createMandal(@Body() dto: CreateMandalDto) {
    return this.mandalService.createMandal(dto);
  }

  @Post(':mandalId/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a member to mandal' })
  addMemberToMandal(
    @Param('mandalId', ParseIntPipe) mandalId: number,
    @Body() dto: AddMemberToMandalDto,
  ) {
    return this.mandalService.addMemberToMandal(mandalId, dto);
  }

  @Get(':mandalId/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List members of a mandal' })
  listMandalMembers(
    @Param('mandalId', ParseIntPipe) mandalId: number,
    @Query() query: ListMandalMembersQueryDto,
  ) {
    return this.mandalService.listMandalMembers(mandalId, query);
  }

  @Delete(':mandalId/members/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a member from mandal (soft delete)' })
  removeMemberFromMandal(
    @Param('mandalId', ParseIntPipe) mandalId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.mandalService.removeMemberFromMandal(mandalId, memberId);
  }

  @Patch(':mandalId/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update mandal profile (name, address, city, state, pincode)' })
  updateMandalProfile(
    @Param('mandalId', ParseIntPipe) mandalId: number,
    @Body() dto: UpdateMandalProfileDto,
  ) {
    return this.mandalService.updateMandalProfile(mandalId, dto);
  }

  @Get(':mandalId/dashboard-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard financial stats and member metrics for mandal' })
  getDashboardStats(@Param('mandalId', ParseIntPipe) mandalId: number) {
    return this.mandalService.getDashboardStats(mandalId);
  }

  @Get(':mandalId/draw-eligible-members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of members eligible for draw (excluding previous winners)' })
  getDrawEligibleMembers(@Param('mandalId', ParseIntPipe) mandalId: number) {
    return this.mandalService.getDrawEligibleMembers(mandalId);
  }

  @Get(':mandalId/draw-winners')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of previous draw winners' })
  getDrawWinners(@Param('mandalId', ParseIntPipe) mandalId: number) {
    return this.mandalService.getDrawWinners(mandalId);
  }

  @Post(':mandalId/draw-winners')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save draw winner' })
  saveDrawWinner(
    @Param('mandalId', ParseIntPipe) mandalId: number,
    @Body() dto: SaveDrawWinnerDto,
  ) {
    return this.mandalService.saveDrawWinner(mandalId, dto);
  }
}

