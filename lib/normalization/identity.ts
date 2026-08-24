export interface ParsedIdentity {
  uid: number;
  user: string;
  gid: number;
  group: string;
  groups: { gid: number; name: string }[];
}

const ID_RE = /uid=(\d+)\(([^)]+)\)\s+gid=(\d+)\(([^)]+)\)(?:\s+groups=([^\n]+))?/;

export function parseIdString(text: string): ParsedIdentity | null {
  const m = text.match(ID_RE);
  if (!m) return null;
  const [, uid, user, gid, group, groupsRaw] = m;

  const groups: { gid: number; name: string }[] = [];
  if (groupsRaw) {
    const groupRe = /(\d+)\(([^)]+)\)/g;
    let gm: RegExpExecArray | null;
    while ((gm = groupRe.exec(groupsRaw))) {
      groups.push({ gid: Number(gm[1]), name: gm[2] });
    }
  }

  return { uid: Number(uid), user, gid: Number(gid), group, groups };
}
