import { Module } from '@nestjs/common';
import { AmiService } from './ami/ami.service';
import { AriService } from './ari/ari.service';
import { ProvisioningModule } from './provisioning/provisioning.module';
import { QueuesModule } from './queues/queues.module';
import { RoutingModule } from './routing/routing.module';
import { TelephonyEventBus } from './telephony-event-bus.service';

@Module({
  imports: [ProvisioningModule, QueuesModule, RoutingModule],
  providers: [TelephonyEventBus, AriService, AmiService],
  exports: [TelephonyEventBus, AriService, AmiService, ProvisioningModule, QueuesModule, RoutingModule],
})
export class TelephonyModule {}
