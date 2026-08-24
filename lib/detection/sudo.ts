import { HIGH_RISK_EXECUTABLES } from './knownBinaries';
import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

const FULL_SUDO_RE = /\(ALL\s*:?\s*ALL\)\s*ALL/i;
const NOPASSWD_RE = /NOPASSWD\s*:\s*(.+)$/i;
const ENV_KEEP_RE = /env_keep\s*\+?=.*?(LD_PRELOAD|LD_LIBRARY_PATH)/i;
const SETENV_RE = /\bSETENV\b/;

export const sudoConfigRule: DetectionRule = {
  id: 'sudo-configuration',
  category: 'sudo',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];
    const inSudoContext = (t: string) => /sudo/i.test(t);

    for (const line of ctx.allLines) {
      const text = line.text.trim();
      if (!text) continue;

      if (FULL_SUDO_RE.test(text)) {
        drafts.push({
          title: 'Unrestricted sudo access',
          category: 'sudo',
          severity: 'critical',
          confidence: 'confirmed',
          description: `sudo permits running any command as any user: "${text}"`,
          rationale: 'A full "(ALL : ALL) ALL" grant means this user can become root with a single sudo command.',
          evidenceLineIndexes: [line.index],
          tags: ['sudo', 'full-access'],
        });
        continue;
      }

      const nopasswd = text.match(NOPASSWD_RE);
      if (nopasswd) {
        const commandList = nopasswd[1];
        const knownRisky = Array.from(HIGH_RISK_EXECUTABLES).find((bin) => commandList.includes(`/${bin}`) || commandList.trim() === bin);
        drafts.push({
          title: 'Passwordless sudo command',
          category: 'sudo',
          severity: knownRisky ? 'critical' : 'high',
          confidence: knownRisky ? 'confirmed' : 'probable',
          description: `NOPASSWD sudo entry: ${commandList}`,
          rationale: knownRisky
            ? `${knownRisky} is commonly documented as abusable to break out to a root shell when it can be run via sudo without a password.`
            : 'Commands runnable via sudo without a password are worth reviewing for ways to read/write arbitrary files or spawn a shell as the target user.',
          evidenceLineIndexes: [line.index],
          tags: ['sudo', 'nopasswd'],
        });
        continue;
      }

      if (inSudoContext(text) && (ENV_KEEP_RE.test(text) || SETENV_RE.test(text))) {
        drafts.push({
          title: 'sudo preserves a dangerous environment variable',
          category: 'sudo',
          severity: 'high',
          confidence: 'probable',
          description: `sudoers configuration line: ${text}`,
          rationale: 'Preserving LD_PRELOAD/LD_LIBRARY_PATH (or allowing SETENV) across a sudo invocation often lets a user inject code that runs with the target user\'s privileges.',
          evidenceLineIndexes: [line.index],
          tags: ['sudo', 'env-preservation'],
        });
      }
    }

    return drafts;
  },
};
