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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContributionsService } from './contributions.service';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';

@ApiTags('contributions')
@Controller('mandals/:mandalId/contributions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContributionsController {
  constructor(private readonly contributionsService: ContributionsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a contribution for a mandal member' })
  create(
    @Param('mandalId', ParseIntPipe) mandalId: number,
    @CurrentUser() user: any,
    @Body() dto: CreateContributionDto,
  ) {
    const createdBy = dto.createdBy || user?.id;
    return this.contributionsService.create(mandalId, {
      ...dto,
      createdBy,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List contributions for a mandal' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'memberId', required: false, type: Number })
  findAll(
    @Param('mandalId', ParseIntPipe) mandalId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('memberId', new ParseIntPipe({ optional: true })) memberId?: number,
  ) {
    return this.contributionsService.findAll(mandalId, { page, limit, memberId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contribution by ID' })
  findOne(
    @Param('mandalId', ParseIntPipe) mandalId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.contributionsService.findOne(mandalId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contribution' })
  update(
    @Param('mandalId', ParseIntPipe) mandalId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContributionDto,
  ) {
    return this.contributionsService.update(mandalId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a contribution' })
  remove(
    @Param('mandalId', ParseIntPipe) mandalId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.contributionsService.remove(mandalId, id);
  }
}
