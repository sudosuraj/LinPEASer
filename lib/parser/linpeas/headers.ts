/**
 * Structural header detection.
 *
 * Rather than matching one exact ANSI-coded template (which breaks the
 * moment a version, theme, or capture method changes the color codes), this
 * classifies headers purely from the shape of the *plain* (ANSI-stripped)
 * text: the density and arrangement of box-drawing characters around a
 * short label. That makes it agnostic to which SGR codes wrap the title,
 * and it degrades gracefully to a plaintext separator heuristic when no box
 * characters are present at all (manually copied output, reformatted logs).
 */

const BOX_CHARS = '═╔╗╚╝╠╣╦╩╬─│┌┐└┘├┤┬┴┼━┃';
const BOX_CHAR_SET = new Set(BOX_CHARS.split(''));

export type HeaderTier = 'major' | 'sub';

export interface HeaderMatch {
  tier: HeaderTier;
  title: string;
}

function cleanTitle(raw: string): string | null {
  const title = raw.replace(new RegExp(`[${BOX_CHARS}]`, 'g'), '').trim();
  if (!title || title.length > 120) return null;
  return title;
}

function isPureDecoration(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  for (const ch of trimmed) {
    if (!BOX_CHAR_SET.has(ch) && ch !== ' ') return false;
  }
  return true;
}

const PLAINTEXT_SEPARATOR_RE = /^[=\-_*#~]{3,}\s*(.+?)\s*[=\-_*#~]{3,}$/;

/**
 * Classifies one ANSI-stripped line. Returns null for ordinary content,
 * individual "check" lines (which share box characters with real headers
 * but never *open* a box), and pure decoration/border lines.
 */
export function classifyHeaderLine(text: string): HeaderMatch | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (isPureDecoration(trimmed)) return null;

  // Sub-section: opens a box ("╔══...╣ Title") but does not close it on the
  // same line. This is LinPEAS's per-check-group header.
  if (trimmed.startsWith('╔')) {
    const marker = trimmed.indexOf('╣');
    if (marker !== -1) {
      const title = cleanTitle(trimmed.slice(marker + 1));
      if (title) return { tier: 'sub', title };
    }
    return null;
  }

  // Major/category section: both opens and closes a box on the same line
  // ("═══╣ Title ╠═══"), used for LinPEAS's top-level category banners.
  const openIdx = trimmed.indexOf('╣');
  const closeIdx = trimmed.lastIndexOf('╠');
  if (openIdx !== -1 && closeIdx !== -1 && closeIdx > openIdx) {
    const title = cleanTitle(trimmed.slice(openIdx + 1, closeIdx));
    if (title) return { tier: 'major', title };
  }

  // A leading "╚" marks a link/footer line (e.g. a hacktricks URL) that
  // belongs to the section above it, never a header of its own.
  if (trimmed.startsWith('╚')) return null;

  // A bare "═╣ Question? ..." (no leading ╔, no closing ╠) is an individual
  // check line, not a header — leave it as content.
  if (openIdx !== -1 && closeIdx === -1) return null;

  // Plaintext fallback for output with no box-drawing characters at all.
  const plain = trimmed.match(PLAINTEXT_SEPARATOR_RE);
  if (plain) {
    const title = plain[1].trim();
    if (title && title.length <= 120) return { tier: 'sub', title };
  }

  return null;
}
