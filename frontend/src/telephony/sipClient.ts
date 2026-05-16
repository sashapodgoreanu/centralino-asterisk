import {
  Inviter,
  Registerer,
  Session,
  SessionState,
  UserAgent,
  UserAgentOptions,
} from 'sip.js';

interface SipClientOptions {
  wsServer: string;
  host: string;
  extension: string;
  password: string;
  onCallState: (state: 'incoming' | 'ringing' | 'active' | 'held' | 'ended' | 'failed') => void;
}

export class SipClient {
  private userAgent?: UserAgent;
  private registerer?: Registerer;
  private session?: Session;
  private audioContext?: AudioContext;
  private remoteAudio?: HTMLAudioElement;
  private remoteStream?: MediaStream;
  private ringTimer?: number;
  private ringOscillators: OscillatorNode[] = [];

  async register(options: SipClientOptions) {
    const uri = UserAgent.makeURI(`sip:${options.extension}@${options.host}`);
    if (!uri) {
      throw new Error('Invalid SIP URI');
    }

    const userAgentOptions: UserAgentOptions = {
      uri,
      authorizationUsername: options.extension,
      authorizationPassword: options.password,
      transportOptions: {
        server: options.wsServer,
      },
      sessionDescriptionHandlerFactoryOptions: {
        constraints: {
          audio: true,
          video: false,
        },
        peerConnectionConfiguration: {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        },
      },
    };

    this.userAgent = new UserAgent(userAgentOptions);
    this.userAgent.delegate = {
      onInvite: (invitation) => {
        this.session = invitation;
        this.bindSession(invitation, options.onCallState);
        this.startRingTone('incoming');
        options.onCallState('incoming');
      },
    };

    await this.userAgent.start();
    await this.unlockAudio();
    this.registerer = new Registerer(this.userAgent);
    await this.registerer.register();
  }

  async unregister() {
    await this.registerer?.unregister();
    await this.userAgent?.stop();
    this.registerer = undefined;
    this.userAgent = undefined;
    this.session = undefined;
    this.stopRingTone();
    this.detachRemoteAudio();
  }

  async call(target: string, host: string, onCallState: SipClientOptions['onCallState']) {
    if (!this.userAgent) {
      throw new Error('Register before calling');
    }

    const targetUri = UserAgent.makeURI(`sip:${target}@${host}`);
    if (!targetUri) {
      throw new Error('Invalid target URI');
    }

    const inviter = new Inviter(this.userAgent, targetUri);
    this.session = inviter;
    this.bindSession(inviter, onCallState);
    this.startRingTone('ringback');
    onCallState('ringing');
    await inviter.invite();
  }

  async answer() {
    const answerable = this.session as Session & { accept?: () => Promise<void> };
    this.stopRingTone();
    await answerable.accept?.();
  }

  async hangup() {
    if (!this.session) {
      return;
    }

    if (this.session.state === SessionState.Established) {
      await this.session.bye();
    } else {
      const cancellable = this.session as Session & { cancel?: () => Promise<void>; reject?: () => Promise<void> };
      await (cancellable.cancel?.() ?? cancellable.reject?.());
    }
    this.stopRingTone();
  }

  setMuted(muted: boolean) {
    const handler = this.session?.sessionDescriptionHandler as any;
    const sender = handler?.peerConnection?.getSenders?.().find((item: RTCRtpSender) => item.track?.kind === 'audio');
    if (sender?.track) {
      sender.track.enabled = !muted;
    }
  }

  async setHeld(held: boolean) {
    if (!this.session || this.session.state !== SessionState.Established) {
      return;
    }

    await this.session.invite({
      sessionDescriptionHandlerOptions: {
        hold: held,
      },
    } as any);
  }

  async transfer(target: string, host: string) {
    if (!this.session) {
      return;
    }

    const uri = UserAgent.makeURI(`sip:${target}@${host}`);
    if (!uri) {
      throw new Error('Invalid transfer URI');
    }

    await this.session.refer(uri);
  }

  private bindSession(session: Session, onCallState: SipClientOptions['onCallState']) {
    session.stateChange.addListener((state) => {
      if (state === SessionState.Established) {
        this.stopRingTone();
        this.attachRemoteAudio(session);
        onCallState('active');
      }
      if (state === SessionState.Terminated) {
        this.stopRingTone();
        this.detachRemoteAudio();
        onCallState('ended');
      }
    });

  }

  private async unlockAudio() {
    this.audioContext ??= new AudioContext();
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume().catch(() => undefined);
    }

    this.remoteAudio ??= new Audio();
    this.remoteAudio.autoplay = true;
  }

  private startRingTone(type: 'incoming' | 'ringback') {
    void this.unlockAudio();
    this.stopRingTone();

    const cadence = () => {
      const context = this.audioContext;
      if (!context) {
        return;
      }

      const first = context.createOscillator();
      const second = context.createOscillator();
      const gain = context.createGain();
      first.type = 'sine';
      second.type = 'sine';
      first.frequency.value = type === 'incoming' ? 440 : 425;
      second.frequency.value = type === 'incoming' ? 480 : 425;
      gain.gain.value = type === 'incoming' ? 0.08 : 0.045;

      first.connect(gain);
      second.connect(gain);
      gain.connect(context.destination);

      const now = context.currentTime;
      first.start(now);
      second.start(now);
      first.stop(now + 0.9);
      second.stop(now + 0.9);
      this.ringOscillators = [first, second];
    };

    cadence();
    this.ringTimer = window.setInterval(cadence, type === 'incoming' ? 1800 : 4000);
  }

  private stopRingTone() {
    if (this.ringTimer) {
      window.clearInterval(this.ringTimer);
      this.ringTimer = undefined;
    }

    this.ringOscillators.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch {
        // Oscillators may already have reached their scheduled stop time.
      }
    });
    this.ringOscillators = [];
  }

  private attachRemoteAudio(session: Session) {
    const handler = session.sessionDescriptionHandler as any;
    const peerConnection = handler?.peerConnection as RTCPeerConnection | undefined;
    if (!peerConnection) {
      return;
    }

    this.remoteAudio ??= new Audio();
    this.remoteAudio.autoplay = true;
    this.remoteStream ??= new MediaStream();

    peerConnection.getReceivers()
      .map((receiver) => receiver.track)
      .filter((track): track is MediaStreamTrack => track?.kind === 'audio')
      .forEach((track) => {
        if (!this.remoteStream?.getTracks().some((item) => item.id === track.id)) {
          this.remoteStream?.addTrack(track);
        }
      });

    peerConnection.addEventListener('track', (event) => {
      event.streams[0]?.getAudioTracks().forEach((track) => {
        if (!this.remoteStream?.getTracks().some((item) => item.id === track.id)) {
          this.remoteStream?.addTrack(track);
        }
      });
      this.playRemoteAudio();
    });

    this.playRemoteAudio();
  }

  private playRemoteAudio() {
    if (!this.remoteAudio || !this.remoteStream) {
      return;
    }

    this.remoteAudio.srcObject = this.remoteStream;
    void this.remoteAudio.play().catch(() => undefined);
  }

  private detachRemoteAudio() {
    this.remoteStream?.getTracks().forEach((track) => track.stop());
    this.remoteStream = undefined;

    if (this.remoteAudio) {
      this.remoteAudio.pause();
      this.remoteAudio.srcObject = null;
    }
  }
}

export const sipClient = new SipClient();
