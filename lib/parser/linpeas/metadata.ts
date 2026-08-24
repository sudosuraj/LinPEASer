import type { ParseDiagnostic, ScanMetadata } from '@/types';

function firstMatch(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m && m[1] ? m[1].trim() : null;
}

function extractHostname(text: string): string | null {
  return (
    firstMatch(text, /^\s*Hostname:\s*(\S+)/im) ??
    firstMatch(text, /^\s*hostnamectl.*?\n\s*Static hostname:\s*(\S+)/im) ??
    firstMatch(text, /\bstatic hostname:\s*(\S+)/im)
  );
}

function extractCurrentUserAndRoot(text: string): { user: string | null; isRoot: boolean | null } {
  const m = text.match(/\buid=\d+\(([^)]+)\)\s*gid=\d+\([^)]+\)/i);
  if (m) {
    const user = m[1].trim();
    return { user, isRoot: user === 'root' };
  }
  const idLine = firstMatch(text, /^\s*uid=0\(root\)/im);
  if (idLine !== null) return { user: 'root', isRoot: true };
  return { user: null, isRoot: null };
}

function extractOperatingSystem(text: string): { os: string | null; distro: string | null } {
  const prettyName = firstMatch(text, /PRETTY_NAME=["']?([^"'\n]+)/);
  const description = firstMatch(text, /^\s*Description:\s*(.+)$/im);
  const osLine = firstMatch(text, /^\s*OS:\s*(.+)$/im);
  const distro = prettyName ?? description ?? null;
  const os = osLine ?? distro;
  return { os: os ? os.slice(0, 120) : null, distro: distro ? distro.slice(0, 120) : null };
}

function extractKernelVersion(text: string): string | null {
  return (
    firstMatch(text, /Linux version\s+(\S+)/i) ??
    firstMatch(text, /^\s*Kernel:\s*(.+)$/im) ??
    firstMatch(text, /Linux\s+\S+\s+(\d+\.\d+\.\d+[^\s]*)/)
  );
}

function extractToolVersion(text: string): string | null {
  return firstMatch(text, /linpeas[^\n]*?\bv?(\d+\.\d+(?:\.\d+)?)\b/i);
}

function extractScanDate(text: string): string | null {
  return firstMatch(
    text,
    /^([A-Z][a-z]{2}\s[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}[^\n]*\d{4})/m
  );
}

function extractIpAddresses(text: string): string[] {
  const found = new Set<string>();
  const re = /\binet\s+(\d{1,3}(?:\.\d{1,3}){3})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) && found.size < 20) {
    if (m[1] !== '127.0.0.1') found.add(m[1]);
  }
  return Array.from(found);
}

export function extractMetadata(text: string): { metadata: ScanMetadata; diagnostics: ParseDiagnostic[] } {
  const { user, isRoot } = extractCurrentUserAndRoot(text);
  const { os, distro } = extractOperatingSystem(text);
  const diagnostics: ParseDiagnostic[] = [];

  const metadata: ScanMetadata = {
    hostname: extractHostname(text),
    operatingSystem: os,
    distro,
    kernelVersion: extractKernelVersion(text),
    currentUser: user,
    isRoot,
    scanDate: extractScanDate(text),
    toolVersion: extractToolVersion(text),
    ipAddresses: extractIpAddresses(text),
    parsedAt: new Date().toISOString(),
  };

  if (!metadata.hostname && !metadata.currentUser && !metadata.operatingSystem) {
    diagnostics.push({
      level: 'info',
      message: 'No host, user, or OS metadata could be identified in this output.',
    });
  }

  return { metadata, diagnostics };
}
