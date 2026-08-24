/**
 * Low-level ANSI escape sequence tokenizer. Operates on a single line of
 * text and yields an ordered stream of SGR (color/style) tokens and plain
 * text runs.
 *
 * Designed to never throw and never infinite-loop: every branch advances
 * the scan cursor, and anything that isn't a well-formed, fully-terminated
 * sequence is dropped as inert noise (the escape byte is discarded, the
 * rest of the line is scanned normally as text). This is what lets the
 * parser stay resilient against malformed or truncated ANSI captured from
 * different terminals/tools.
 */

export interface SgrToken {
  type: 'sgr';
  codes: number[];
}

export interface TextToken {
  type: 'text';
  value: string;
}

export type AnsiToken = SgrToken | TextToken;

const ESC = '\x1b';

export function tokenizeAnsi(line: string): AnsiToken[] {
  const tokens: AnsiToken[] = [];
  let i = 0;
  let textBuf = '';

  const flushText = () => {
    if (textBuf.length > 0) {
      tokens.push({ type: 'text', value: textBuf });
      textBuf = '';
    }
  };

  while (i < line.length) {
    const ch = line[i];

    if (ch !== ESC) {
      textBuf += ch;
      i++;
      continue;
    }

    // CSI sequence: ESC [ params final-byte
    if (line[i + 1] === '[') {
      let j = i + 2;
      let params = '';
      while (j < line.length && /[0-9;?]/.test(line[j])) {
        params += line[j];
        j++;
      }
      const finalByte = line[j];
      if (finalByte && /[A-Za-z]/.test(finalByte)) {
        if (finalByte === 'm') {
          flushText();
          const codes = params.length
            ? params
                .split(';')
                .filter((p) => p !== '?')
                .map((p) => (p === '' ? 0 : parseInt(p, 10)))
            : [0];
          tokens.push({ type: 'sgr', codes });
        }
        // Any other CSI final byte (cursor movement, erase-line, etc.) carries
        // no color/style information for our purposes — consumed silently.
        i = j + 1;
        continue;
      }
      // Unterminated/malformed CSI: drop just the escape byte and keep scanning
      // so the following characters (e.g. a literal "[") are preserved as text.
      i += 1;
      continue;
    }

    // OSC sequence: ESC ] ... (BEL | ESC \)
    if (line[i + 1] === ']') {
      let j = i + 2;
      while (j < line.length && line[j] !== '\x07' && !(line[j] === ESC && line[j + 1] === '\\')) {
        j++;
      }
      if (line[j] === '\x07') {
        i = j + 1;
      } else if (line[j] === ESC) {
        i = j + 2;
      } else {
        // Ran off the end of the line without a terminator — drop the rest.
        i = line.length;
      }
      continue;
    }

    // Bare/unrecognized escape byte: drop it and continue.
    i += 1;
  }

  flushText();
  return tokens;
}
