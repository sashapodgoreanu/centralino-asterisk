import { Module } from '@nestjs/common';
import { TelephonyModule } from '../telephony/telephony.module';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  imports: [TelephonyModule],
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}
