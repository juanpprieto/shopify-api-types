#!/usr/bin/env tsx
/**
 * CalVer Version Correction Script
 *
 * This script runs AFTER `changeset version` to correct the version from SemVer to CalVer.
 * It analyzes the git changes made by Changesets and applies the proper Shopify CalVer versioning.
 *
 * Usage: tsx scripts/calver-correct.ts
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { calculateNextVersion } from './calver-version.js';

interface PackageJson {
  version: string;
  [key: string]: unknown;
}

/**
 * Read and parse package.json
 */
function readPackageJson(): PackageJson {
  const content = readFileSync('package.json', 'utf-8');
  return JSON.parse(content);
}

/**
 * Write updated package.json
 */
function writePackageJson(packageJson: PackageJson): void {
  writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
}

/**
 * Detect changeset type from CHANGELOG.md changes
 */
function detectChangeTypeFromChangelog(): 'major' | 'minor' | 'patch' | null {
  try {
    // First check if CHANGELOG.md exists and has been modified recently
    let hasChangelogChanges = false;

    try {
      // Check if there are changes to CHANGELOG.md in the current git stage
      const diffOutput = execSync('git diff --staged --name-only', {
        encoding: 'utf-8',
      });
      if (diffOutput.includes('CHANGELOG.md')) {
        hasChangelogChanges = true;
      }
    } catch {
      // Ignore errors when checking for staged changes
    }

    if (!hasChangelogChanges) {
      try {
        // If no staged changelog, check working directory
        const workingDiff = execSync('git diff --name-only', {
          encoding: 'utf-8',
        });
        if (workingDiff.includes('CHANGELOG.md')) {
          hasChangelogChanges = true;
        }
      } catch {
        // Ignore errors when checking for staged changes
      }
    }

    // Even if no git changes detected, try to read the changelog
    // (it might have been created by changeset version)
    try {
      // Read the current CHANGELOG.md to detect section types
      const changelog = readFileSync('CHANGELOG.md', 'utf-8');

      // Check for different change types based on changelog headers
      if (changelog.includes('### Major Changes')) {
        console.log('🔍 Detected major changes from CHANGELOG.md');
        return 'major';
      } else if (changelog.includes('### Minor Changes')) {
        console.log('🔍 Detected minor changes from CHANGELOG.md');
        return 'minor';
      } else if (changelog.includes('### Patch Changes')) {
        console.log('🔍 Detected patch changes from CHANGELOG.md');
        return 'patch';
      }

      console.log(
        '⚠️ Could not determine change type from CHANGELOG.md sections',
      );
      return null;
    } catch (error) {
      console.log('⚠️ Could not read CHANGELOG.md:', error);
      return null;
    }
  } catch (error) {
    console.warn('Could not analyze changelog changes:', error);
    return null;
  }
}

/**
 * Get the previous version before changeset ran
 */
function getPreviousVersion(): string | null {
  try {
    // Get the last committed version of package.json
    const lastCommittedPackageJson = execSync('git show HEAD:package.json', {
      encoding: 'utf-8',
    });
    const previousPackage = JSON.parse(lastCommittedPackageJson);
    return previousPackage.version;
  } catch (error) {
    console.warn('Could not get previous version:', error);
    return null;
  }
}

/**
 * Main CalVer correction logic
 */
async function correctCalVer(): Promise<void> {
  console.log('🔧 CalVer Version Correction');
  console.log('==============================');

  // Read current package.json (after changeset version ran)
  const packageJson = readPackageJson();
  const currentSemVer = packageJson.version;

  console.log(`📦 Current version (SemVer): ${currentSemVer}`);

  // Get the previous version
  const previousVersion = getPreviousVersion();
  if (!previousVersion) {
    console.log('⚠️ Could not determine previous version, skipping correction');
    return;
  }

  console.log(`📜 Previous version: ${previousVersion}`);

  // Detect change type from changelog
  const changeType = detectChangeTypeFromChangelog();
  if (!changeType) {
    console.log('⚠️ Could not determine change type, skipping correction');
    return;
  }

  console.log(`🔍 Detected change type: ${changeType}`);

  // Calculate correct CalVer version
  const versionInfo = calculateNextVersion(previousVersion, changeType);
  const correctCalVer = versionInfo.nextVersion;

  console.log(`✨ Correct CalVer version: ${correctCalVer}`);

  // Check if correction is needed
  if (currentSemVer === correctCalVer) {
    console.log('✅ Version is already correct!');
    return;
  }

  console.log(`🔄 Correcting version: ${currentSemVer} → ${correctCalVer}`);

  // Update package.json with correct CalVer
  packageJson.version = correctCalVer;
  writePackageJson(packageJson);

  // Update CHANGELOG.md header
  const changelog = readFileSync('CHANGELOG.md', 'utf-8');
  const correctedChangelog = changelog.replace(
    `## ${currentSemVer}`,
    `## ${correctCalVer}`,
  );
  writeFileSync('CHANGELOG.md', correctedChangelog);

  console.log('✅ CalVer correction complete!');
  console.log(`📝 Updated package.json: ${correctCalVer}`);
  console.log(`📝 Updated CHANGELOG.md: ${correctCalVer}`);

  // Show version info for major releases
  if (changeType === 'major' && versionInfo.apiVersion) {
    console.log(`🚀 New API Version: ${versionInfo.apiVersion}`);
    console.log(
      "📅 Ensure this aligns with Shopify's quarterly release schedule",
    );
  }
}

// Run correction if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  correctCalVer().catch((error) => {
    console.error('❌ CalVer correction failed:', error);
    process.exit(1);
  });
}
