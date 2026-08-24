import { parsePermissionString } from '@/lib/normalization/permissions';
import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

export const sshConfigRule: DetectionRule = {
  id: 'ssh-configuration',
  category: 'ssh',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const text = line.text.trim();

      const rootLogin = text.match(/^PermitRootLogin\s+(\S+)/i);
      if (rootLogin && /^(yes|without-password)$/i.test(rootLogin[1])) {
        drafts.push({
          title: 'SSH permits root login',
          category: 'ssh',
          severity: rootLogin[1].toLowerCase() === 'yes' ? 'high' : 'medium',
          confidence: 'confirmed',
          description: `sshd_config: PermitRootLogin ${rootLogin[1]}`,
          rationale: 'Allowing direct root SSH login expands the attack surface for credential-based attacks against the most privileged account.',
          evidenceLineIndexes: [line.index],
          tags: ['ssh'],
        });
      }

      const passwordAuth = text.match(/^PasswordAuthentication\s+(\S+)/i);
      if (passwordAuth && passwordAuth[1].toLowerCase() === 'yes') {
        drafts.push({
          title: 'SSH allows password authentication',
          category: 'ssh',
          severity: 'info',
          confidence: 'confirmed',
          description: 'sshd_config: PasswordAuthentication yes',
          rationale: 'Not a vulnerability by itself, but worth knowing when assessing credential-based attack paths (brute force, reused passwords).',
          evidenceLineIndexes: [line.index],
          tags: ['ssh'],
        });
      }

      // Private-key or authorized_keys files with weak permissions.
      const tokens = text.split(/\s+/);
      if (tokens.length >= 2 && /\.ssh\/(id_rsa|id_ecdsa|id_ed25519|authorized_keys)$/.test(tokens[tokens.length - 1])) {
        const perm = parsePermissionString(tokens[0]);
        if (perm && (perm.groupRead || perm.otherRead || perm.otherWrite)) {
          const path = tokens[tokens.length - 1];
          const isPrivateKey = !path.endsWith('authorized_keys');
          drafts.push({
            title: `Weak permissions on ${isPrivateKey ? 'SSH private key' : 'authorized_keys'}`,
            category: 'ssh',
            severity: perm.otherWrite ? 'critical' : 'high',
            confidence: 'confirmed',
            description: `${path} has permissions ${perm.raw}.`,
            rationale: isPrivateKey
              ? 'A private key readable by other users can be copied and used to authenticate as its owner elsewhere.'
              : 'A writable authorized_keys file lets an attacker add their own key and gain persistent SSH access as that user.',
            evidenceLineIndexes: [line.index],
            context: { path, permissions: perm.raw },
            tags: ['ssh', 'keys'],
          });
        }
      }
    }

    return drafts;
  },
};
