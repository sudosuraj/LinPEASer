/** Strips a leading UTF-8 BOM, if present, without touching anything else. */
export function stripBom(input: string): string {
  return input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
}

/**
 * Best-effort check for binary content masquerading as text (a screenshot,
 * a compiled binary, etc. dropped into the upload box). Sampling avoids
 * scanning the whole file for very large inputs.
 */
export function looksLikeBinary(input: string): boolean {
  const sample = input.slice(0, 8000);
  if (sample.length === 0) return false;
  let suspicious = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    if (code === 0) return true; // NUL bytes essentially never appear in real text captures
    const isControl = code < 32 && code !== 9 && code !== 10 && code !== 13 && code !== 27;
    if (isControl) suspicious++;
  }
  return suspicious / sample.length > 0.05;
}
