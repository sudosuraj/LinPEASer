/**
 * Resolved visual style for one ANSI SGR-styled run of text. Colors are
 * resolved to semantic palette tokens (see lib/parser/ansi/palette.ts)
 * rather than raw hex so the UI can theme them consistently.
 */
export interface AnsiStyle {
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  inverse?: boolean;
  fg?: string | null;
  bg?: string | null;
}

export interface AnsiSegment {
  text: string;
  style: AnsiStyle | null;
}

/**
 * Coarse, descriptive signals derived from a line's ANSI styling. These are
 * used only as corroborating input to the analysis engine, never as the
 * sole basis for a finding or its severity.
 */
export type LineSignal =
  | 'red-fg'
  | 'yellow-fg'
  | 'green-fg'
  | 'cyan-fg'
  | 'blue-fg'
  | 'magenta-fg'
  | 'critical-combo'
  | 'bold';

export interface RawLine {
  /** Zero-based index into the full, flattened document. */
  index: number;
  /** Original text of the line, ANSI escape sequences included. */
  raw: string;
  /** ANSI-stripped plain text, used for matching/search. */
  text: string;
  /** Styled runs for faithful rendering. */
  segments: AnsiSegment[];
  /** Color/style-derived descriptive signals present anywhere on the line. */
  signals: LineSignal[];
}
