import { create } from 'zustand';

export type RegistrationState = 'idle' | 'connecting' | 'registered' | 'failed';
export type CallState = 'idle' | 'incoming' | 'ringing' | 'active' | 'held' | 'ended' | 'failed';

export interface Agent {
  id: string;
  extension: string;
  displayName: string;
  status: string;
}

export interface TelephonyEvent {
  id: string;
  type: string;
  source: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

interface TelephonyStore {
  extension: string;
  password: string;
  target: string;
  transferTarget: string;
  registrationState: RegistrationState;
  callState: CallState;
  muted: boolean;
  lastError?: string;
  agents: Agent[];
  events: TelephonyEvent[];
  setField: (name: 'extension' | 'password' | 'target' | 'transferTarget', value: string) => void;
  setRegistrationState: (state: RegistrationState) => void;
  setCallState: (state: CallState) => void;
  setMuted: (muted: boolean) => void;
  setLastError: (message?: string) => void;
  setAgents: (agents: Agent[]) => void;
  pushEvent: (event: TelephonyEvent) => void;
}

export const useTelephonyStore = create<TelephonyStore>((set) => ({
  extension: '6001',
  password: '6001pass',
  target: '6002',
  transferTarget: '',
  registrationState: 'idle',
  callState: 'idle',
  muted: false,
  lastError: undefined,
  agents: [],
  events: [],
  setField: (name, value) => set({ [name]: value }),
  setRegistrationState: (registrationState) => set({ registrationState }),
  setCallState: (callState) => set({ callState }),
  setMuted: (muted) => set({ muted }),
  setLastError: (lastError) => set({ lastError }),
  setAgents: (agents) => set({ agents }),
  pushEvent: (event) => set((state) => ({ events: [event, ...state.events].slice(0, 40) })),
}));
