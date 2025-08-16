import { getCurrentVersionSet, getVersionMetadata } from '../version-utils.js';

/**
 * Validate the version model and ensure all versions are properly configured
 */
function validateVersionModel(): void {
  try {
    console.log('🔍 Validating version model...');

    const versionSet = getCurrentVersionSet();
    console.log('Current version set:', JSON.stringify(versionSet, null, 2));

    // Validate each version has metadata
    for (const [type, version] of Object.entries(versionSet)) {
      const metadata = getVersionMetadata(version);
      console.log(`✅ ${type}: ${version} (${metadata.description})`);
    }

    // Validate version ordering
    if (versionSet.current <= versionSet.previous) {
      throw new Error('Current version must be newer than previous');
    }

    if (versionSet.releaseCandidate <= versionSet.current) {
      throw new Error('Release candidate version must be newer than current');
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
