import { execSync } from 'child_process';
import { match } from 'ts-pattern';
import { getLatestVersion } from './version-utils.js';
import { ApiVersionSchema, type ApiVersion } from '../src/lib/zod.js';

interface VersionInfo {
  currentVersion: string;
  nextVersion: string;
  changeType: 'major' | 'patch';
  apiVersion?: ApiVersion;
}

/**
 * Calculate next CalVer version based on changeset type and latest Shopify API
 */
export function calculateNextVersion(
  currentVersion: string,
  changeType: 'major' | 'patch' | 'minor',
): VersionInfo {
  const normalizedChangeType = changeType === 'minor' ? 'patch' : changeType;

  return match(normalizedChangeType)
    .with('major', () => {
      // Major = new API version (quarterly release)
      const latestApiVersion = getLatestVersion();
      const apiValidation = ApiVersionSchema.safeParse(latestApiVersion);

      if (!apiValidation.success) {
        throw new Error(`Invalid API version format: ${latestApiVersion}`);
      }

      const [year, month] = latestApiVersion.split('-');
      if (!year || !month) {
        throw new Error(`Invalid API version format: ${latestApiVersion}`);
      }
      const nextVersion = `${year}.${parseInt(month, 10)}.0`;

      return {
        currentVersion,
        nextVersion,
        changeType: 'major' as const,
        apiVersion: latestApiVersion,
      };
    })
    .with('patch', () => {
      // Patch = bug fix (increment patch number)
      const versionParts = currentVersion.split('.');
      if (versionParts.length !== 3) {
        throw new Error(`Invalid CalVer format: ${currentVersion}`);
      }

      const [year, month, patch] = versionParts;
      if (!year || !month || !patch) {
        throw new Error(`Invalid CalVer format: ${currentVersion}`);
      }
      const nextPatch = parseInt(patch, 10) + 1;
      const nextVersion = `${year}.${month}.${nextPatch}`;

      return {
        currentVersion,
        nextVersion,
        changeType: 'patch' as const,
      };
    })
    .exhaustive();
}

/**
 * Detect pending changeset types
 */
export function detectChangesetTypes(): {
  hasMajor: boolean;
  hasPatches: boolean;
} {
  try {
    const output = execSync('npx changeset status --output=json', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'], // Suppress stderr
    });

    // Handle empty output
    if (!output || output.trim() === '') {
      return { hasMajor: false, hasPatches: false };
    }

    const status = JSON.parse(output);
    const releases = status.releases || [];

    const hasMajor = releases.some(
      (release: { changesets: Array<{ releases: Array<{ type: string }> }> }) =>
        release.changesets.some((cs: { releases: Array<{ type: string }> }) =>
          cs.releases.some((r: { type: string }) => r.type === 'major'),
        ),
    );

    const hasPatches = releases.some(
      (release: { changesets: Array<{ releases: Array<{ type: string }> }> }) =>
        release.changesets.some((cs: { releases: Array<{ type: string }> }) =>
          cs.releases.some((r: { type: string }) => r.type === 'patch'),
        ),
    );

    return { hasMajor, hasPatches };
  } catch (error) {
    // For now, let's just check if changeset files exist
    try {
      const fs = require('fs');
      const changesetFiles = fs
        .readdirSync('.changeset')
        .filter((file: string) => file.endsWith('.md') && file !== 'README.md');

      if (changesetFiles.length === 0) {
        return { hasMajor: false, hasPatches: false };
      }

      // Simple heuristic: check for "major" or "patch" in changeset files
      let hasMajor = false;
      let hasPatches = false;

      for (const file of changesetFiles) {
        const content = fs.readFileSync(`.changeset/${file}`, 'utf-8');
        if (content.includes(': major')) hasMajor = true;
        if (content.includes(': patch')) hasPatches = true;
      }

      return { hasMajor, hasPatches };
    } catch {
      console.warn('Could not detect changeset types:', error);
      return { hasMajor: false, hasPatches: false };
    }
  }
}

/**
 * Validate CalVer version format
 */
export function validateCalVerFormat(version: string): boolean {
  const calVerPattern = /^\d{4}\.\d{1,2}\.\d+$/;
  return calVerPattern.test(version);
}

/**
 * Get version info for display
 */
export function getVersionInfo(currentVersion: string): {
  year: number;
  month: number;
  patch: number;
  apiVersion: string;
  isQuarterlyRelease: boolean;
} {
  if (!validateCalVerFormat(currentVersion)) {
    throw new Error(
      `Invalid CalVer format: ${currentVersion}. Expected: YYYY.M.PATCH`,
    );
  }

  const [year, month, patch] = currentVersion.split('.');
  if (!year || !month || !patch) {
    throw new Error(`Invalid CalVer format: ${currentVersion}`);
  }
  const apiVersion = `${year}-${month.padStart(2, '0')}`;

  return {
    year: parseInt(year, 10),
    month: parseInt(month, 10),
    patch: parseInt(patch, 10),
    apiVersion,
    isQuarterlyRelease: ['1', '4', '7', '10'].includes(month),
  };
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const currentVersion = process.argv[3];

  match(command)
    .with('next', () => {
      if (!currentVersion) {
        console.error(
          'Usage: tsx scripts/calver-version.ts next <current-version>',
        );
        process.exit(1);
      }

      const { hasMajor, hasPatches } = detectChangesetTypes();
      const changeType = hasMajor ? 'major' : hasPatches ? 'patch' : 'patch';

      const versionInfo = calculateNextVersion(currentVersion, changeType);
      console.log(JSON.stringify(versionInfo, null, 2));
    })
    .with('validate', () => {
      if (!currentVersion) {
        console.error(
          'Usage: tsx scripts/calver-version.ts validate <version>',
        );
        process.exit(1);
      }

      const isValid = validateCalVerFormat(currentVersion);
      console.log(isValid ? 'valid' : 'invalid');
      if (!isValid) process.exit(1);
    })
    .with('info', () => {
      if (!currentVersion) {
        console.error('Usage: tsx scripts/calver-version.ts info <version>');
        process.exit(1);
      }

      const info = getVersionInfo(currentVersion);
      console.log(JSON.stringify(info, null, 2));
    })
    .otherwise(() => {
      console.log('Usage:');
      console.log(
        '  tsx scripts/calver-version.ts next <current-version>    # Calculate next version',
      );
      console.log(
        '  tsx scripts/calver-version.ts validate <version>        # Validate CalVer format',
      );
      console.log(
        '  tsx scripts/calver-version.ts info <version>            # Get version info',
      );
    });
}
