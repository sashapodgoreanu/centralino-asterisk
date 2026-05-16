import { useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import {
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneOff,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { sipClient } from './telephony/sipClient';
import { useTelephonyStore } from './store/useTelephonyStore';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const wsUrl = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000/events';
const sipWsUrl = import.meta.env.VITE_SIP_WS_URL ?? 'wss://localhost:8089/ws';
const sipHost = new URL(sipWsUrl).hostname;

export function App() {
  const {
    extension,
    password,
    target,
    transferTarget,
    registrationState,
    callState,
    muted,
    agents,
    events,
    setField,
    setRegistrationState,
    setCallState,
    setMuted,
    setAgents,
    pushEvent,
  } = useTelephonyStore();

  const currentAgent = useMemo(
    () => agents.find((agent) => agent.extension === extension),
    [agents, extension],
  );

  useEffect(() => {
    const socket = io(wsUrl, { path: '/events', transports: ['websocket'] });
    socket.on('telephony:event', pushEvent);
    return () => {
      socket.disconnect();
    };
  }, [pushEvent]);

  const loadAgents = async () => {
    const response = await fetch(`${apiUrl}/agents`);
    setAgents(await response.json());
  };

  useEffect(() => {
    void loadAgents();
  }, []);

  const register = async () => {
    setRegistrationState('connecting');
    try {
      await sipClient.register({
        wsServer: sipWsUrl,
        host: sipHost,
        extension,
        password,
        onCallState: setCallState,
      });
      setRegistrationState('registered');
    } catch {
      setRegistrationState('failed');
    }
  };

  const unregister = async () => {
    await sipClient.unregister();
    setRegistrationState('idle');
    setCallState('idle');
  };

  const provisionAgent = async () => {
    const response = await fetch(`${apiUrl}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extension,
        password,
        displayName: currentAgent?.displayName ?? `Agent ${extension}`,
      }),
    });
    if (response.ok) {
      await loadAgents();
    }
  };

  const toggleMute = () => {
    sipClient.setMuted(!muted);
    setMuted(!muted);
  };

  const toggleHold = async () => {
    const hold = callState !== 'held';
    await sipClient.setHeld(hold);
    setCallState(hold ? 'held' : 'active');
  };

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>Telephony Console</h1>
          <p>{currentAgent?.displayName ?? `Agent ${extension}`}</p>
        </div>
        <div className={`status ${registrationState}`}>{registrationState}</div>
      </header>

      <section className="workspace">
        <div className="panel soft">
          <div className="panelHeader">
            <h2>Agent</h2>
            <button className="iconButton" onClick={loadAgents} title="Refresh agents">
              <RefreshCw size={18} />
            </button>
          </div>

          <label>
            Extension
            <input value={extension} onChange={(event) => setField('extension', event.target.value)} />
          </label>
          <label>
            Password
            <input
              value={password}
              type="password"
              onChange={(event) => setField('password', event.target.value)}
            />
          </label>

          <div className="buttonRow">
            <button onClick={provisionAgent}>
              <UserPlus size={18} />
              Provision
            </button>
            {registrationState === 'registered' ? (
              <button className="danger" onClick={unregister}>
                <PhoneOff size={18} />
                Unregister
              </button>
            ) : (
              <button onClick={register}>
                <PhoneCall size={18} />
                Register
              </button>
            )}
          </div>

          <div className="agentList">
            {agents.map((agent) => (
              <button key={agent.id} onClick={() => setField('target', agent.extension)}>
                <span>{agent.extension}</span>
                <strong>{agent.displayName}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="panel callPanel">
          <div className="panelHeader">
            <h2>Call</h2>
            <div className={`callState ${callState}`}>{callState}</div>
          </div>

          <label>
            Destination
            <input value={target} onChange={(event) => setField('target', event.target.value)} />
          </label>

          <div className="dialpad">
            <button
              className="primary"
              disabled={registrationState !== 'registered'}
              onClick={() => sipClient.call(target, sipHost, setCallState)}
            >
              <Phone size={19} />
              Call
            </button>
            <button disabled={callState !== 'incoming'} onClick={() => sipClient.answer()}>
              <PhoneCall size={19} />
              Answer
            </button>
            <button className="danger" disabled={callState === 'idle'} onClick={() => sipClient.hangup()}>
              <PhoneOff size={19} />
              Hangup
            </button>
            <button disabled={callState !== 'active' && callState !== 'held'} onClick={toggleMute}>
              {muted ? <MicOff size={19} /> : <Mic size={19} />}
              {muted ? 'Unmute' : 'Mute'}
            </button>
            <button disabled={callState !== 'active' && callState !== 'held'} onClick={toggleHold}>
              <PhoneCall size={19} />
              {callState === 'held' ? 'Resume' : 'Hold'}
            </button>
          </div>

          <div className="transferLine">
            <input
              value={transferTarget}
              placeholder="Transfer"
              onChange={(event) => setField('transferTarget', event.target.value)}
            />
            <button disabled={!transferTarget || callState !== 'active'} onClick={() => sipClient.transfer(transferTarget, sipHost)}>
              <PhoneForwarded size={18} />
              Transfer
            </button>
          </div>
        </div>

        <div className="panel eventPanel">
          <div className="panelHeader">
            <h2>Events</h2>
            <span>{events.length}</span>
          </div>
          <div className="eventList">
            {events.map((event) => (
              <article key={event.id}>
                <time>{new Date(event.occurredAt).toLocaleTimeString()}</time>
                <strong>{event.type}</strong>
                <span>{event.source}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
