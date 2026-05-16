import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TelephonyEvent, TelephonyEventType } from './telephony-event';

@Injectable()
export class TelephonyEventBus {
  constructor(private readonly events: EventEmitter2) {}

  publish<TPayload extends Record<string, unknown>>(
    type: TelephonyEventType,
    source: TelephonyEvent['source'],
    payload: TPayload,
  ) {
    const event: TelephonyEvent<TPayload> = {
      id: randomUUID(),
      type,
      source,
      occurredAt: new Date().toISOString(),
      payload,
    };

    this.events.emit('telephony.event', event);
    return event;
  }
}
