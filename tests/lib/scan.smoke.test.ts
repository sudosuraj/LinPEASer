import { describe, expect, it } from 'vitest';
import { buildScan } from '@/lib/scan';
import { SAMPLE_SCAN_TEXT } from '../fixtures/sample-scan';

describe('buildScan (smoke)', () => {
  const scan = buildScan(SAMPLE_SCAN_TEXT);

  it('extracts metadata', () => {
    expect(scan.metadata.hostname).toBe('sample-target');
    expect(scan.metadata.currentUser).toBe('carol');
    expect(scan.metadata.isRoot).toBe(false);
    expect(scan.metadata.kernelVersion).toBe('5.15.0-91-generic');
  });

  it('builds a section tree with recognized major sections', () => {
    const titles = scan.sections.map((s) => s.title);
    expect(titles).toContain('Basic information');
    expect(titles).toContain('Interesting Files');
    const interestingFiles = scan.sections.find((s) => s.title === 'Interesting Files')!;
    expect(interestingFiles.subsections.map((s) => s.title)).toContain('SUID files');
  });

  it('preserves an unrecognized section instead of dropping it', () => {
    const unknown = scan.sections.find((s) => s.title === 'Quantum Flux Analysis');
    expect(unknown).toBeDefined();
    expect(unknown!.isUnrecognized).toBe(true);
    expect(unknown!.lines.some((l) => l.text.includes('should still be preserved'))).toBe(true);
  });

  it('produces a critical finding for a known-dangerous root SUID binary', () => {
    const finding = scan.findings.find((f) => f.context?.path === '/usr/bin/find');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('critical');
    expect(finding!.confidence).toBe('confirmed');
  });

  it('lowers confidence for an unrecognized root-owned SUID binary', () => {
    const finding = scan.findings.find((f) => f.context?.path === '/opt/custom/tool');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('medium');
    expect(finding!.confidence).toBe('probable');
  });

  it('detects passwordless sudo on a known-risky binary', () => {
    const finding = scan.findings.find((f) => f.ruleId === 'sudo-configuration' && f.description.includes('vim'));
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('critical');
  });

  it('detects the writable Docker socket', () => {
    const finding = scan.findings.find((f) => f.ruleId === 'docker-socket-writable');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('critical');
  });

  it('detects the NFS no_root_squash export', () => {
    const finding = scan.findings.find((f) => f.ruleId === 'nfs-exports');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('critical');
  });

  it('detects PATH containing the current directory', () => {
    const finding = scan.findings.find((f) => f.ruleId === 'path-env-hijack');
    expect(finding).toBeDefined();
  });

  it('detects the docker group membership privesc vector', () => {
    const finding = scan.findings.find((f) => f.ruleId === 'privileged-group-membership');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('critical');
  });

  it('detects the additional UID 0 user', () => {
    const finding = scan.findings.find((f) => f.ruleId === 'additional-uid0-user');
    expect(finding).toBeDefined();
  });

  it('surfaces a color-flagged line with no matching rule as low-confidence', () => {
    const finding = scan.findings.find((f) => f.ruleId === 'color-flagged-fallback');
    expect(finding).toBeDefined();
    expect(finding!.confidence).toBe('possible');
  });

  it('does not throw on an unterminated ANSI escape at end of input', () => {
    expect(scan.totalLines).toBeGreaterThan(0);
  });

  it('sorts findings from most to least severe', () => {
    const weights: Record<string, number> = { critical: 5, high: 4, medium: 3, low: 2, interesting: 1, info: 0 };
    for (let i = 1; i < scan.findings.length; i++) {
      expect(weights[scan.findings[i - 1].severity]).toBeGreaterThanOrEqual(weights[scan.findings[i].severity]);
    }
  });
});

describe('buildScan (empty input)', () => {
  it('handles empty input without throwing', () => {
    const scan = buildScan('');
    expect(scan.findings).toEqual([]);
    expect(scan.diagnostics.some((d) => d.level === 'error')).toBe(true);
  });
});

describe('buildScan (non-LinPEAS text)', () => {
  it('falls back to a single unstructured section', () => {
    const scan = buildScan('just some\nplain unrelated text\nwith no headers at all');
    expect(scan.sections).toHaveLength(1);
    expect(scan.sections[0].title).toBe('General Output');
  });
});
