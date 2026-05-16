import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AddQueueMemberDto } from './dto/add-queue-member.dto';
import { CreateQueueDto } from './dto/create-queue.dto';

@Injectable()
export class QueuesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.queue.findMany({
      orderBy: { name: 'asc' },
      include: { members: true, tenant: { select: { slug: true } } },
    });
  }

  async create(dto: CreateQueueDto) {
    const tenant = await this.prisma.tenant.upsert({
      where: { slug: dto.tenantSlug ?? 'default' },
      update: {},
      create: {
        slug: dto.tenantSlug ?? 'default',
        name: dto.tenantSlug ?? 'Default Tenant',
      },
    });

    return this.prisma.queue.upsert({
      where: { name: dto.name },
      update: {
        tenantId: tenant.id,
        strategy: dto.strategy ?? 'ringall',
        timeout: 20,
        ringinuse: 'no',
      },
      create: {
        name: dto.name,
        tenantId: tenant.id,
        strategy: dto.strategy ?? 'ringall',
        timeout: 20,
        ringinuse: 'no',
      },
    });
  }

  addMember(queueName: string, dto: AddQueueMemberDto) {
    return this.prisma.queueMember.upsert({
      where: {
        queueName_interface: {
          queueName,
          interface: `PJSIP/${dto.extension}`,
        },
      },
      update: {
        penalty: dto.penalty ?? 0,
        paused: 0,
      },
      create: {
        queueName,
        interface: `PJSIP/${dto.extension}`,
        membername: dto.extension,
        stateInterface: `PJSIP/${dto.extension}`,
        penalty: dto.penalty ?? 0,
        paused: 0,
        ringinuse: 'no',
      },
    });
  }
}
