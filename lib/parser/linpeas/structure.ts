import type { ParseDiagnostic, RawLine, Section } from '@/types';
import { generateId } from '@/utils/id';
import { classifyHeaderLine } from './headers';
import { classifySectionTitle } from './titleLexicon';

const GENERAL_OUTPUT_TITLE = 'General Output';

function createSection(params: {
  title: string;
  level: number;
  parent: Section | null;
  startLine: number;
  isUnrecognized: boolean;
}): Section {
  const { title, level, parent, startLine, isUnrecognized } = params;
  return {
    id: generateId('section'),
    title,
    level,
    kind: level === 0 && title === GENERAL_OUTPUT_TITLE ? 'other' : classifySectionTitle(title),
    parentId: parent ? parent.id : null,
    path: parent ? [...parent.path, title] : [title],
    startLine,
    endLine: startLine,
    lines: [],
    subsections: [],
    findingIds: [],
    isUnrecognized,
  };
}

export interface StructureResult {
  sections: Section[];
  diagnostics: ParseDiagnostic[];
}

/**
 * Builds the section/subsection tree from classified header lines using a
 * simple stack: a major header closes every open section and starts a new
 * root; a sub header closes back to the nearest major (or root) and opens a
 * child of it. Everything else is appended as content to whichever section
 * is currently open — or to a synthetic "General Output" root when nothing
 * is open yet, so content is never silently discarded.
 */
export function buildSectionTree(lines: RawLine[]): StructureResult {
  const roots: Section[] = [];
  const stack: Section[] = [];
  const diagnostics: ParseDiagnostic[] = [];
  let generalOutput: Section | null = null;
  let recognizedHeaders = 0;
  let unrecognizedHeaders = 0;

  const currentTarget = (lineIndex: number): Section => {
    if (stack.length > 0) return stack[stack.length - 1];
    if (!generalOutput) {
      generalOutput = createSection({
        title: GENERAL_OUTPUT_TITLE,
        level: 0,
        parent: null,
        startLine: lineIndex,
        isUnrecognized: false,
      });
      roots.push(generalOutput);
    }
    return generalOutput;
  };

  for (const line of lines) {
    const match = classifyHeaderLine(line.text);

    if (!match) {
      currentTarget(line.index).lines.push(line);
      continue;
    }

    if (match.tier === 'major') {
      stack.length = 0;
      const section = createSection({
        title: match.title,
        level: 0,
        parent: null,
        startLine: line.index,
        isUnrecognized: false,
      });
      section.isUnrecognized = section.kind === 'unknown';
      if (section.isUnrecognized) unrecognizedHeaders++;
      else recognizedHeaders++;
      roots.push(section);
      stack.push(section);
      continue;
    }

    // Sub header: pop back to a major section (level 0) or the root before
    // attaching, so consecutive sub headers become siblings rather than
    // nesting indefinitely.
    while (stack.length > 0 && stack[stack.length - 1].level > 0) {
      stack.pop();
    }
    const parent = stack.length > 0 ? stack[stack.length - 1] : null;
    const section = createSection({
      title: match.title,
      level: parent ? parent.level + 1 : 0,
      parent,
      startLine: line.index,
      isUnrecognized: false,
    });
    section.isUnrecognized = section.kind === 'unknown';
    if (section.isUnrecognized) unrecognizedHeaders++;
    else recognizedHeaders++;

    if (parent) parent.subsections.push(section);
    else roots.push(section);
    stack.push(section);
  }

  finalizeEndLines(roots);

  if (roots.length === 0) {
    diagnostics.push({
      level: 'warning',
      message: 'No LinPEAS section headers were detected. The full input was preserved as unstructured content.',
    });
  } else if (recognizedHeaders === 0) {
    diagnostics.push({
      level: 'warning',
      message: 'Section headers were detected but none matched a known LinPEAS section — this may be an unfamiliar version or format.',
    });
  }
  if (unrecognizedHeaders > 0) {
    diagnostics.push({
      level: 'info',
      message: `${unrecognizedHeaders} section${unrecognizedHeaders === 1 ? '' : 's'} used a title LinPEASer didn't recognize; content was preserved and is still fully browsable.`,
    });
  }

  return { sections: roots, diagnostics };
}

function finalizeEndLines(sections: Section[]): number {
  let max = -1;
  for (const section of sections) {
    let sectionMax = section.startLine;
    if (section.lines.length > 0) {
      sectionMax = Math.max(sectionMax, section.lines[section.lines.length - 1].index);
    }
    if (section.subsections.length > 0) {
      sectionMax = Math.max(sectionMax, finalizeEndLines(section.subsections));
    }
    section.endLine = sectionMax;
    max = Math.max(max, sectionMax);
  }
  return max;
}

/** Depth-first flattening, used by search, stats, and evidence lookups. */
export function flattenSections(sections: Section[]): Section[] {
  const out: Section[] = [];
  const walk = (list: Section[]) => {
    for (const s of list) {
      out.push(s);
      if (s.subsections.length > 0) walk(s.subsections);
    }
  };
  walk(sections);
  return out;
}

/** Finds the most specific (deepest) section containing a given line index. */
export function findSectionForLine(sections: Section[], lineIndex: number): Section | null {
  for (const section of sections) {
    if (lineIndex >= section.startLine && lineIndex <= section.endLine) {
      const child = findSectionForLine(section.subsections, lineIndex);
      return child ?? section;
    }
  }
  return null;
}
