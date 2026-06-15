import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateMandalDto } from './dto/create-mandal.dto';
import { MandalService } from './mandal.service';

@ApiTags('mandal')
@Controller('mandal')
export class MandalController {
  constructor(private readonly mandalService: MandalService) {}

  @Post()
  @ApiOperation({
    summary:
      'Create mandal by creating admin first and then mandal-member mapping',
  })
  createMandal(@Body() dto: CreateMandalDto) {
    return this.mandalService.createMandal(dto);
  }
}
