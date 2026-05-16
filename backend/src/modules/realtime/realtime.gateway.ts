import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TelephonyEvent } from '../telephony/telephony-event';

@WebSocketGateway({
  path: '/events',
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private server!: Server;

  @SubscribeMessage('agent:presence')
  handlePresence(@ConnectedSocket() socket: Socket, @MessageBody() body: { extension?: string; status?: string }) {
    socket.broadcast.emit('agent:presence', {
      extension: body.extension,
      status: body.status,
      occurredAt: new Date().toISOString(),
    });
  }

  @OnEvent('telephony.event')
  handleTelephonyEvent(event: TelephonyEvent) {
    this.logger.debug(`Publishing ${event.type}`);
    this.server.emit('telephony:event', event);
  }
}
