const { getInfo } = require('@changesets/get-github-info');

/**
 * Custom changelog generator for CalVer versioning
 * Handles major (API updates) and patch (bug fixes) releases
 */
const getReleaseLine = async (changeset, type, changelogOpts) => {
  const [firstLine, ...futureLines] = changeset.summary
    .split('\n')
    .map((l) => l.trimRight());

  // Format different types of changes
  const formattedSummary =
    type === 'major'
      ? `🚀 **API Update**: ${firstLine}`
      : type === 'patch'
        ? `🐛 **Fix**: ${firstLine}`
        : `✨ **Change**: ${firstLine}`;

  // Add additional lines if they exist
  const additionalLines =
    futureLines.length > 0
      ? `\n${futureLines.map((l) => `  ${l}`).join('\n')}`
      : '';

  // Try to get GitHub info if available
  let githubInfo = '';
  if (changelogOpts?.repo) {
    try {
      const info = await getInfo({
        repo: changelogOpts.repo,
        commit: changeset.commit,
      });
      if (info.pull) {
        githubInfo = ` ([#${info.pull}](${info.links.pull}))`;
      }
    } catch {
      // Silently fail if GitHub info unavailable
    }
  }

  return `- ${formattedSummary}${githubInfo}${additionalLines}`;
};

const getDependencyReleaseLine = async (changesets, dependenciesUpdated) => {
  if (dependenciesUpdated.length === 0) return '';

  const changesetLink = `- Updated dependencies${changesets
    .map((cs) => `\n  - ${cs.summary}${cs.commit ? ` (${cs.commit})` : ''}`)
    .join('')}`;

  return changesetLink;
};

module.exports = {
  getReleaseLine,
  getDependencyReleaseLine,
};
