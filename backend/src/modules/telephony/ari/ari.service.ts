import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ariClient = require('ari-client');
import { TelephonyEventBus } from '../telephony-event-bus.service';

@Injectable()
export class AriService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AriService.name);
  private client?: any;
  private readonly activeBridges = new Map<string, string>();

  constructor(
    private readonly config: ConfigService,
    private readonly eventBus: TelephonyEventBus,
  ) {}

  async onApplicationBootstrap() {
    const url = this.config.get<string>('ARI_URL', 'http://localhost:8088');
    const username = this.config.get<string>('ARI_USERNAME', 'app');
    const password = this.config.get<string>('ARI_PASSWORD', 'appsecret');
    const app = this.config.get<string>('ARI_APP', 'telephony-app');

    try {
      this.client = await ariClient.connect(url, username, password);
      this.client.on('StasisStart', async (event: any, channel: any) => {
        this.eventBus.publish('channel.started', 'ari', {
          channelId: channel?.id,
          caller: channel?.caller?.number,
          dialplan: channel?.dialplan,
          rawType: event?.type,
        });

        await this.handleStasisStart(event, channel, app);
      });
      this.client.on('StasisEnd', async (event: any, channel: any) => {
        this.eventBus.publish('channel.ended', 'ari', {
          channelId: channel?.id,
          rawType: event?.type,
        });

        await this.handleStasisEnd(channel);
      });
      this.client.on('ChannelStateChange', (event: any, channel: any) => {
        this.eventBus.publish('channel.state.changed', 'ari', {
          channelId: channel?.id,
          state: channel?.state,
          rawType: event?.type,
        });
      });
      this.client.start(app);
      this.logger.log(`ARI connected to ${url} for Stasis app ${app}`);
    } catch (error) {
      this.logger.warn(`ARI connection failed: ${(error as Error).message}`);
    }
  }

  async originate(endpoint: string, extension: string, callerId?: string) {
    if (!this.client) {
      throw new Error('ARI client is not connected');
    }

    return this.client.channels.originate({
      endpoint,
      extension,
      context: 'internal',
      priority: 1,
      callerId,
    });
  }

  private async handleStasisStart(event: any, channel: any, app: string) {
    const args: string[] = event?.args ?? [];

    try {
      if (args[0] === 'dialed' && args[1]) {
        await channel.answer();
        await this.client.bridges.addChannel({
          bridgeId: args[1],
          channel: channel.id,
        });
        this.activeBridges.set(channel.id, args[1]);
        return;
      }

      const destination = channel?.dialplan?.exten;
      if (!destination || !/^[0-9]{3,10}$/.test(destination)) {
        this.logger.warn(`No routable destination for channel ${channel?.id}`);
        await channel.hangup();
        return;
      }

      const bridge = this.client.Bridge();
      await bridge.create({ type: 'mixing' });
      await channel.answer();
      await bridge.addChannel({ channel: channel.id });
      this.activeBridges.set(channel.id, bridge.id);

      const outbound = this.client.Channel();
      await outbound.originate({
        endpoint: `PJSIP/${destination}`,
        app,
        appArgs: `dialed,${bridge.id}`,
        callerId: channel?.caller?.number ?? 'anonymous',
        timeout: 30,
      });

      this.logger.log(`Bridging ${channel?.caller?.number ?? channel.id} to PJSIP/${destination}`);
    } catch (error) {
      this.logger.warn(`ARI routing failed for ${channel?.id}: ${(error as Error).message}`);
      await channel.hangup().catch(() => undefined);
    }
  }

  private async handleStasisEnd(channel: any) {
    const bridgeId = this.activeBridges.get(channel?.id);
    if (!bridgeId) {
      return;
    }

    this.activeBridges.delete(channel.id);
    try {
      const bridge = this.client.Bridge(bridgeId);
      const bridgeData = await bridge.get();
      const remainingChannelIds = (bridgeData?.channels ?? []).filter((channelId: string) => channelId !== channel.id);

      await Promise.all(
        remainingChannelIds.map(async (channelId: string) => {
          this.activeBridges.delete(channelId);
          await this.client.Channel(channelId).hangup().catch(() => undefined);
        }),
      );

      await bridge.destroy().catch(() => undefined);
    } catch {
      this.activeBridges.delete(channel.id);
    }
  }
}
