import { extractListeningSockets } from '@/lib/normalization/network';
import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

const UNAUTHENTICATED_SERVICE_PORTS: Record<number, string> = {
  6379: 'Redis',
  27017: 'MongoDB',
  9200: 'Elasticsearch',
  11211: 'Memcached',
  5984: 'CouchDB',
  2049: 'NFS',
};

export const exposedServiceRule: DetectionRule = {
  id: 'network-service-exposure',
  category: 'network',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      if (!/listen/i.test(line.text) && !line.text.includes('0.0.0.0')) continue;
      const sockets = extractListeningSockets(line.text);
      for (const socket of sockets) {
        const serviceName = UNAUTHENTICATED_SERVICE_PORTS[socket.port];
        if (!serviceName || socket.address === '127.0.0.1') continue;

        drafts.push({
          title: `${serviceName} listening on ${socket.address}:${socket.port}`,
          category: 'network',
          severity: 'medium',
          confidence: 'possible',
          description: `A service on port ${socket.port} (commonly ${serviceName}) is bound to ${socket.address}, not just localhost.`,
          rationale: `${serviceName} frequently ships without authentication by default — confirm whether this instance requires credentials and who can reach it.`,
          evidenceLineIndexes: [line.index],
          tags: ['network'],
        });
      }
    }

    return drafts;
  },
};
