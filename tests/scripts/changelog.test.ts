import { describe, it, expect } from 'vitest';
import {
  extractChangelogSection,
  upsertChangelogSection,
} from '../../scripts/lib/changelog.js';
import { findProseViolations } from '../../scripts/lib/writing-contract.js';

const changelog = `# @juanpprieto/shopify-api-types

## 2026.7.0

Old text.

## 2026.4.0

Older text.
`;

describe('changelog sections', () => {
  it('extracts the body of a version section', () => {
    expect(extractChangelogSection(changelog, '2026.7.0')).toBe('Old text.');
    expect(extractChangelogSection(changelog, '2026.4.0')).toBe('Older text.');
    expect(extractChangelogSection(changelog, '2026.10.0')).toBeNull();
  });

  it('inserts a new section above the newest one', () => {
    const result = upsertChangelogSection(changelog, '2026.10.0', 'New text.');
    expect(result.indexOf('## 2026.10.0')).toBeLessThan(
      result.indexOf('## 2026.7.0'),
    );
    expect(extractChangelogSection(result, '2026.10.0')).toBe('New text.');
    expect(extractChangelogSection(result, '2026.7.0')).toBe('Old text.');
  });

  it('replaces an existing section and keeps the others', () => {
    const result = upsertChangelogSection(changelog, '2026.7.0', 'Redrafted.');
    expect(extractChangelogSection(result, '2026.7.0')).toBe('Redrafted.');
    expect(extractChangelogSection(result, '2026.4.0')).toBe('Older text.');
    expect(result.match(/## 2026\.7\.0/g)).toHaveLength(1);
  });
});

describe('findProseViolations', () => {
  it('passes plain STE text', () => {
    expect(findProseViolations('Shopify removes `PriceRule`.')).toEqual([]);
  });

  it('flags perfect tenses and importance words', () => {
    expect(findProseViolations('The field has been removed.').join()).toMatch(
      /perfect tense/,
    );
    expect(findProseViolations('This is a significant change.').join()).toMatch(
      /importance word/,
    );
  });
});

describe('findProseViolations with GitHub Markdown', () => {
  it('reads an alert marker and its text as separate units', () => {
    const alert =
      '> [!IMPORTANT]\n> Shopify removes 23 discount types in this version. Use the discount fields instead.';
    expect(findProseViolations(alert)).toEqual([]);
  });

  it('skips the HTML lines of a collapsed block', () => {
    const block =
      '<details>\n<summary>23 removed types</summary>\n\n- `PriceRule`\n\n</details>';
    expect(findProseViolations(block)).toEqual([]);
  });
});
