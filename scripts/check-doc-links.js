/**
 * Prüft alle relativen Markdown-Links im Repo auf tote Ziele.
 *
 * Zwei Fehlerklassen:
 *   - MISSING FILE — die verlinkte Datei existiert nicht
 *   - BAD ANCHOR   — die Datei existiert, hat aber keine Überschrift mit diesem Anker
 *
 * Die Doku lebt von dichten Querverweisen (SPEC-Index, Wohnort-Tabellen, Glossar);
 * ohne diesen Check verrotten Anker still bei jeder Umbenennung einer Überschrift.
 *
 * Dependency-frei, damit der Check auch ohne installierte node_modules läuft.
 * Aufruf: `npm run docs:links`
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/** Verzeichnisse, die nie durchsucht werden. */
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', 'playwright-report']);

/** Zusätzliche Einzeldateien außerhalb der durchsuchten Verzeichnisse. */
const EXTRA_FILES = ['AGENTS.md', 'README.md', '.claude/CLAUDE.md'];

/** Verzeichnisse, die rekursiv nach `.md` durchsucht werden. */
const SEARCH_DIRS = ['docs', 'src', 'e2e'];

/** Markdown-Link `[text](ziel)` — Ziel ohne Leerzeichen, also ohne optionalen Titel. */
const LINK_PATTERN = /\[[^\]]*\]\(([^)\s]+)\)/g;

/** ATX-Überschrift `# … ###### …`. */
const HEADING_PATTERN = /^#{1,6}\s+(.+)$/gm;

/** Links, die nicht auf das Dateisystem zeigen. */
const EXTERNAL_PATTERN = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * Bildet eine Überschrift auf ihren GitHub-Anker ab.
 *
 * GitHub ersetzt **jedes** Leerzeichen einzeln durch einen Bindestrich — aus
 * „Wipe & Abbruch" wird `wipe--abbruch` (das entfernte `&` hinterlässt zwei
 * Leerzeichen). Ein `\s+` würde das zu `wipe-abbruch` kollabieren und damit
 * genau die Anker fälschlich als kaputt melden, die im Repo am häufigsten sind.
 */
function toAnchor(heading) {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s/g, '-');
}

/** Sammelt rekursiv alle Markdown-Dateien unter `dir`. */
function collectMarkdown(dir, found = []) {
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectMarkdown(full, found);
    else if (entry.name.endsWith('.md')) found.push(full);
  }
  return found;
}

/** Zerlegt ein Linkziel in Dateipfad und Anker. */
function splitTarget(link) {
  const hash = link.indexOf('#');
  if (hash === -1) return { filePart: link, anchor: '' };
  return { filePart: link.slice(0, hash), anchor: link.slice(hash + 1) };
}

const files = SEARCH_DIRS.flatMap((dir) => collectMarkdown(dir)).concat(
  EXTRA_FILES.filter((f) => fs.existsSync(f)),
);

// Anker-Register pro Datei, vorab aufgebaut — jede Datei wird nur einmal gelesen.
const anchorsByFile = new Map();
const sourceByFile = new Map();
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  sourceByFile.set(file, text);
  const anchors = new Set();
  for (const match of text.matchAll(HEADING_PATTERN)) anchors.add(toAnchor(match[1].trim()));
  anchorsByFile.set(path.resolve(file), anchors);
}

const problems = [];
let checked = 0;

for (const file of files) {
  const lines = sourceByFile.get(file).split('\n');
  lines.forEach((line, index) => {
    for (const match of line.matchAll(LINK_PATTERN)) {
      const link = match[1];
      if (EXTERNAL_PATTERN.test(link)) continue;
      checked += 1;

      const { filePart, anchor } = splitTarget(link);
      const normalized = filePart.split('\\').join('/');
      const target = normalized
        ? path.resolve(path.dirname(file), decodeURIComponent(normalized))
        : path.resolve(file);
      const where = `${file}:${index + 1}`;

      if (!fs.existsSync(target)) {
        problems.push(`MISSING FILE  ${where}  ->  ${link}`);
        continue;
      }
      if (!anchor) continue;

      const anchors = anchorsByFile.get(target);
      if (!anchors) continue; // Ziel ist keine Markdown-Datei — Anker nicht prüfbar.
      if (!anchors.has(decodeURIComponent(anchor))) {
        problems.push(`BAD ANCHOR    ${where}  ->  ${link}`);
      }
    }
  });
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  console.error(`\n${problems.length} kaputte(r) Link(s) von ${checked} geprüften.`);
  process.exit(1);
}

console.log(`Alle ${checked} relativen Links OK (${files.length} Markdown-Dateien).`);
