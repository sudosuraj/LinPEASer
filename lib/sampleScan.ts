/**
 * Synthetic, independently authored sample used by the "load a sample scan"
 * landing-page action and by the parser test suite. It mimics the *shape*
 * of real LinPEAS-style output (box-drawing headers, ANSI-colored warnings,
 * ls -l style permission listings) without reproducing any actual scan.
 */
const ESC = '\x1b';
const RESET = `${ESC}[0m`;
const BLUE = `${ESC}[1;34m`;
const GREEN = `${ESC}[1;32m`;
const CRITICAL_COMBO = `${ESC}[1;33;41m`; // yellow-on-red — the strongest warning combo LinPEAS uses

function major(title: string): string {
  return `${BLUE}══════════╣${RESET} ${GREEN}${title}${RESET} ${BLUE}╠══════════${RESET}`;
}

function sub(title: string): string {
  return `${BLUE}╔══════════╣${RESET} ${GREEN}${title}${RESET}`;
}

const lines: string[] = [
  '~~~~~~~~~~~~~~~~~~~~ Sample Enumeration Banner ~~~~~~~~~~~~~~~~~~~~',
  `${GREEN}Do you like this project? Follow good practices!${RESET}`,
  '',
  major('Basic information'),
  'Hostname: sample-target',
  'OS: Ubuntu 22.04.3 LTS',
  'Linux version 5.15.0-91-generic (buildd@lcy02-amd64) #101',
  'uid=1000(carol) gid=1000(carol) groups=1000(carol),27(sudo),999(docker)',
  'Mon Aug 24 10:00:00 UTC 2026',
  '',
  major('Users Information'),
  sub('Sudo version'),
  'Sudo version 1.9.9',
  sub('Current user sudo -l'),
  'Matching Defaults entries for carol on sample-target:',
  '    env_reset, mail_badpass',
  'User carol may run the following commands on sample-target:',
  '    (root) NOPASSWD: /usr/bin/vim',
  '',
  major('Interesting Files'),
  sub('SUID files'),
  '-rwsr-xr-x 1 root root 43416 Jan  1  2024 /usr/bin/find',
  '-rwsr-xr-x 1 root root 18448 Jan  1  2024 /opt/custom/tool',
  '-rwsr-xr-x 1 carol carol 9000 Jan  1  2024 /home/carol/bin/mytool',
  sub('SGID files'),
  '-rwxr-sr-x 1 root shadow 31032 Jan  1  2024 /usr/bin/wall',
  sub('Capabilities'),
  '/usr/bin/python3.10 = cap_setuid+ep',
  sub('Cron jobs'),
  '* * * * * root /tmp/backup-sync.sh',
  '0 3 * * * root /usr/local/bin/nightly-report.sh',
  sub('Writable files'),
  '-rw-rw-rw- 1 root root 220 Jan  1  2024 /etc/motd-extra.conf',
  sub('PATH'),
  'PATH=.:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin',
  sub('SSH Files'),
  '-rw-r--r-- 1 carol carol 2610 Jan  1  2024 /home/carol/.ssh/id_rsa',
  'PermitRootLogin yes',
  'PasswordAuthentication yes',
  sub('Docker'),
  'srw-rw-rw- 1 root docker 0 Jan  1  2024 /var/run/docker.sock',
  'Currently inside a Docker container',
  sub('NFS exports'),
  '/srv/nfs *(rw,sync,no_root_squash)',
  sub('Interesting environment variables'),
  'LD_PRELOAD=/tmp/evil.so',
  sub('Additional users'),
  'backupsvc:x:0:0:backup service:/root:/bin/bash',
  '',
  major('Network Information'),
  'tcp        0      0 0.0.0.0:6379            0.0.0.0:*               LISTEN',
  `${CRITICAL_COMBO}Unusual listener detected on an uncommon port${RESET}`,
  '',
  major('Quantum Flux Analysis'),
  'This section title is intentionally unfamiliar to the parser.',
  'Some content that should still be preserved and searchable.',
  '',
  `Trailing line with an unterminated escape sequence: ${ESC}[38;5`,
];

export const SAMPLE_SCAN_TEXT = lines.join('\n');
