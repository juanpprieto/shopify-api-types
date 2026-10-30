import { describe, it, expect } from 'vitest';
import {
  buildReadme,
  condenseComparison,
  fillOtherAdditions,
  validateReadmeStyle,
  validateChangelogDraft,
} from '../../scripts/generate-docs.js';

// A body long enough to pass the length check, in plain STE sentences
const body = Array.from(
  { length: 40 },
  (_, i) => `The package exports the types for version ${i}. Use the alias.`,
).join('\n\n');

const valid = `${body}

## Install

\`\`\`bash
npm install -D @juanpprieto/shopify-api-types
\`\`\`

> [!NOTE]
> The package has types and JSON only.

## Quick start

<details>
<summary>2 removed items</summary>

- \`PriceRule\`

</details>

| Alias | Version |
| ----- | ------- |
| \`current\` | \`2026-10\`, which is the stable version that most apps use today for every request they send to Shopify |

\`\`\`ts
// a long code comment is not prose and has more than twenty-five words in it, so the gate must skip it entirely here
\`\`\`

## License

MIT
`;

describe('validateReadmeStyle', () => {
  it('passes a README in the expected style', () => {
    expect(() => validateReadmeStyle(valid)).not.toThrow();
  });

  it('reads each list item as its own sentence', () => {
    const bullets = Array.from(
      { length: 6 },
      (_, i) => `- \`Type${i}\` - the field type changed to a non-null list`,
    ).join('\n');
    expect(() => validateReadmeStyle(`${bullets}\n\n${valid}`)).not.toThrow();
  });

  it('fails a prose sentence over 25 words', () => {
    const long =
      'This sentence has far too many words in it because it keeps going on and on about the package and its many export paths and aliases.';
    expect(() => validateReadmeStyle(`${long}\n\n${valid}`)).toThrow(
      /over 25 words/,
    );
  });

  it('fails a non-STE verb', () => {
    expect(() =>
      validateReadmeStyle(`Verify the install.\n\n${valid}`),
    ).toThrow(/non-STE verb/);
  });

  it('fails emojis and a missing License section', () => {
    expect(() =>
      validateReadmeStyle(valid.replace('## License\n\nMIT', '\u{1F680}')),
    ).toThrow(/emojis.*|License/);
  });
});

describe('validateChangelogDraft', () => {
  const draft = `Shopify API \`2026-10\` is the new current version.

### Breaking changes

- \`PriceRule\` - Shopify removes the type.

### Release candidate

- None.

### Package changes

[TK: package changes]
`;

  it('passes a draft with the required sections', () => {
    expect(() => validateChangelogDraft(draft)).not.toThrow();
  });

  it('fails a draft without the package changes section', () => {
    expect(() =>
      validateChangelogDraft(draft.replace('### Package changes', '')),
    ).toThrow(/Package changes/);
  });

  it('fails a draft with its own version heading', () => {
    expect(() => validateChangelogDraft(`## 2026.10.0\n\n${draft}`)).toThrow(
      /the script adds it/,
    );
  });
});

describe('buildReadme', () => {
  it('starts with the version stamp that the Release workflow checks', () => {
    const lines = buildReadme('2026.10.0', valid).split('\n');
    expect(lines[0]).toBe('<!-- generated for 2026.10.0 -->');
    expect(lines[1]).toBe('# @juanpprieto/shopify-api-types');
    expect(() => validateReadmeStyle(lines.join('\n'))).not.toThrow();
  });
});

describe('condenseComparison', () => {
  it('adds Shopify context using the versions stored per API', () => {
    // Same shape as dist/comparisons/*.json: versions inside each API
    const comparison = {
      admin: {
        fromVersion: '2026-10',
        toVersion: '2027-01',
        summary: {},
        changes: {
          mutations: [
            {
              name: 'marketCurrencySettingsUpdate',
              changeType: 'removed',
              breaking: true,
              description:
                "Field 'marketCurrencySettingsUpdate' (deprecated) was removed from object type 'Mutation'",
            },
          ],
        },
      },
    } as unknown as Parameters<typeof condenseComparison>[0];

    const admin = condenseComparison(comparison)['admin'] as {
      breakingChanges: Array<{ deprecationReason?: string }>;
    };
    expect(admin.breakingChanges[0]?.deprecationReason).toMatch(/marketCreate/);
  });
});

describe('fillOtherAdditions', () => {
  it('lists every addition that the text does not name yet', () => {
    const body = 'Use `AuditTrailAdjustment` now.\n\n<!-- other-additions -->';
    const result = fillOtherAdditions(body, {
      admin: {
        additionLabels: ['AuditTrailAdjustment', 'Barcode', 'Order.barcodes'],
      },
    });
    expect(result).not.toContain('<!-- other-additions -->');
    expect(result).toContain('<summary>2 other additions</summary>');
    expect(result).toContain('- `Order.barcodes`');
    expect(result).not.toContain('- `AuditTrailAdjustment`');
  });
});
