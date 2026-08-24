/**
 * Maps standard ANSI SGR color codes (30-37 normal, 90-97 bright — bg codes
 * are normalized to this same numeric space before lookup, see style.ts) to
 * semantic CSS custom properties defined in app/globals.css. Keeping this as
 * a data table, rather than baking colors into components, is what lets the
 * whole app re-theme the ANSI palette in one place.
 */
export const ANSI_COLOR_NAMES: Record<number, string> = {
  30: 'black',
  31: 'red',
  32: 'green',
  33: 'yellow',
  34: 'blue',
  35: 'magenta',
  36: 'cyan',
  37: 'white',
  90: 'bright-black',
  91: 'bright-red',
  92: 'bright-green',
  93: 'bright-yellow',
  94: 'bright-blue',
  95: 'bright-magenta',
  96: 'bright-cyan',
  97: 'bright-white',
};

export function resolveAnsiColorVar(code: number | null): string | null {
  if (code === null) return null;
  const name = ANSI_COLOR_NAMES[code];
  if (!name) return null;
  return `var(--ansi-${name})`;
}

export function isRedFamily(code: number | null): boolean {
  return code === 31 || code === 91;
}

export function isYellowFamily(code: number | null): boolean {
  return code === 33 || code === 93;
}

export function isGreenFamily(code: number | null): boolean {
  return code === 32 || code === 92;
}

export function isCyanFamily(code: number | null): boolean {
  return code === 36 || code === 96;
}

export function isBlueFamily(code: number | null): boolean {
  return code === 34 || code === 94;
}

export function isMagentaFamily(code: number | null): boolean {
  return code === 35 || code === 95;
}

export function isWhiteFamily(code: number | null): boolean {
  return code === 37 || code === 97;
}
