import { ApiVersionSchema, type ApiVersion } from '../src/lib/zod.js';

export function getLastFourVersions(): ApiVersion[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Find current or most recent quarter
  const quarters = [10, 7, 4, 1];
  const currentQuarter = quarters.find((q) => currentMonth >= q) ?? 10;

  // If we're in a month before the quarter release, use previous year's Q4
  let year =
    currentQuarter === 10 && currentMonth < 10 ? currentYear - 1 : currentYear;
  let quarter = currentQuarter;

  // Generate last 4 versions
  const versions: string[] = [];
  const quartersOrdered = [1, 4, 7, 10];

  for (let i = 0; i < 4; i++) {
    const versionString = `${year}-${quarter.toString().padStart(2, '0')}`;

    // Validate the version format using Zod
    const parsed = ApiVersionSchema.safeParse(versionString);
    if (!parsed.success) {
      throw new Error(`Generated invalid API version: ${versionString}`);
    }

    versions.push(parsed.data);

    // Move to previous quarter
    const currentIndex = quartersOrdered.indexOf(quarter);
    if (currentIndex === 0) {
      quarter = 10;
      year--;
    } else {
      const previousQuarter = quartersOrdered[currentIndex - 1];
      if (previousQuarter === undefined) {
        throw new Error('Invalid quarter calculation');
      }
      quarter = previousQuarter;
    }
  }

  return versions as ApiVersion[];
}

// Helper to get the latest stable version
export function getLatestVersion(): ApiVersion {
  const versions = getLastFourVersions();
  const latest = versions[0];
  if (!latest) {
    throw new Error('No versions available');
  }
  return latest;
}
