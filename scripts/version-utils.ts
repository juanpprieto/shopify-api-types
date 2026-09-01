import {
  type ApiVersion,
  ExtendedApiVersionSchema,
  type ExtendedApiVersion,
  VersionSetSchema,
  type VersionSet,
  type VersionCategory,
  type ExportPath,
  VersionToExportPathSchema,
  type VersionToExportPath,
} from '../src/lib/zod.js';
import { match } from 'ts-pattern';

// Helper to get the latest stable version
export function getLatestVersion(): ApiVersion {
  const versionSet = getCurrentVersionSet();
  return versionSet.current;
}

// =============================================================================
// Phase 5: Enhanced Version Model
// =============================================================================

/**
 * Shift a quarter-anchored date by a number of quarters and format as YYYY-MM
 */
function shiftQuarter(
  year: number,
  quarterMonth: number,
  offset: number,
): string {
  // Quarter months are 1, 4, 7, 10 → indexes 0-3
  const index = (quarterMonth - 1) / 3 + offset;
  const shiftedYear = year + Math.floor(index / 4);
  const shiftedMonth = (((index % 4) + 4) % 4) * 3 + 1;
  return `${shiftedYear}-${shiftedMonth.toString().padStart(2, '0')}`;
}

/**
 * Get the current version set: current, previous, olderSupported, next (RC), and unstable.
 *
 * Shopify supports each stable version for a minimum of 12 months, so the
 * 4 most recent stable quarters are live at any time. See CONTRIBUTING.md
 * "Version Support Principle".
 *
 * Set the RELEASE_DATE env var (YYYY-MM-DD) to compute the set for a past
 * or future date, e.g. for back-dated catch-up releases.
 */
export function getCurrentVersionSet(): VersionSet {
  const releaseDate = process.env['RELEASE_DATE'];
  const now = releaseDate ? new Date(releaseDate) : new Date();

  if (releaseDate && isNaN(now.getTime())) {
    throw new Error(
      `Invalid RELEASE_DATE "${releaseDate}" - expected YYYY-MM-DD`,
    );
  }

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 0-indexed, so add 1

  // Anchor to the current quarter month (1, 4, 7, 10)
  const quarterMonth = Math.floor((currentMonth - 1) / 3) * 3 + 1;

  const versionSet = {
    current: shiftQuarter(currentYear, quarterMonth, 0),
    previous: shiftQuarter(currentYear, quarterMonth, -1),
    olderSupported: [
      shiftQuarter(currentYear, quarterMonth, -2),
      shiftQuarter(currentYear, quarterMonth, -3),
    ],
    releaseCandidate: shiftQuarter(currentYear, quarterMonth, 1),
    unstable: 'unstable',
  };

  // Validate the version set
  const validation = VersionSetSchema.safeParse(versionSet);
  if (!validation.success) {
    throw new Error(
      `Invalid version set generated: ${validation.error.issues.map((i) => i.message).join(', ')}`,
    );
  }

  return validation.data;
}

/**
 * Classify a version into its category (current, previous, next, unstable)
 */
export function classifyVersion(
  version: ExtendedApiVersion,
  versionSet?: VersionSet,
): VersionCategory {
  const vs = versionSet ?? getCurrentVersionSet();

  return match(version)
    .when(
      (v) => v === vs.current,
      () => 'current' as const,
    )
    .when(
      (v) => v === vs.previous,
      () => 'previous' as const,
    )
    .when(
      (v) => vs.olderSupported.includes(v),
      () => 'previous' as const,
    )
    .when(
      (v) => v === vs.releaseCandidate,
      () => 'release-candidate' as const,
    )
    .when(
      (v) => v === vs.unstable,
      () => 'unstable' as const,
    )
    .otherwise(() => {
      // If not in current set, try to determine based on format
      return match(version)
        .when(
          (v) => v === 'unstable',
          () => 'unstable' as const,
        )
        .otherwise(() => 'previous' as const); // Default to previous for unknown stable versions
    });
}

/**
 * Get all supported versions as an array (for backward compatibility)
 */
export function getAllSupportedVersions(): ExtendedApiVersion[] {
  return getSupportedVersions();
}

/**
 * Get all supported versions for the support-window model
 * Returns: [current, previous, ...olderSupported, releaseCandidate, unstable]
 */
export function getSupportedVersions(): ExtendedApiVersion[] {
  const versionSet = getCurrentVersionSet();
  return [
    versionSet.current,
    versionSet.previous,
    ...versionSet.olderSupported,
    versionSet.releaseCandidate,
    versionSet.unstable,
  ];
}

/**
 * Get only stable versions (current, previous, and older supported)
 */
export function getStableVersions(): ApiVersion[] {
  const versionSet = getCurrentVersionSet();
  return [
    versionSet.current,
    versionSet.previous,
    ...versionSet.olderSupported,
  ];
}

/**
 * Get the stable versions plus the release candidate, ordered oldest first
 */
export function getOrderedStableVersions(versionSet?: VersionSet): string[] {
  const vs = versionSet ?? getCurrentVersionSet();
  return [
    ...[...vs.olderSupported].reverse(),
    vs.previous,
    vs.current,
    vs.releaseCandidate,
  ];
}

/**
 * Get every adjacent version pair (oldest first), ending at current → RC.
 * Used for comparison generation and comparison exports.
 */
export function getAdjacentVersionPairs(
  versionSet?: VersionSet,
): Array<{ from: string; to: string }> {
  const ordered = getOrderedStableVersions(versionSet);
  const pairs: Array<{ from: string; to: string }> = [];

  for (let i = 1; i < ordered.length; i++) {
    const from = ordered[i - 1];
    const to = ordered[i];
    if (from !== undefined && to !== undefined) {
      pairs.push({ from, to });
    }
  }

  return pairs;
}

/**
 * Check if a version is supported
 */
export function isSupportedVersion(
  version: string,
): version is ExtendedApiVersion {
  const validation = ExtendedApiVersionSchema.safeParse(version);
  if (!validation.success) {
    return false;
  }

  const supportedVersions = getAllSupportedVersions();
  return supportedVersions.includes(validation.data);
}

/**
 * Check if a version is supported (alias for compatibility)
 */
export function isVersionSupported(version: string): boolean {
  return isSupportedVersion(version);
}

/**
 * Get version metadata
 */
export function getVersionMetadata(version: ExtendedApiVersion): {
  category: VersionCategory;
  isStable: boolean;
  isRC: boolean;
  isUnstable: boolean;
  supportStatus: 'full' | 'maintenance' | 'preview' | 'experimental';
  status: 'stable' | 'preview' | 'experimental' | 'deprecated';
  description: string;
} {
  // Check if version is actually supported
  const isSupported = isVersionSupported(version);

  if (!isSupported && version !== 'unstable') {
    return {
      category: 'previous' as VersionCategory,
      isStable: false,
      isRC: false,
      isUnstable: false,
      supportStatus: 'experimental',
      status: 'deprecated',
      description:
        'No longer supported - please upgrade to a supported version',
    };
  }

  const category = classifyVersion(version);
  const isStable = version !== 'unstable' && category !== 'release-candidate';
  const isRC = category === 'release-candidate'; // Release candidate version
  const isUnstable = version === 'unstable';

  const metadata = match(category)
    .with('current', () => ({
      supportStatus: 'full' as const,
      status: 'stable' as const,
      description: 'Current stable release with full support',
    }))
    .with('previous', () => ({
      supportStatus: 'maintenance' as const,
      status: 'stable' as const,
      description: 'Previous stable release with security patches only',
    }))
    .with('release-candidate', () => ({
      supportStatus: 'preview' as const,
      status: 'preview' as const,
      description: 'Release candidate for next API version',
    }))
    .with('unstable', () => ({
      supportStatus: 'experimental' as const,
      status: 'experimental' as const,
      description: 'Unstable development version - APIs may change',
    }))
    .exhaustive();

  return {
    category,
    isStable,
    isRC,
    isUnstable,
    ...metadata,
  };
}

// =============================================================================
// Export Path Mapping (API versions vs Package exports)
// =============================================================================

/**
 * Get the complete version to export path mapping
 */
export function getVersionToExportPathMapping(): VersionToExportPath {
  const versionSet = getCurrentVersionSet();

  const mapping = {
    current: {
      apiVersion: versionSet.current,
      exportPath: 'current' as const,
    },
    previous: {
      apiVersion: versionSet.previous,
      exportPath: 'previous' as const,
    },
    releaseCandidate: {
      apiVersion: versionSet.releaseCandidate,
      exportPath: 'next' as const, // RC exports as /next
    },
    unstable: {
      apiVersion: versionSet.unstable,
      exportPath: 'unstable' as const,
    },
  };

  // Validate the mapping
  const validation = VersionToExportPathSchema.safeParse(mapping);
  if (!validation.success) {
    throw new Error(
      `Invalid version to export path mapping: ${validation.error.issues.map((i) => i.message).join(', ')}`,
    );
  }

  return validation.data;
}

/**
 * Get export path for a given API version
 */
export function getExportPathForVersion(
  apiVersion: ExtendedApiVersion,
): ExportPath {
  const mapping = getVersionToExportPathMapping();

  return match(apiVersion)
    .when(
      (v) => v === mapping.current.apiVersion,
      () => mapping.current.exportPath,
    )
    .when(
      (v) => v === mapping.previous.apiVersion,
      () => mapping.previous.exportPath,
    )
    .when(
      (v) => v === mapping.releaseCandidate.apiVersion,
      () => mapping.releaseCandidate.exportPath,
    )
    .when(
      (v) => v === mapping.unstable.apiVersion,
      () => mapping.unstable.exportPath,
    )
    .otherwise(() => {
      throw new Error(`No export path defined for API version: ${apiVersion}`);
    });
}

/**
 * Get API version for a given export path
 */
export function getApiVersionForExportPath(
  exportPath: ExportPath,
): ExtendedApiVersion {
  const mapping = getVersionToExportPathMapping();

  return match(exportPath)
    .with('current', () => mapping.current.apiVersion)
    .with('previous', () => mapping.previous.apiVersion)
    .with('next', () => mapping.releaseCandidate.apiVersion)
    .with('unstable', () => mapping.unstable.apiVersion)
    .exhaustive();
}
