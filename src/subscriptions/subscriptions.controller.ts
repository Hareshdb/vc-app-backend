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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new mandal subscription' })
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all subscriptions (optionally filter by mandal)' })
  @ApiQuery({ name: 'mandalId', required: false, type: Number })
  findAll(@Query('mandalId', new ParseIntPipe({ optional: true })) mandalId?: number) {
    return this.subscriptionsService.findAll(mandalId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscription' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a subscription' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.remove(id);
  }
}
