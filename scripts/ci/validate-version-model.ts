import {
  getCurrentVersionSet,
  getVersionMetadata,
  getAdjacentVersionPairs,
} from '../version-utils.js';
import type { ExtendedApiVersion } from '../../src/lib/zod.js';

/**
 * Validate the version model and ensure all versions are properly configured
 */
function validateVersionModel(): void {
  try {
    console.log('🔍 Validating version model...');

    const versionSet = getCurrentVersionSet();
    console.log('Current version set:', JSON.stringify(versionSet, null, 2));

    // Validate each version has metadata
    const labeledVersions: Array<[string, ExtendedApiVersion]> = [
      ['current', versionSet.current],
      ['previous', versionSet.previous],
      ...versionSet.olderSupported.map((v, i): [string, ExtendedApiVersion] => [
        `olderSupported[${i}]`,
        v,
      ]),
      ['releaseCandidate', versionSet.releaseCandidate],
      ['unstable', versionSet.unstable],
    ];

    for (const [type, version] of labeledVersions) {
      const metadata = getVersionMetadata(version);
      console.log(`✅ ${type}: ${version} (${metadata.description})`);
    }

    // Validate version ordering across the full chain:
    // older[1] < older[0] < previous < current < releaseCandidate
    for (const { from, to } of getAdjacentVersionPairs(versionSet)) {
      if (from >= to) {
        throw new Error(
          `Version ordering invalid: ${to} must be newer than ${from}`,
        );
      }
    }

    console.log('✅ Version model validation passed');
  } catch (error) {
    console.error(
      '❌ Version model validation failed:',
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateVersionModel();
}

export { validateVersionModel };
