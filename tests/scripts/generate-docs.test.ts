import { describe, it, expect } from 'vitest';
import {
  validateReadmeStyle,
  validateChangelogDraft,
} from '../../scripts/generate-docs.js';

// A body long enough to pass the length check, in plain STE sentences
const body = Array.from(
  { length: 40 },
  (_, i) => `The package exports the types for version ${i}. Use the alias.`,
).join('\n\n');

const valid = `${body}

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
