import type { SectionKind } from './common';
import type { RawLine } from './ansi';

export interface Section {
  id: string;
  title: string;
  /** 0 = top-level category, 1 = subsection, 2+ = nested check. */
  level: number;
  kind: SectionKind;
  parentId: string | null;
  /** Titles from the root section down to and including this one. */
  path: string[];
  startLine: number;
  endLine: number;
  /** Content lines owned directly by this section (not by a child). */
  lines: RawLine[];
  subsections: Section[];
  /** Ids into Scan.findings whose evidence originates in this section. */
  findingIds: string[];
  /**
   * True when the section header was detected structurally (box-drawing +
   * label) but its title did not match any known LinPEAS section lexicon
   * entry. The content is preserved and still fully navigable/searchable.
   */
  isUnrecognized: boolean;
}
