import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AddQueueMemberDto } from './dto/add-queue-member.dto';
import { CreateQueueDto } from './dto/create-queue.dto';
import { QueuesService } from './queues.service';

@Controller('queues')
export class QueuesController {
  constructor(private readonly queues: QueuesService) {}

  @Get()
  list() {
    return this.queues.list();
  }

  @Post()
  create(@Body() dto: CreateQueueDto) {
    return this.queues.create(dto);
  }

  @Post(':name/members')
  addMember(@Param('name') name: string, @Body() dto: AddQueueMemberDto) {
    return this.queues.addMember(name, dto);
  }
}
