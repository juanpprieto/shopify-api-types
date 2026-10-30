// A CHANGELOG section runs from its "## <version>" heading to the next
// "## " heading or the end of the file.

function findSection(
  changelog: string,
  version: string,
): { start: number; end: number } | null {
  const lines = changelog.split('\n');
  const start = lines.findIndex((line) => line === `## ${version}`);
  if (start === -1) return null;
  const next = lines.findIndex(
    (line, i) => i > start && line.startsWith('## '),
  );
  return { start, end: next === -1 ? lines.length : next };
}

/** Return the body of the version section, or null when it does not exist. */
export function extractChangelogSection(
  changelog: string,
  version: string,
): string | null {
  const section = findSection(changelog, version);
  if (!section) return null;
  return changelog
    .split('\n')
    .slice(section.start + 1, section.end)
    .join('\n')
    .trim();
}

/**
 * Put the body under "## <version>". Replace the section when it exists;
 * otherwise insert it above the newest section.
 */
export function upsertChangelogSection(
  changelog: string,
  version: string,
  body: string,
): string {
  const lines = changelog.split('\n');
  const block = [`## ${version}`, '', body.trim(), ''];
  const section = findSection(changelog, version);
  if (section) {
    lines.splice(section.start, section.end - section.start, ...block);
  } else {
    const firstSection = lines.findIndex((line) => line.startsWith('## '));
    lines.splice(
      firstSection === -1 ? lines.length : firstSection,
      0,
      ...block,
    );
  }
  return lines.join('\n');
}
