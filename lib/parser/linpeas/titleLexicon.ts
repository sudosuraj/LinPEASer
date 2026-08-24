import type { SectionKind } from '@/types';

interface LexiconEntry {
  kind: SectionKind;
  keywords: string[];
}

/**
 * Keyword table used to classify a detected section title into a semantic
 * SectionKind. Entries are checked in order, most specific first, so a
 * title like "Sudo Version" resolves to `sudo` rather than a broader
 * bucket. Adding support for a title used by a newer/older LinPEAS release
 * is a one-line addition here — no parser code changes needed.
 */
const LEXICON: LexiconEntry[] = [
  { kind: 'suid-sgid', keywords: ['suid', 'sgid', 'guid files'] },
  { kind: 'capabilities', keywords: ['capabilities'] },
  // Modern LinPEAS combines these four concepts under one major section
  // title ("Processes, Crons, Timers, Services and Sockets") — check for
  // that combination before the narrower single-concept keywords below so
  // it doesn't get bucketed as just "cron".
  { kind: 'processes', keywords: ['processes, cron', 'processes & cron', 'crons, timers'] },
  { kind: 'cron', keywords: ['cron', 'scheduled task', 'timer'] },
  { kind: 'sudo', keywords: ['sudo'] },
  { kind: 'ssh', keywords: ['ssh'] },
  {
    kind: 'credentials',
    keywords: [
      'password',
      'credential',
      'api key',
      'api_key',
      'secret',
      'history file',
      'gpg',
      'keyring',
      'clipboard',
      'hashes',
      'searching for',
    ],
  },
  { kind: 'containers', keywords: ['docker', 'container', 'kubernetes', 'lxc', 'podman'] },
  {
    kind: 'kernel',
    keywords: ['kernel', 'cpu info', 'dmesg', 'loaded module', 'pci device', 'usb device', 'sysctl', 'system stats'],
  },
  { kind: 'mounts', keywords: ['mount', 'disk space', 'lvm', 'partition', 'filesystem', 'nfs export', 'fstab', 'drives'] },
  {
    kind: 'network',
    keywords: ['network', 'interface', 'listening', 'route', 'dns', 'firewall', 'iptables', 'nftables', 'netstat', 'port'],
  },
  { kind: 'services', keywords: ['service', 'systemd', 'socket', 'dbus', 'inetd', 'xinetd'] },
  { kind: 'processes', keywords: ['process', 'running binaries'] },
  {
    kind: 'users-groups',
    keywords: ['user information', 'users information', 'groups', 'logon', 'login', 'session', 'passwd file', 'shadow file', 'privileges', 'my user'],
  },
  { kind: 'cloud', keywords: ['aws', 'gcp', 'azure', 'cloud', 'metadata service', 'ec2', 'droplet'] },
  { kind: 'exploits', keywords: ['exploit', 'cve', 'vulnerab'] },
  { kind: 'software', keywords: ['software', 'installed', 'compiler', 'package', 'version'] },
  {
    kind: 'interesting-files',
    keywords: ['interesting file', 'writable file', 'readable file', 'hidden file', 'backup file', 'executable file', 'file information'],
  },
  { kind: 'environment', keywords: ['environment', 'env var', 'path variable'] },
  {
    kind: 'system-info',
    keywords: ['basic information', 'system information', 'operative system', 'hostname', 'os information', 'date & uptime'],
  },
];

export function classifySectionTitle(title: string): SectionKind {
  const lower = title.toLowerCase();
  for (const entry of LEXICON) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.kind;
    }
  }
  return 'unknown';
}
