/// <reference lib="webworker" />
import { buildScan } from '@/lib/scan';

export type WorkerRequest = { type: 'parse'; payload: string };
export type WorkerResponse =
  | { type: 'result'; payload: ReturnType<typeof buildScan> }
  | { type: 'error'; payload: string };

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type, payload } = event.data;
  if (type !== 'parse') return;

  try {
    const scan = buildScan(payload);
    const response: WorkerResponse = { type: 'result', payload: scan };
    (self as unknown as Worker).postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      payload: error instanceof Error ? error.message : 'Parsing failed for an unknown reason.',
    };
    (self as unknown as Worker).postMessage(response);
  }
};
