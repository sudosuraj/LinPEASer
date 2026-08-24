/**
 * Parses a 10-character Unix permission string (as printed by `ls -l`,
 * `find -printf '%M'`, or `stat`), e.g. "-rwsr-xr-x", into structured flags.
 * Shared by every detector that needs to reason about SUID/SGID/sticky bits
 * or world-writability rather than re-deriving it from raw text.
 */
export interface ParsedPermissions {
  raw: string;
  fileType: string;
  ownerRead: boolean;
  ownerWrite: boolean;
  ownerExec: boolean;
  groupRead: boolean;
  groupWrite: boolean;
  groupExec: boolean;
  otherRead: boolean;
  otherWrite: boolean;
  otherExec: boolean;
  suid: boolean;
  sgid: boolean;
  sticky: boolean;
}

const PERMISSION_RE = /^([\-dlcbps])([r\-])([w\-])([xsS\-])([r\-])([w\-])([xsS\-])([r\-])([w\-])([xtT\-])/;

export function parsePermissionString(input: string): ParsedPermissions | null {
  const m = input.match(PERMISSION_RE);
  if (!m) return null;
  const [, fileType, ur, uw, ux, gr, gw, gx, or_, ow, ox] = m;

  return {
    raw: m[0],
    fileType,
    ownerRead: ur === 'r',
    ownerWrite: uw === 'w',
    ownerExec: ux === 'x' || ux === 's',
    groupRead: gr === 'r',
    groupWrite: gw === 'w',
    groupExec: gx === 'x' || gx === 's',
    otherRead: or_ === 'r',
    otherWrite: ow === 'w',
    otherExec: ox === 'x' || ox === 't',
    suid: ux === 's' || ux === 'S',
    sgid: gx === 's' || gx === 'S',
    sticky: ox === 't' || ox === 'T',
  };
}

export function isWorldWritable(perm: ParsedPermissions): boolean {
  return perm.otherWrite;
}

export function isGroupWritable(perm: ParsedPermissions): boolean {
  return perm.groupWrite;
}
