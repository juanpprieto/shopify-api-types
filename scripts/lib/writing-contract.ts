// Writing rules for every text that a reader gets from a release: the
// README, the CHANGELOG section, and the GitHub release notes (a copy of
// that section). The rules combine the /clarity foundations with ASD-STE100
// Simplified Technical English. findProseViolations() checks the rules that
// a script can check; a person reviews the rest in the Docs PR.

export const WRITING_CONTRACT = `Reader and job:
- The reader is a TypeScript developer who calls Shopify GraphQL APIs. After reading, they know what changed, what breaks in their code, and what to do.
- This is reference and release documentation. Make it accurate, easy to scan, and predictable. Do not argue, sell, or entertain.

Truth (never break these):
- Use only facts from the input data. Invent no number, version, name, path, quotation, or claim.
- Keep every condition and limit. Do not change "may" to "will" or "some" to "all".
- When the reader needs a fact that the input does not have, write [TK: <the question>] in its place. Never guess.

Substance:
- Name the mechanism, not its importance: the type, field, argument, or path, and what changed. Do not call a change significant, key, or crucial.
- Name the actor. Write "Shopify removes \`X\`", not "\`X\` has been removed".
- One topic per paragraph. Order the text by the reader's task: what changed, what breaks, what to do.
- Stop after the last useful fact. No summary, recap, or closing remark.

Simplified Technical English (ASD-STE100):
- Active voice. Simple tenses only: simple present, simple past, simple future, imperative. No perfect tenses ("has been", "have changed").
- Use the imperative for instructions: "Install the package", not "You should install the package".
- One instruction per sentence. At most 20 words in an instruction and 25 words in a description.
- Use these verbs: check, make sure, start, stop, use, show, find, change, remove, need. Never: verify, ensure, initiate, utilize, display, locate, modify, require.
- One word has one meaning. Use the same word for the same thing every time.
- At most 3 nouns in a row.

Style:
- No emojis. No em dashes; use commas, parentheses, or periods.
- No marketing words: comprehensive, robust, seamless, powerful, cutting-edge, innovative, extensive, rich.
- No filler: "it is important to note", "a testament to", "in today's", "at the forefront", "serves as".
- Never use: delve, leverage, utilize, facilitate, streamline, holistic, ecosystem, landscape, myriad, moreover, furthermore.
- No meta-commentary ("let's explore", "in this section").
- Do not start every bullet with a bold label. Do not group items in threes for rhythm.
- Headings are plain text in sentence case. The first sentence under a heading does not repeat the heading.
- Prefer tables and code blocks over long prose.`;

/**
 * Return one message per contract rule that the text breaks. Code blocks,
 * tables, headings, and badge lines are not prose and are skipped by the
 * sentence checks.
 */
export function findProseViolations(text: string): string[] {
  const violations: string[] = [];

  if (/\p{Extended_Pictographic}/u.test(text)) {
    violations.push('contains emojis');
  }

  const emDashes = (text.match(/—/g) ?? []).length;
  if (emDashes > 0) {
    violations.push(`contains ${emDashes} em dash(es)`);
  }

  const patterns: Array<[RegExp, string]> = [
    [
      /\b(delve|tapestry|multifaceted|leverage|utilize|facilitate|streamline|holistic|myriad|moreover|furthermore|seamless|cutting-edge|comprehensive)\b/i,
      'slop vocabulary',
    ],
    [
      /it is important to note|a testament to|in today.s|at the forefront|serves as a|let.s (explore|dive)/i,
      'slop phrase',
    ],
    [/\b(verify|ensure|initiate|utilize|locate)\b/i, 'non-STE verb'],
    [/\b(has|have|had) been\b/i, 'perfect tense'],
    [/\b(crucial|pivotal|significant(ly)?)\b/i, 'importance word'],
  ];
  for (const [pattern, label] of patterns) {
    const match = text.match(pattern);
    if (match) {
      violations.push(`uses a ${label} ("${match[0]}")`);
    }
  }

  // Paragraphs join their wrapped lines; each list item counts on its own
  const units = text
    .replace(/```[\s\S]*?```/g, '')
    .split(/\n\s*\n/)
    .flatMap((block) => {
      const lines = block
        .split('\n')
        .filter((line) => !/^\s*(\||#|!\[|\[!\[)/.test(line));
      return lines.some((line) => /^\s*([-*+]|\d+\.)\s/.test(line))
        ? lines
        : [lines.join(' ')];
    });
  const longSentence = units
    .flatMap((unit) => unit.split(/(?<=[.!?])\s+/))
    .find((sentence) => sentence.split(/\s+/).filter(Boolean).length > 25);
  if (longSentence) {
    violations.push(
      `has a sentence over 25 words ("${longSentence.slice(0, 60)}...")`,
    );
  }

  return violations;
}
