import { Module } from '@nestjs/common';
import { TelephonyModule } from '../telephony/telephony.module';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';

@Module({
  imports: [TelephonyModule],
  controllers: [CallsController],
  providers: [CallsService],
})
export class CallsModule {}
