import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AgentsModule } from './modules/agents/agents.module';
import { CallsModule } from './modules/calls/calls.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { TelephonyModule } from './modules/telephony/telephony.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    RealtimeModule,
    TelephonyModule,
    AgentsModule,
    CallsModule,
  ],
})
export class AppModule {}
