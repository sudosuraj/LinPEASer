export interface ListeningSocket {
  address: string;
  port: number;
}

/** Matches "address:port" pairs from netstat/ss-style listing lines. */
const SOCKET_RE = /\b(\d{1,3}(?:\.\d{1,3}){3}|\[?::\]?|0\.0\.0\.0|127\.0\.0\.1):(\d{1,5})\b/g;

export function extractListeningSockets(line: string): ListeningSocket[] {
  const results: ListeningSocket[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(SOCKET_RE);
  while ((m = re.exec(line))) {
    const port = Number(m[2]);
    if (port > 0 && port <= 65535) {
      results.push({ address: m[1], port });
    }
  }
  return results;
}
