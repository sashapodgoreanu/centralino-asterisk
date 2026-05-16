import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProvisioningService } from '../telephony/provisioning/provisioning.service';
import { TelephonyEventBus } from '../telephony/telephony-event-bus.service';
import { CreateAgentDto } from './dto/create-agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provisioning: ProvisioningService,
    private readonly eventBus: TelephonyEventBus,
  ) {}

  list() {
    return this.prisma.agent.findMany({
      orderBy: { extension: 'asc' },
      select: {
        id: true,
        extension: true,
        displayName: true,
        status: true,
        tenant: { select: { slug: true, name: true } },
        createdAt: true,
      },
    });
  }

  async create(dto: CreateAgentDto) {
    const agent = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.upsert({
        where: { slug: dto.tenantSlug ?? 'default' },
        update: {},
        create: {
          slug: dto.tenantSlug ?? 'default',
          name: dto.tenantSlug ?? 'Default Tenant',
        },
      });

      await this.provisioning.provisionWebRtcEndpoint(tx, {
        extension: dto.extension,
        password: dto.password,
      });

      return tx.agent.upsert({
        where: {
          tenantId_extension: {
            tenantId: tenant.id,
            extension: dto.extension,
          },
        },
        update: {
          displayName: dto.displayName,
          sipPassword: dto.password,
          status: 'offline',
        },
        create: {
          tenantId: tenant.id,
          extension: dto.extension,
          displayName: dto.displayName,
          sipPassword: dto.password,
          status: 'offline',
        },
        select: {
          id: true,
          extension: true,
          displayName: true,
          status: true,
          tenant: { select: { slug: true } },
        },
      });
    });

    this.eventBus.publish('agent.provisioned', 'backend', {
      extension: agent.extension,
      displayName: agent.displayName,
      tenant: agent.tenant.slug,
    });

    return agent;
  }
}
