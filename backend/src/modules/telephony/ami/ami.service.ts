import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AmiClient = require('asterisk-ami-client');
import { TelephonyEventBus } from '../telephony-event-bus.service';

@Injectable()
export class AmiService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AmiService.name);
  private client?: any;

  constructor(
    private readonly config: ConfigService,
    private readonly eventBus: TelephonyEventBus,
  ) {}

  async onApplicationBootstrap() {
    this.client = new AmiClient({ reconnect: true, keepAlive: true });

    this.client.on('event', (event: Record<string, unknown>) => {
      this.eventBus.publish('ami.raw', 'ami', {
        event: event.Event,
        channel: event.Channel,
        uniqueid: event.Uniqueid,
      });
    });

    try {
      await this.client.connect(
        this.config.get<string>('AMI_USERNAME', 'admin'),
        this.config.get<string>('AMI_PASSWORD', 'adminsecret'),
        {
          host: this.config.get<string>('AMI_HOST', 'localhost'),
          port: this.config.get<number>('AMI_PORT', 5038),
        },
      );
      this.logger.log('AMI connected');
    } catch (error) {
      this.logger.warn(`AMI connection failed: ${(error as Error).message}`);
    }
  }
}
