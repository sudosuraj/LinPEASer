const CHANNEL_NAME = 'linpeaser-sessions';

let channel: BroadcastChannel | null | undefined;

function getChannel(): BroadcastChannel | null {
  if (channel !== undefined) return channel;
  channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
  return channel;
}

/** Notifies other tabs that the session list changed, so they can refresh. */
export function broadcastSessionsChanged(): void {
  getChannel()?.postMessage({ type: 'sessions-changed', at: Date.now() });
}

/** Subscribes to session-list changes from other tabs. Returns an unsubscribe function. */
export function subscribeSessionsChanged(callback: () => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};
  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'sessions-changed') callback();
  };
  ch.addEventListener('message', handler);
  return () => ch.removeEventListener('message', handler);
}
