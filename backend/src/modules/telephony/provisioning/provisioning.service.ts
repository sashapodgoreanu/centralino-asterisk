import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface WebRtcEndpointInput {
  extension: string;
  password: string;
  codecs?: string;
}

@Injectable()
export class ProvisioningService {
  async provisionWebRtcEndpoint(tx: Prisma.TransactionClient, input: WebRtcEndpointInput) {
    const codecs = input.codecs ?? 'opus,ulaw,alaw';

    await tx.psAor.upsert({
      where: { id: input.extension },
      update: {
        maxContacts: 1,
        removeExisting: 'yes',
        removeUnavailable: 'yes',
        qualifyFrequency: 30,
        supportPath: 'yes',
      },
      create: {
        id: input.extension,
        maxContacts: 1,
        removeExisting: 'yes',
        removeUnavailable: 'yes',
        qualifyFrequency: 30,
        supportPath: 'yes',
      },
    });

    await tx.psAuth.upsert({
      where: { id: input.extension },
      update: {
        authType: 'userpass',
        username: input.extension,
        password: input.password,
      },
      create: {
        id: input.extension,
        authType: 'userpass',
        username: input.extension,
        password: input.password,
      },
    });

    await tx.psEndpoint.upsert({
      where: { id: input.extension },
      update: this.endpointDefaults(input.extension, codecs),
      create: {
        id: input.extension,
        ...this.endpointDefaults(input.extension, codecs),
      },
    });
  }

  private endpointDefaults(extension: string, codecs: string) {
    return {
      transport: 'transport-ws',
      context: 'internal',
      disallow: 'all',
      allow: codecs,
      auth: extension,
      aors: extension,
      webrtc: 'yes',
      directMedia: 'no',
      useAvpf: 'yes',
      forceAvp: 'yes',
      mediaEncryption: 'dtls',
      dtlsAutoGenerateCert: 'yes',
      dtlsVerify: 'fingerprint',
      dtlsSetup: 'actpass',
      iceSupport: 'yes',
      mediaUseReceivedTransport: 'yes',
      rtcpMux: 'yes',
      rewriteContact: 'yes',
      rtpSymmetric: 'yes',
      forceRport: 'yes',
      allowTransfer: 'yes',
      allowSubscribe: 'no',
    };
  }
}
