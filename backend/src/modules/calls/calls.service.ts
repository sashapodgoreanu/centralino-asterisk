import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AriService } from '../telephony/ari/ari.service';
import { TelephonyEventBus } from '../telephony/telephony-event-bus.service';
import { CreateCallDto } from './dto/create-call.dto';

@Injectable()
export class CallsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ari: AriService,
    private readonly eventBus: TelephonyEventBus,
  ) {}

  list() {
    return this.prisma.callSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  async create(dto: CreateCallDto) {
    const call = await this.prisma.callSession.create({
      data: {
        caller: dto.from,
        callee: dto.to,
        direction: 'internal',
        state: 'originating',
      },
    });

    await this.ari.originate(`PJSIP/${dto.from}`, dto.to, dto.callerId ?? dto.from);

    this.eventBus.publish('channel.started', 'backend', {
      callId: call.id,
      caller: dto.from,
      callee: dto.to,
      state: 'originating',
    });

    return call;
  }
}
