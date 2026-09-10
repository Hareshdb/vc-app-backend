import {
  Body,
  Controller,
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
import { LoanStatus, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanStatusDto } from './dto/update-loan-status.dto';
import { LoansService } from './loans.service';

@ApiTags('loans')
@Controller('mandals/:mandalId/loans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new loan application' })
  create(
    @Param('mandalId', ParseIntPipe) mandalId: number,
    @Body() dto: CreateLoanDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.loansService.create(mandalId, dto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'List loans for a mandal with optional status filter' })
  @ApiQuery({ name: 'status', enum: LoanStatus, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  findAll(
    @Param('mandalId', ParseIntPipe) mandalId: number,
    @Query('status') status?: LoanStatus,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.loansService.findAll(mandalId, { status, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific loan' })
  findOne(
    @Param('mandalId', ParseIntPipe) mandalId: number,
    @Param('id') id: string,
  ) {
    return this.loansService.findOne(mandalId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update status of a loan (Mandal Admin)' })
  updateStatus(
    @Param('mandalId', ParseIntPipe) mandalId: number,
    @Param('id') id: string,
    @Body() dto: UpdateLoanStatusDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.loansService.updateStatus(mandalId, id, dto, currentUser);
  }

  @Get('members/:memberId/interest')
  @ApiOperation({ summary: 'Calculate interest for member active loans' })
  calculateMemberLoanInterest(
    @Param('mandalId', ParseIntPipe) mandalId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.loansService.calculateMemberLoanInterest(mandalId, memberId);
  }
}
