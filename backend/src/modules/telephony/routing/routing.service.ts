import { Injectable } from '@nestjs/common';

@Injectable()
export class RoutingService {
  resolveInternalDestination(extension: string) {
    return {
      type: 'endpoint',
      endpoint: `PJSIP/${extension}`,
    };
  }
}
