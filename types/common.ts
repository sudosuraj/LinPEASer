/**
 * Severity and confidence scales shared across the parser, analysis engine,
 * and UI. Ordered from most to least urgent so array position can double as
 * a sort key.
 */
export const SEVERITIES = [
  'critical',
  'high',
  'medium',
  'low',
  'interesting',
  'info',
] as const;

export type Severity = (typeof SEVERITIES)[number];

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  interesting: 1,
  info: 0,
};

/**
 * How sure the analysis engine is about a finding. Deliberately distinct
 * wording from Severity so "high severity, low confidence" reads unambiguously.
 */
export const CONFIDENCE_LEVELS = ['confirmed', 'probable', 'possible'] as const;

export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export const CONFIDENCE_WEIGHT: Record<Confidence, number> = {
  confirmed: 2,
  probable: 1,
  possible: 0,
};

export const FINDING_CATEGORIES = [
  'suid-sgid',
  'capabilities',
  'cron',
  'writable',
  'path-hijack',
  'sudo',
  'ssh',
  'credentials',
  'kernel',
  'containers',
  'nfs',
  'mounts',
  'users-groups',
  'services',
  'processes',
  'environment',
  'network',
  'sensitive-files',
  'authentication',
  'software',
  'permissions',
  'other',
] as const;

export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

export const FINDING_CATEGORY_LABELS: Record<FindingCategory, string> = {
  'suid-sgid': 'SUID / SGID',
  capabilities: 'Capabilities',
  cron: 'Scheduled Tasks',
  writable: 'Writable Files & Directories',
  'path-hijack': 'PATH Hijacking',
  sudo: 'Sudo Configuration',
  ssh: 'SSH Configuration',
  credentials: 'Credentials & Secrets',
  kernel: 'Kernel & System',
  containers: 'Containers',
  nfs: 'NFS',
  mounts: 'Mounts & Filesystems',
  'users-groups': 'Users & Groups',
  services: 'Services',
  processes: 'Processes',
  environment: 'Environment Variables',
  network: 'Network',
  'sensitive-files': 'Sensitive Files',
  authentication: 'Authentication',
  software: 'Software & Versions',
  permissions: 'Permissions',
  other: 'Other',
};

/**
 * Semantic classification of a LinPEAS section, independent of the exact
 * title text a given version prints. Drives sidebar grouping and lets
 * detection rules target relevant sections without hardcoding titles.
 */
export const SECTION_KINDS = [
  'system-info',
  'users-groups',
  'sudo',
  'suid-sgid',
  'capabilities',
  'cron',
  'processes',
  'services',
  'network',
  'files-permissions',
  'credentials',
  'containers',
  'kernel',
  'interesting-files',
  'software',
  'mounts',
  'ssh',
  'environment',
  'cloud',
  'exploits',
  'other',
  'unknown',
] as const;

export type SectionKind = (typeof SECTION_KINDS)[number];

export const SECTION_KIND_LABELS: Record<SectionKind, string> = {
  'system-info': 'System Information',
  'users-groups': 'Users & Groups',
  sudo: 'Sudo',
  'suid-sgid': 'SUID / SGID',
  capabilities: 'Capabilities',
  cron: 'Cron & Scheduled Tasks',
  processes: 'Processes',
  services: 'Services',
  network: 'Network',
  'files-permissions': 'Files & Permissions',
  credentials: 'Credentials',
  containers: 'Containers',
  kernel: 'Kernel',
  'interesting-files': 'Interesting Files',
  software: 'Software',
  mounts: 'Mounts & Filesystems',
  ssh: 'SSH',
  environment: 'Environment',
  cloud: 'Cloud',
  exploits: 'Exploits',
  other: 'Other',
  unknown: 'Unrecognized',
};
