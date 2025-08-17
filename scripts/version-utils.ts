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
 * Get the current version set: current, previous, next (RC), and unstable
 */
export function getCurrentVersionSet(): VersionSet {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 0-indexed, so add 1

  // Determine current quarter
  const quarters = [1, 4, 7, 10];
  const currentQuarter =
    quarters.find((q) => {
      const nextQuarter = quarters[quarters.indexOf(q) + 1] || 13; // 13 for wrap-around
      return currentMonth >= q && currentMonth < nextQuarter;
    }) ?? 10; // Default to Q4 if no match

  const currentQuarterIndex = quarters.indexOf(currentQuarter);

  // Calculate versions using pattern matching
  const versionSet = match({ currentQuarter, currentQuarterIndex })
    .with({ currentQuarterIndex: 3 }, () => {
      // Q4 (October) - next quarter is Q1 of next year
      return {
        current: `${currentYear}-${currentQuarter.toString().padStart(2, '0')}`,
        previous: `${currentYear}-07`,
        releaseCandidate: `${currentYear + 1}-01`,
        unstable: 'unstable',
      };
    })
    .with({ currentQuarterIndex: 0 }, () => {
      // Q1 (January) - previous quarter is Q4 of previous year
      return {
        current: `${currentYear}-${currentQuarter.toString().padStart(2, '0')}`,
        previous: `${currentYear - 1}-10`,
        releaseCandidate: `${currentYear}-04`,
        unstable: 'unstable',
      };
    })
    .otherwise(({ currentQuarterIndex }) => {
      // Q2 (April) or Q3 (July)
      const previousQuarter = quarters[currentQuarterIndex - 1];
      const nextQuarter = quarters[currentQuarterIndex + 1];

      if (!previousQuarter || !nextQuarter) {
        throw new Error('Invalid quarter calculation');
      }

      return {
        current: `${currentYear}-${currentQuarter.toString().padStart(2, '0')}`,
        previous: `${currentYear}-${previousQuarter.toString().padStart(2, '0')}`,
        releaseCandidate: `${currentYear}-${nextQuarter.toString().padStart(2, '0')}`,
        unstable: 'unstable',
      };
    });

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
  const versionSet = getCurrentVersionSet();
  return [
    versionSet.current,
    versionSet.previous,
    versionSet.releaseCandidate,
    versionSet.unstable,
  ];
}

/**
 * Get only the 4 supported versions for the 4-version model
 * Returns: [current, previous, releaseCandidate, unstable]
 */
export function getSupportedVersions(): ExtendedApiVersion[] {
  const versionSet = getCurrentVersionSet();
  return [
    versionSet.current,
    versionSet.previous,
    versionSet.releaseCandidate,
    versionSet.unstable,
  ];
}

/**
 * Get only stable versions (current and previous)
 */
export function getStableVersions(): ApiVersion[] {
  const versionSet = getCurrentVersionSet();
  return [versionSet.current, versionSet.previous];
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
