import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMandalDto } from './dto/create-mandal.dto';
import { MandalService } from './mandal.service';
import { AddMemberToMandalDto } from './dto/add-member-to-mandal.dto';

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
  listMandalMembers(@Param('mandalId', ParseIntPipe) mandalId: number) {
    return this.mandalService.listMandalMembers(mandalId);
  }
}
