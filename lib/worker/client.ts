import type { Scan } from '@/types';
import type { WorkerResponse } from './parse.worker';

/**
 * Parses raw scan text off the main thread so large uploads never freeze
 * the UI. Falls back to synchronous, main-thread parsing if Web Workers
 * aren't available in the current environment.
 */
export async function parseInWorker(raw: string): Promise<Scan> {
  if (typeof Worker === 'undefined') {
    const { buildScan } = await import('@/lib/scan');
    return buildScan(raw);
  }

  return new Promise<Scan>((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('./parse.worker.ts', import.meta.url));
    } catch {
      import('@/lib/scan')
        .then(({ buildScan }) => resolve(buildScan(raw)))
        .catch(reject);
      return;
    }

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, payload } = event.data;
      worker.terminate();
      if (type === 'result') resolve(payload);
      else reject(new Error(payload));
    };

    worker.onerror = () => {
      worker.terminate();
      import('@/lib/scan')
        .then(({ buildScan }) => resolve(buildScan(raw)))
        .catch(reject);
    };

    worker.postMessage({ type: 'parse', payload: raw });
  });
}
