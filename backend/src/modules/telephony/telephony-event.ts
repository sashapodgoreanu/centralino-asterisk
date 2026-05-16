export type TelephonyEventType =
  | 'channel.started'
  | 'channel.ended'
  | 'channel.state.changed'
  | 'agent.provisioned'
  | 'queue.updated'
  | 'ami.raw'
  | 'ari.raw';

export interface TelephonyEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  type: TelephonyEventType;
  source: 'ari' | 'ami' | 'backend';
  occurredAt: string;
  payload: TPayload;
}
