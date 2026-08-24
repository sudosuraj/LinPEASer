import { tokenizeAnsi } from './tokenizer';

/** Strips all ANSI escape sequences from a string, returning plain text. */
export function stripAnsiToPlainText(input: string): string {
  return input
    .split(/\r\n|\r|\n/)
    .map((line) =>
      tokenizeAnsi(line)
        .filter((t) => t.type === 'text')
        .map((t) => t.value)
        .join('')
    )
    .join('\n');
}
