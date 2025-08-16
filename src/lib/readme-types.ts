import { z } from 'zod';

// Schema for package metadata
export const PackageMetadataSchema = z.object({
  name: z.string(),
  version: z.string(),
  generatedAt: z.string(), // ISO timestamp
});

// Schema for version metadata
export const VersionMetadataSchema = z.object({
  description: z.string(),
  status: z.enum(['stable', 'preview', 'experimental', 'deprecated']),
});

// Schema for API statistics
export const ApiStatsSchema = z.object({
  description: z.string(),
  typeCount: z.number(),
  examples: z.array(z.string()),
});

// Schema for comparison summary
export const ComparisonSummarySchema = z.object({
  totalChanges: z.number(),
  breakingChanges: z.number(),
  deprecations: z.number(),
  additions: z.number(),
  removals: z.number(),
  modifications: z.number(),
});

// Schema for individual change
export const ChangeSchema = z.object({
  name: z.string(),
  kind: z.string().optional(),
  changeType: z.enum(['added', 'removed', 'modified']),
  breaking: z.boolean(),
  description: z.string(),
});

// Schema for API comparison
export const ApiComparisonSchema = z.object({
  summary: ComparisonSummarySchema,
  changes: z.object({
    types: z.array(ChangeSchema),
    queries: z.array(ChangeSchema),
    mutations: z.array(ChangeSchema),
    subscriptions: z.array(ChangeSchema),
    enums: z.array(ChangeSchema),
  }),
});

// Schema for version comparison
export const VersionComparisonSchema = z.object({
  'fromVersion': z.string(),
  'toVersion': z.string(),
  'storefront': ApiComparisonSchema.optional(),
  'admin': ApiComparisonSchema.optional(),
  'customer-account': ApiComparisonSchema.optional(),
});

// Schema for export paths
export const ExportPathsSchema = z.object({
  types: z.record(z.string(), z.array(z.string())),
  schemas: z.record(z.string(), z.array(z.string())),
  comparisons: z.record(z.string(), z.string()),
});

// Main schema for README generation input
export const ReadmeInputSchema = z.object({
  packageMetadata: PackageMetadataSchema,
  versionSet: z.object({
    current: z.string(),
    previous: z.string(),
    releaseCandidate: z.string(),
    unstable: z.string(),
  }),
  versionMetadata: z.record(z.string(), VersionMetadataSchema),
  exports: ExportPathsSchema,
  apiStats: z.object({
    'storefront': ApiStatsSchema,
    'admin': ApiStatsSchema,
    'customer-account': ApiStatsSchema,
  }),
  comparisons: z.object({
    current: VersionComparisonSchema,
    next: VersionComparisonSchema,
  }),
});

// Type exports
export type PackageMetadata = z.infer<typeof PackageMetadataSchema>;
export type VersionMetadata = z.infer<typeof VersionMetadataSchema>;
export type ApiStats = z.infer<typeof ApiStatsSchema>;
export type ComparisonSummary = z.infer<typeof ComparisonSummarySchema>;
export type Change = z.infer<typeof ChangeSchema>;
export type ApiComparison = z.infer<typeof ApiComparisonSchema>;
export type VersionComparison = z.infer<typeof VersionComparisonSchema>;
export type ExportPaths = z.infer<typeof ExportPathsSchema>;
export type ReadmeInput = z.infer<typeof ReadmeInputSchema>;
