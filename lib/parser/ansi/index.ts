import type { RawLine } from '@/types';
import { createInitialSgrState, styleLine } from './style';

export { tokenizeAnsi } from './tokenizer';
export { stripAnsiToPlainText } from './strip';

/**
 * Splits a full document into lines and resolves ANSI styling for each one,
 * carrying color state across line boundaries the way a real terminal
 * would. This is the resilient foundation the rest of the parser builds on:
 * even content the structural parser can't classify still comes out as
 * well-formed RawLine objects with text, styling, and derived signals.
 */
export function buildRawLines(fullText: string): RawLine[] {
  const rawLines = fullText.split(/\r\n|\r|\n/);
  let state = createInitialSgrState();

  return rawLines.map((raw, index) => {
    const styled = styleLine(raw, state);
    state = styled.endState;
    return {
      index,
      raw,
      text: styled.text,
      segments: styled.segments,
      signals: styled.signals,
    };
  });
}
