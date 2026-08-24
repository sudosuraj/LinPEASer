import type { EnumerationParser } from './types';
import { linpeasParser } from './linpeas';

const registeredParsers: EnumerationParser[] = [linpeasParser];

export function getRegisteredParsers(): EnumerationParser[] {
  return registeredParsers;
}

/** Picks the best-matching registered parser for a given input. */
export function selectParser(input: string): EnumerationParser {
  let best = registeredParsers[0];
  let bestScore = -1;
  for (const parser of registeredParsers) {
    const score = parser.detect(input);
    if (score > bestScore) {
      bestScore = score;
      best = parser;
    }
  }
  return best;
}
