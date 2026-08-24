/**
 * Generates a reasonably unique id. Prefers crypto.randomUUID (available in
 * every secure browser context and in Web Workers); falls back to a
 * timestamp + random suffix so id generation never throws.
 */
export function generateId(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}_${crypto.randomUUID()}`;
    }
  } catch {
    // fall through to the fallback below
  }
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}
