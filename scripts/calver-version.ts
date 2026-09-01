import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
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
    // changeset status --output writes to a FILE (it does not print to
    // stdout), so read the result through a temp file
    const tmpFile = path.join(
      os.tmpdir(),
      `changeset-status-${process.pid}.json`,
    );
    execSync(`npx changeset status --output="${tmpFile}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'], // Suppress stderr
    });

    let output = '';
    try {
      output = fs.readFileSync(tmpFile, 'utf-8');
    } finally {
      fs.rmSync(tmpFile, { force: true });
    }

    // Handle empty output
    if (!output || output.trim() === '') {
      return { hasMajor: false, hasPatches: false };
    }

    // Real status JSON shape: { changesets: [{ releases: [{ name, type }] }],
    // releases: [{ name, type, changesets: [<ids>] }] }
    const status = JSON.parse(output) as {
      changesets?: Array<{ releases: Array<{ type: string }> }>;
    };
    const changesets = status.changesets ?? [];

    const hasMajor = changesets.some((cs) =>
      cs.releases.some((r) => r.type === 'major'),
    );

    // CalVer treats minor as patch (see CONTRIBUTING.md change type mapping)
    const hasPatches = changesets.some((cs) =>
      cs.releases.some((r) => r.type === 'patch' || r.type === 'minor'),
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
  const manualChangeType = process.argv[4]; // Optional override

  match(command)
    .with('next', () => {
      if (!currentVersion) {
        console.error(
          'Usage: tsx scripts/calver-version.ts next <current-version> [change-type]',
        );
        process.exit(1);
      }

      let changeType: 'major' | 'patch' | 'minor';

      if (
        manualChangeType &&
        ['major', 'minor', 'patch'].includes(manualChangeType)
      ) {
        changeType = manualChangeType as 'major' | 'patch' | 'minor';
        console.log(`🔧 Using manual change type: ${changeType}`);
      } else {
        const { hasMajor, hasPatches } = detectChangesetTypes();
        changeType = hasMajor ? 'major' : hasPatches ? 'patch' : 'patch';
        console.log(
          `🔍 Detected change type: ${changeType} (hasMajor: ${hasMajor}, hasPatches: ${hasPatches})`,
        );
      }

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
