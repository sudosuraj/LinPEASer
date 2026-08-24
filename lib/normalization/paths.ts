/** Path fragments strongly associated with credentials or otherwise sensitive material. */
const SENSITIVE_PATH_PATTERNS: RegExp[] = [
  /\/etc\/shadow\b/,
  /\/etc\/passwd\b/,
  /\/etc\/gshadow\b/,
  /\/etc\/sudoers\b/,
  /id_rsa\b(?!\.pub)/,
  /id_ecdsa\b(?!\.pub)/,
  /id_ed25519\b(?!\.pub)/,
  /\.ssh\/authorized_keys\b/,
  /\.aws\/credentials\b/,
  /\.docker\/config\.json\b/,
  /\.kube\/config\b/,
  /\.git-credentials\b/,
  /\.npmrc\b/,
  /\.netrc\b/,
  /wp-config\.php\b/,
  /\.env\b/,
  /credentials\.json\b/,
  /\.bash_history\b/,
  /\.mysql_history\b/,
  /\.psql_history\b/,
];

export function isSensitivePath(path: string): boolean {
  return SENSITIVE_PATH_PATTERNS.some((re) => re.test(path));
}

export function basename(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : path;
}

/** Extracts a filesystem-looking path from a longer line of output, if any. */
export function extractPath(line: string): string | null {
  const m = line.match(/(\/(?:[\w.\-@+]+\/)*[\w.\-@+]+)/);
  return m ? m[1] : null;
}
