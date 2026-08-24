import { describe, expect, it } from 'vitest';
import { tokenizeAnsi } from '@/lib/parser/ansi/tokenizer';
import { buildRawLines } from '@/lib/parser/ansi';
import { classifyHeaderLine } from '@/lib/parser/linpeas/headers';
import { parsePermissionString } from '@/lib/normalization/permissions';
import { parseIdString } from '@/lib/normalization/identity';
import { buildScan } from '@/lib/scan';

describe('tokenizeAnsi', () => {
  it('extracts plain text with no escapes', () => {
    const tokens = tokenizeAnsi('hello world');
    expect(tokens).toEqual([{ type: 'text', value: 'hello world' }]);
  });

  it('parses an SGR sequence into codes and surrounding text', () => {
    const tokens = tokenizeAnsi('\x1b[1;31mred\x1b[0m plain');
    expect(tokens).toEqual([
      { type: 'sgr', codes: [1, 31] },
      { type: 'text', value: 'red' },
      { type: 'sgr', codes: [0] },
      { type: 'text', value: ' plain' },
    ]);
  });

  it('silently drops a non-SGR CSI sequence (cursor movement), keeping surrounding text intact', () => {
    const tokens = tokenizeAnsi('a\x1b[2Kb');
    expect(tokens).toEqual([{ type: 'text', value: 'ab' }]);
  });

  it('never throws on an unterminated CSI sequence', () => {
    expect(() => tokenizeAnsi('before\x1b[38;5')).not.toThrow();
    const tokens = tokenizeAnsi('before\x1b[38;5');
    expect(tokens.map((t) => t.type)).toContain('text');
  });

  it('never throws on a bare escape byte with nothing after it', () => {
    expect(() => tokenizeAnsi('trailing\x1b')).not.toThrow();
  });

  it('drops an OSC hyperlink sequence terminated by BEL', () => {
    const tokens = tokenizeAnsi('\x1b]8;;http://example.com\x07link text\x1b]8;;\x07');
    expect(tokens).toEqual([{ type: 'text', value: 'link text' }]);
  });

  it('handles an unterminated OSC sequence without throwing or losing prior text', () => {
    expect(() => tokenizeAnsi('kept\x1b]8;;http://example.com')).not.toThrow();
  });
});

describe('buildRawLines', () => {
  it('carries color state across a line boundary when no reset is issued', () => {
    const lines = buildRawLines('\x1b[31mred starts\nred continues\x1b[0m');
    expect(lines[0].signals).toContain('red-fg');
    expect(lines[1].signals).toContain('red-fg');
  });

  it('detects a critical (yellow-on-red) combo distinctly from plain red', () => {
    const lines = buildRawLines('\x1b[1;33;41mcritical\x1b[0m\nplain \x1b[31mred only\x1b[0m');
    expect(lines[0].signals).toContain('critical-combo');
    expect(lines[0].signals).not.toContain('red-fg');
    expect(lines[1].signals).toContain('red-fg');
    expect(lines[1].signals).not.toContain('critical-combo');
  });
});

describe('classifyHeaderLine', () => {
  it('recognizes a major section header (opens and closes a box)', () => {
    const result = classifyHeaderLine('══════╣ Basic information ╠══════');
    expect(result).toEqual({ tier: 'major', title: 'Basic information' });
  });

  it('recognizes a sub-section header (opens with a box, no close)', () => {
    const result = classifyHeaderLine('╔══════╣ Sudo version');
    expect(result).toEqual({ tier: 'sub', title: 'Sudo version' });
  });

  it('does not classify an individual check line as a header', () => {
    expect(classifyHeaderLine('═╣ Is there anything mounted? ....')).toBeNull();
  });

  it('does not classify a bare box-border line as a header', () => {
    expect(classifyHeaderLine('══════════════════════════')).toBeNull();
  });

  it('does not classify a hacktricks-link-style footer as a header', () => {
    expect(classifyHeaderLine('╚ https://example.invalid/some-reference')).toBeNull();
  });

  it('falls back to a plaintext separator heuristic with no box characters', () => {
    expect(classifyHeaderLine('==== Users Information ====')).toEqual({ tier: 'sub', title: 'Users Information' });
  });

  it('returns null for an empty or whitespace-only line', () => {
    expect(classifyHeaderLine('')).toBeNull();
    expect(classifyHeaderLine('   ')).toBeNull();
  });
});

describe('parsePermissionString', () => {
  it('parses a standard SUID root binary', () => {
    const perm = parsePermissionString('-rwsr-xr-x');
    expect(perm).toMatchObject({ suid: true, sgid: false, ownerExec: true, otherWrite: false });
  });

  it('parses SGID and sticky bits', () => {
    expect(parsePermissionString('-rwxr-sr-x')!.sgid).toBe(true);
    expect(parsePermissionString('drwxrwxrwt')!.sticky).toBe(true);
  });

  it('returns null for a string that is not a permission string', () => {
    expect(parsePermissionString('hello world')).toBeNull();
  });
});

describe('parseIdString', () => {
  it('extracts uid/gid/groups from a standard `id` command line', () => {
    const parsed = parseIdString('uid=1000(alice) gid=1000(alice) groups=1000(alice),27(sudo),999(docker)');
    expect(parsed).toMatchObject({ uid: 1000, user: 'alice', gid: 1000, group: 'alice' });
    expect(parsed!.groups).toEqual([
      { gid: 1000, name: 'alice' },
      { gid: 27, name: 'sudo' },
      { gid: 999, name: 'docker' },
    ]);
  });

  it('returns null for unrelated text', () => {
    expect(parseIdString('nothing to see here')).toBeNull();
  });
});

describe('buildScan resilience', () => {
  it('handles an extremely large, repetitive input without throwing', () => {
    const bigInput = Array.from({ length: 20000 }, (_, i) => `line number ${i} with some filler text`).join('\n');
    const scan = buildScan(bigInput);
    expect(scan.totalLines).toBe(20000);
    expect(scan.sections).toHaveLength(1);
  });

  it('treats a completely unknown/unrecognized document as one preserved section', () => {
    const scan = buildScan('random text\nwith multiple lines\nand no structure whatsoever');
    expect(scan.sections).toHaveLength(1);
    expect(scan.sections[0].lines.length).toBe(3);
    expect(scan.diagnostics.some((d) => d.level === 'warning')).toBe(true);
  });

  it('handles partial/truncated-looking output gracefully', () => {
    const partial = '══════╣ Interesting Files ╠══════\n╔══════╣ SUID files\n-rwsr-xr-x 1 root root 100 Jan 1 2024 /usr/bin/f';
    const scan = buildScan(partial);
    expect(scan.sections[0].title).toBe('Interesting Files');
    expect(scan.diagnostics).toBeDefined();
  });
});
