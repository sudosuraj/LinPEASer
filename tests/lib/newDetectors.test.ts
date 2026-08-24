import { describe, expect, it } from 'vitest';
import { buildScan } from '@/lib/scan';

describe('wildcard injection detection', () => {
  it('flags a cron job that runs tar with a bare wildcard', () => {
    const scan = buildScan('* * * * * root cd /opt/backups && tar czf /tmp/out.tar.gz *');
    const finding = scan.findings.find((f) => f.ruleId === 'wildcard-injection');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('high');
  });

  it('does not flag a cron job with an explicit, non-wildcard argument', () => {
    const scan = buildScan('* * * * * root tar czf /tmp/out.tar.gz /opt/backups/data.db');
    expect(scan.findings.find((f) => f.ruleId === 'wildcard-injection')).toBeUndefined();
  });

  it('does not flag a non-vulnerable binary using a wildcard', () => {
    const scan = buildScan('* * * * * root ls -la *');
    expect(scan.findings.find((f) => f.ruleId === 'wildcard-injection')).toBeUndefined();
  });
});

describe('readable root home directory', () => {
  it('flags /root when it is world-readable', () => {
    const scan = buildScan('drwxr-xr-x 20 root root 4096 Jan 1 2024 /root');
    const finding = scan.findings.find((f) => f.ruleId === 'readable-root-home');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('high');
  });

  it('does not flag /root when it is properly locked down', () => {
    const scan = buildScan('drwx------ 20 root root 4096 Jan 1 2024 /root');
    expect(scan.findings.find((f) => f.ruleId === 'readable-root-home')).toBeUndefined();
  });

  it('does not flag an unrelated directory that happens to end in "root"', () => {
    const scan = buildScan('drwxr-xr-x 2 root root 4096 Jan 1 2024 /home/notroot');
    expect(scan.findings.find((f) => f.ruleId === 'readable-root-home')).toBeUndefined();
  });
});

describe('expanded credential patterns', () => {
  // Built by concatenation rather than as single literals so these
  // synthetic, non-functional fixtures don't have the exact shape of a
  // real credential sitting in the source text (real secret scanners,
  // including GitHub's push protection, match on that literal shape).
  it('detects a Google API key', () => {
    const fake = 'AIza' + 'SyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY';
    const scan = buildScan(`GOOGLE_MAPS_KEY=${fake}`);
    expect(scan.findings.some((f) => f.title === 'Google API key')).toBe(true);
  });

  it('detects a Stripe live secret key', () => {
    const fake = 'sk_live_' + '51H8xyzABCDEFGHIJKLMNOPQR';
    const scan = buildScan(`STRIPE_KEY=${fake}`);
    expect(scan.findings.some((f) => f.title === 'Stripe live secret key')).toBe(true);
  });

  it('detects a JWT', () => {
    const fake = ['eyJhbGciOiJIUzI1NiJ9', 'eyJzdWIiOiIxMjM0NTY3ODkwIn0', 'dQw4w9WgXcQ_dQw4w9WgXcQdQw4w9WgXcQ'].join('.');
    const scan = buildScan(`AUTH_TOKEN=${fake}`);
    expect(scan.findings.some((f) => f.title === 'JSON Web Token (JWT)')).toBe(true);
  });
});

describe('landmark CVE detection', () => {
  describe('sudo Baron Samedit (CVE-2021-3156)', () => {
    it('flags the top of the legacy vulnerable range (1.8.2)', () => {
      const scan = buildScan('Sudo version 1.8.2');
      const finding = scan.findings.find((f) => f.ruleId === 'sudo-baron-samedit');
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('high');
    });

    it('flags the last vulnerable legacy patch level (1.8.31p2)', () => {
      const scan = buildScan('Sudo version 1.8.31p2');
      expect(scan.findings.find((f) => f.ruleId === 'sudo-baron-samedit')).toBeDefined();
    });

    it('does not flag the fixed legacy version (1.8.32)', () => {
      const scan = buildScan('Sudo version 1.8.32');
      expect(scan.findings.find((f) => f.ruleId === 'sudo-baron-samedit')).toBeUndefined();
    });

    it('does not flag a legacy patch level past the fix (1.8.31p3)', () => {
      const scan = buildScan('Sudo version 1.8.31p3');
      expect(scan.findings.find((f) => f.ruleId === 'sudo-baron-samedit')).toBeUndefined();
    });

    it('flags the top of the stable vulnerable range (1.9.0)', () => {
      const scan = buildScan('Sudo version 1.9.0');
      expect(scan.findings.find((f) => f.ruleId === 'sudo-baron-samedit')).toBeDefined();
    });

    it('flags the last vulnerable stable patch level (1.9.5p1)', () => {
      const scan = buildScan('Sudo version 1.9.5p1');
      expect(scan.findings.find((f) => f.ruleId === 'sudo-baron-samedit')).toBeDefined();
    });

    it('does not flag the fixed stable version (1.9.5p2)', () => {
      const scan = buildScan('Sudo version 1.9.5p2');
      expect(scan.findings.find((f) => f.ruleId === 'sudo-baron-samedit')).toBeUndefined();
    });

    it('does not flag a later major version (1.9.9)', () => {
      const scan = buildScan('Sudo version 1.9.9');
      expect(scan.findings.find((f) => f.ruleId === 'sudo-baron-samedit')).toBeUndefined();
    });
  });

  describe('pkexec PwnKit (CVE-2021-4034)', () => {
    it('flags the presence of the pkexec binary', () => {
      const scan = buildScan('-rwsr-xr-x 1 root root 30040 Jan 1 2020 /usr/bin/pkexec');
      const finding = scan.findings.find((f) => f.ruleId === 'pkexec-pwnkit');
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('medium');
    });

    it('does not flag an unrelated binary', () => {
      const scan = buildScan('-rwsr-xr-x 1 root root 30040 Jan 1 2020 /usr/bin/passwd');
      expect(scan.findings.find((f) => f.ruleId === 'pkexec-pwnkit')).toBeUndefined();
    });
  });
});

describe('merged Processes/Cron/Timers/Services section (modern LinPEAS)', () => {
  it('still classifies as a processes-relevant section and runs process checks', () => {
    const text = [
      '══════╣ Processes, Crons, Timers, Services and Sockets ╠══════',
      'root  1234  0.0  0.1  /tmp/backdoor --daemon',
    ].join('\n');
    const scan = buildScan(text);
    const section = scan.sections.find((s) => s.title.includes('Processes, Crons'));
    expect(section?.kind).toBe('processes');
    expect(scan.findings.some((f) => f.ruleId === 'process-from-writable-dir')).toBe(true);
  });
});
