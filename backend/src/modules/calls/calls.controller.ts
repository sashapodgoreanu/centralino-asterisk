import { Body, Controller, Get, Post } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';

@Controller('calls')
export class CallsController {
  constructor(private readonly calls: CallsService) {}

  @Get()
  list() {
    return this.calls.list();
  }

  @Post()
  create(@Body() dto: CreateCallDto) {
    return this.calls.create(dto);
  }
}
