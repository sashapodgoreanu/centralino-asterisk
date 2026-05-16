import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ariClient from 'ari-client';
import { TelephonyEventBus } from '../telephony-event-bus.service';

@Injectable()
export class AriService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AriService.name);
  private client?: any;

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
      this.client.on('StasisStart', (event: any, channel: any) => {
        this.eventBus.publish('channel.started', 'ari', {
          channelId: channel?.id,
          caller: channel?.caller?.number,
          dialplan: channel?.dialplan,
          rawType: event?.type,
        });
      });
      this.client.on('StasisEnd', (event: any, channel: any) => {
        this.eventBus.publish('channel.ended', 'ari', {
          channelId: channel?.id,
          rawType: event?.type,
        });
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
}
