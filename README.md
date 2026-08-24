# LinPEASer

LinPEASer is a browser-based console for turning raw LinPEAS output into
organized, prioritized privilege-escalation intelligence. Paste or upload a
scan, and it parses the terminal output into its real section hierarchy,
runs a deterministic analysis engine over it, and gives you a searchable,
filterable report — sections, findings, and the full original output, all
navigable from one interface.

Every scan you parse becomes a **session**, stored locally in your browser
(IndexedDB) so you can come back to it later, rename it, export it, or
compare it against other targets. Nothing about a scan — its raw output,
its parsed structure, or its findings — is ever sent anywhere. LinPEASer is
a static application: the server only ships the app itself.

## Features

- **Paste or upload** a LinPEAS `.txt` capture; parsing runs in a Web
  Worker so large outputs never freeze the UI.
- **Structural parsing**, not regex soup: a proper section/subsection
  hierarchy, ANSI color resolution, and metadata extraction, all resilient
  to different LinPEAS versions, missing sections, and malformed input.
- **Deterministic finding analysis** — around thirty detection rules
  covering SUID/SGID, capabilities, cron (including wildcard-injection-
  vulnerable commands run against a bare glob), writable files and
  directories, sudo (including version-range checks for landmark CVEs like
  Baron Samedit), SSH, credentials (private keys, cloud/SaaS API key
  formats, JWTs), PATH hijacking, kernel/exploit hints, containers, NFS,
  mounts, users/groups, services, processes, environment variables, network
  exposure, sensitive files (including an exposed root home directory), and
  PAM/authentication misconfiguration — each with an explicit severity and
  confidence rating. Color is used only as weak corroborating evidence,
  never as the basis for a rating.
- **Session management** — every parsed scan is saved locally with derived
  metadata (host, OS, user, finding counts). Rename, duplicate, export,
  import, or delete sessions individually or in bulk.
- **Instant search** — a Cmd/Ctrl+K (or `/`) command palette searches
  sections, findings, and raw output at once, with match highlighting.
- **Overview dashboard** with severity breakdowns, findings-by-category,
  highest-risk areas, and a dedicated privilege-escalation-candidates panel.
- **Findings panel** with severity/category/confidence filtering, search,
  and sorting.
- **Raw output view** with faithful ANSI-color rendering, search with
  match highlighting, line-wrap toggle, jump-to-line, and copy.
- **Export** — parsed JSON, original raw output, a print-friendly report,
  and full session export/import for moving data between browsers.
- **Everything stays local.** No backend, no analytics, no third-party
  requests for scan content.

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm run start
```

### Test

```bash
npm test
```

### Lint & typecheck

```bash
npm run lint
npx tsc --noEmit
```

## Deploying to Vercel

LinPEASer has no server-side data dependencies — `next build` produces a
fully static page. Push the repository to a Git provider, import it in
Vercel, and deploy with the default Next.js settings. No environment
variables or backend services are required.

## Architecture

```
Browser
  ↓
Parser (lib/parser)       — structure, ANSI, metadata
  ↓
Analysis (lib/detection + lib/analysis) — findings, severity, stats
  ↓
Session storage (lib/storage) — IndexedDB, entirely local
  ↓
Interactive report (app, components, features)
```

```
app/            Next.js App Router entry point and global styles
components/     Generic UI primitives, badges, and layout chrome
features/       Feature-scoped UI: upload, sessions, report, findings,
                sections, terminal, search, export
lib/
  parser/       Format-agnostic parser interface + the LinPEAS parser
    ansi/       ANSI tokenizer, styling, and semantic color palette
    linpeas/    Header/section detection, metadata extraction, title lexicon
  normalization/  Shared low-level extractors (permission strings, uid/gid,
                  sockets, paths) reused across detection rules
  detection/    One module per signal family; each exports a rule that
                turns normalized facts into finding drafts
  analysis/     Runs detection rules, scores/dedupes findings, computes
                overview statistics
  storage/      IndexedDB-backed session storage, versioned schema,
                import/export validation
  store/        Client-side state (Zustand): current scan, UI
                preferences, navigation
  worker/       Web Worker wrapper so parsing/analysis never blocks the UI
types/          Shared TypeScript data model
utils/          Small framework-agnostic helpers
tests/          Vitest unit tests and fixtures
```

### Parser architecture

The parser is not one large regex. It is a small pipeline of independently
testable stages:

1. **Preprocessing** — BOM stripping, binary-content sniffing.
2. **ANSI resolution** (`lib/parser/ansi`) — a hand-written tokenizer scans
   each line for SGR escape sequences (and safely discards other/malformed
   control sequences) and resolves running color state across line
   boundaries, the way a real terminal would.
3. **Structural detection** (`lib/parser/linpeas/headers.ts`) — section
   headers are recognized from the *shape* of the plain text (box-drawing
   character density and arrangement around a label), not from one exact
   ANSI-coded template. This is what lets the same code handle different
   LinPEAS versions, different themes, and manually copied/reformatted
   output — down to a plaintext-separator fallback when no box characters
   are present at all.
4. **Hierarchy assembly** — a stack-based builder turns classified header
   lines into a tree of sections and subsections. Unrecognized headers
   still become sections (flagged `isUnrecognized`) instead of being
   dropped, and content with no headers at all is preserved as a single
   "General Output" section — nothing is silently discarded.
5. **Metadata extraction** — best-effort, independent extractors for
   hostname, OS, kernel version, current user/root status, and more, each
   degrading gracefully when a signal isn't present.

A title lexicon (`lib/parser/linpeas/titleLexicon.ts`) maps recognized
section titles to a semantic `SectionKind` used for sidebar grouping and
rule targeting. Supporting a new or renamed section in a future LinPEAS
release is a one-line addition to that table — no parser code changes.

### Finding analysis

Detection is deliberately separate from parsing. Each file under
`lib/detection/` normalizes a category of signal (permission strings via
`lib/normalization/permissions.ts`, identity strings, sockets, sensitive
paths) into structured facts, then emits finding drafts with an explicit
severity and confidence. A curated, publicly-documented list of
commonly-abusable SUID/sudo binaries (in the spirit of GTFOBins) is used
only to raise confidence and severity on an *already-confirmed* structural
signal — never to invent a finding from nothing. The one exception is a
narrow safety-net rule that surfaces LinPEAS's own strongest color flag
(a red/yellow combination) as a low-confidence, low-severity finding when
no structural rule already explained the line — explicitly tagged and
never used to justify a high-severity rating on its own.

### Extensibility

LinPEASer is built against a `EnumerationParser` interface
(`lib/parser/types.ts`), not directly against the LinPEAS parser. A future
input format registers itself in `lib/parser/registry.ts` and the rest of
the app — analysis, storage, and UI — works unchanged.

## Privacy model

- Parsing, analysis, and rendering all happen in the browser.
- Sessions are stored in IndexedDB, scoped to the browser profile that
  created them. Nothing is written to a server or third-party service.
- Only two UI preferences (sidebar collapsed state, line-wrap) are kept in
  `localStorage`; scan content is never written there.
- Session export produces a plain JSON file you control; import validates
  every field against the expected schema before anything is written to
  storage or rendered, and only ever calls `JSON.parse` — imported content
  is never evaluated or executed.
- All scan content — including attacker-controlled strings in the original
  output — is rendered as text through React, which escapes it by default.
  Nothing in the app uses raw HTML injection.

## Limitations

- LinPEASer is an analysis and presentation tool, not an exploit engine. It
  does not execute commands against any target and does not verify that a
  finding is actually exploitable.
- Kernel/exploit-suggester findings surface identifiers LinPEAS's own
  embedded tooling already produced; LinPEASer does not maintain its own
  CVE database and does not independently judge exploitability.
- Detection rules are heuristic by nature. A "possible" or "probable"
  confidence rating means exactly that — treat it as a lead to verify, not
  a confirmed vulnerability.
- Session storage depends on IndexedDB; browsing in a mode that disables
  persistent storage (some private-browsing configurations) will still let
  you view a report, just without saving it as a session.

## Contributing

Keep new parsing rules data-driven (title lexicon entries, normalization
helpers) rather than growing a single regex. New detection signals belong
in their own module under `lib/detection/`, registered in
`lib/detection/index.ts`. Run `npm run lint`, `npx tsc --noEmit`, and
`npm test` before opening a change.
