/**
 * Publicly documented binaries whose SUID/SGID bit or unrestricted sudo
 * grant is commonly abusable to escalate privileges (the class of technique
 * catalogued by projects like GTFOBins). Used only to raise confidence and
 * severity on an already-confirmed SUID/SGID/sudo signal — never as the
 * sole basis for a finding.
 */
export const HIGH_RISK_EXECUTABLES = new Set([
  'nmap',
  'vim',
  'vi',
  'nvim',
  'find',
  'bash',
  'sh',
  'zsh',
  'dash',
  'ash',
  'busybox',
  'more',
  'less',
  'nano',
  'cp',
  'mv',
  'awk',
  'gawk',
  'python',
  'python2',
  'python2.7',
  'python3',
  'perl',
  'ruby',
  'lua',
  'lua5.1',
  'php',
  'node',
  'tar',
  'zip',
  'unzip',
  'rsync',
  'scp',
  'ssh',
  'socat',
  'env',
  'systemctl',
  'docker',
  'gdb',
  'man',
  'tee',
  'xxd',
  'ftp',
  'curl',
  'wget',
  'openssl',
  'git',
  'make',
  'gcc',
  'cc',
  'pip',
  'pip3',
  'expect',
  'ansible-playbook',
  'chmod',
  'chown',
  'setfacl',
]);

/** Capability names that grant a near-total or full privilege escalation path. */
export const CRITICAL_CAPABILITIES = new Set([
  'cap_setuid',
  'cap_setgid',
  'cap_dac_override',
  'cap_dac_read_search',
  'cap_sys_admin',
  'cap_sys_ptrace',
  'cap_sys_module',
]);

export const HIGH_CAPABILITIES = new Set(['cap_sys_rawio', 'cap_chown', 'cap_fowner', 'cap_setfcap', 'cap_net_admin']);
