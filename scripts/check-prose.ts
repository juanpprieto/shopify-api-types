import { readFileSync } from 'node:fs';
import { extractChangelogSection } from './lib/changelog.js';
import { findProseViolations } from './lib/writing-contract.js';

// Check documentation against the writing contract.
//   tsx scripts/check-prose.ts <file>...           whole files (CI)
//   tsx scripts/check-prose.ts --changelog <ver>   one CHANGELOG section
// The CHANGELOG section becomes the GitHub release text, so the Release
// workflow checks it before it publishes. An open [TK] marker fails it.

const args = process.argv.slice(2);
const changelogMode = args[0] === '--changelog';
const targets: Array<{ name: string; text: string | null }> = changelogMode
  ? [
      {
        name: `CHANGELOG ${args[1]}`,
        text: extractChangelogSection(
          readFileSync('CHANGELOG.md', 'utf-8'),
          args[1] ?? '',
        ),
      },
    ]
  : args.map((file) => ({ name: file, text: readFileSync(file, 'utf-8') }));

let failed = false;
for (const { name, text } of targets) {
  const violations = text
    ? findProseViolations(text)
    : ['missing or empty section'];
  if (changelogMode && text?.includes('[TK')) {
    violations.push('has an open [TK] marker');
  }
  if (violations.length > 0) {
    console.error(`${name}: ${violations.join('; ')}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log(`${targets.length} text(s) passed the writing contract.`);
