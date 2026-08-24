import type { AnsiSegment, AnsiStyle, LineSignal } from '@/types';
import type { AnsiToken } from './tokenizer';
import { tokenizeAnsi } from './tokenizer';
import {
  isBlueFamily,
  isCyanFamily,
  isGreenFamily,
  isMagentaFamily,
  isRedFamily,
  isWhiteFamily,
  isYellowFamily,
  resolveAnsiColorVar,
} from './palette';

interface SgrState {
  bold: boolean;
  dim: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  inverse: boolean;
  /** Normalized to the 30-37 / 90-97 code space for both fg and bg. */
  fgCode: number | null;
  bgCode: number | null;
}

export function createInitialSgrState(): SgrState {
  return {
    bold: false,
    dim: false,
    italic: false,
    underline: false,
    strikethrough: false,
    inverse: false,
    fgCode: null,
    bgCode: null,
  };
}

/** Applies a batch of SGR codes (one `ESC[...m` sequence) to a running state. */
export function applySgrCodes(state: SgrState, codes: number[]): SgrState {
  const next: SgrState = { ...state };

  for (let idx = 0; idx < codes.length; idx++) {
    const code = codes[idx];

    if (code === 0) {
      Object.assign(next, createInitialSgrState());
    } else if (code === 1) {
      next.bold = true;
    } else if (code === 2) {
      next.dim = true;
    } else if (code === 3) {
      next.italic = true;
    } else if (code === 4) {
      next.underline = true;
    } else if (code === 7) {
      next.inverse = true;
    } else if (code === 9) {
      next.strikethrough = true;
    } else if (code === 22) {
      next.bold = false;
      next.dim = false;
    } else if (code === 23) {
      next.italic = false;
    } else if (code === 24) {
      next.underline = false;
    } else if (code === 27) {
      next.inverse = false;
    } else if (code === 29) {
      next.strikethrough = false;
    } else if (code >= 30 && code <= 37) {
      next.fgCode = code;
    } else if (code === 38) {
      // Extended foreground: 38;5;N (256-color) or 38;2;r;g;b (truecolor).
      // We can't map these to the semantic palette faithfully, so the
      // channel is marked "colored" (-1) without a specific hue rather than
      // guessing — resolveAnsiColorVar returns null for it.
      const mode = codes[idx + 1];
      if (mode === 5) {
        idx += 2;
      } else if (mode === 2) {
        idx += 4;
      }
      next.fgCode = -1;
    } else if (code === 39) {
      next.fgCode = null;
    } else if (code >= 40 && code <= 47) {
      next.bgCode = code - 10;
    } else if (code === 48) {
      const mode = codes[idx + 1];
      if (mode === 5) {
        idx += 2;
      } else if (mode === 2) {
        idx += 4;
      }
      next.bgCode = -1;
    } else if (code === 49) {
      next.bgCode = null;
    } else if (code >= 90 && code <= 97) {
      next.fgCode = code;
    } else if (code >= 100 && code <= 107) {
      next.bgCode = code - 10;
    }
    // Any other/unknown SGR code is ignored gracefully.
  }

  return next;
}

function toAnsiStyle(state: SgrState): AnsiStyle | null {
  const fg = state.fgCode !== null && state.fgCode >= 0 ? resolveAnsiColorVar(state.fgCode) : null;
  const bg = state.bgCode !== null && state.bgCode >= 0 ? resolveAnsiColorVar(state.bgCode) : null;

  if (!state.bold && !state.dim && !state.italic && !state.underline && !state.strikethrough && !state.inverse && !fg && !bg) {
    return null;
  }

  const style: AnsiStyle = {};
  if (state.bold) style.bold = true;
  if (state.dim) style.dim = true;
  if (state.italic) style.italic = true;
  if (state.underline) style.underline = true;
  if (state.strikethrough) style.strikethrough = true;
  if (state.inverse) style.inverse = true;
  if (fg) style.fg = fg;
  if (bg) style.bg = bg;
  return style;
}

function deriveSegmentSignals(state: SgrState, signals: Set<LineSignal>): void {
  const { fgCode, bgCode } = state;

  const bgIsRed = isRedFamily(bgCode);
  const bgIsYellow = isYellowFamily(bgCode);
  const fgOnCriticalBg =
    (bgIsRed && (isYellowFamily(fgCode) || isWhiteFamily(fgCode))) ||
    (bgIsYellow && isRedFamily(fgCode));

  if (fgOnCriticalBg) {
    signals.add('critical-combo');
    return; // the combo signal supersedes plain fg color signals for this run
  }

  if (isRedFamily(fgCode)) signals.add('red-fg');
  if (isYellowFamily(fgCode)) signals.add('yellow-fg');
  if (isGreenFamily(fgCode)) signals.add('green-fg');
  if (isCyanFamily(fgCode)) signals.add('cyan-fg');
  if (isBlueFamily(fgCode)) signals.add('blue-fg');
  if (isMagentaFamily(fgCode)) signals.add('magenta-fg');
  if (state.bold) signals.add('bold');
}

export interface StyledLine {
  text: string;
  segments: AnsiSegment[];
  signals: LineSignal[];
  /** The running SGR state after this line, to seed the next line's scan. */
  endState: SgrState;
}

/**
 * Converts one raw (possibly ANSI-styled) line into plain text plus styled
 * segments, carrying color state in from — and back out to — the caller so
 * styles that span multiple lines (never explicitly reset) render correctly.
 */
export function styleLine(rawLine: string, startState: SgrState): StyledLine {
  const tokens: AnsiToken[] = tokenizeAnsi(rawLine);
  let state = startState;
  let text = '';
  const segments: AnsiSegment[] = [];
  const signals = new Set<LineSignal>();

  for (const token of tokens) {
    if (token.type === 'sgr') {
      state = applySgrCodes(state, token.codes);
    } else if (token.value.length > 0) {
      text += token.value;
      segments.push({ text: token.value, style: toAnsiStyle(state) });
      deriveSegmentSignals(state, signals);
    }
  }

  return { text, segments, signals: Array.from(signals), endState: state };
}
