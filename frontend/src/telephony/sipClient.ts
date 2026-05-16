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
        options.onCallState('incoming');
      },
    };

    await this.userAgent.start();
    this.registerer = new Registerer(this.userAgent);
    await this.registerer.register();
  }

  async unregister() {
    await this.registerer?.unregister();
    await this.userAgent?.stop();
    this.registerer = undefined;
    this.userAgent = undefined;
    this.session = undefined;
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
    onCallState('ringing');
    await inviter.invite();
  }

  async answer() {
    const answerable = this.session as Session & { accept?: () => Promise<void> };
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
        onCallState('active');
      }
      if (state === SessionState.Terminated) {
        onCallState('ended');
      }
    });
  }
}

export const sipClient = new SipClient();
