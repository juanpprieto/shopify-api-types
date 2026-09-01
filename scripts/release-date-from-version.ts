import fs from 'fs';

/**
 * Print the RELEASE_DATE (YYYY-MM-15) that matches the package version.
 *
 * CI and the pre-push hook rebuild release commits later than their
 * release date. The version set must derive from the committed version,
 * not the wall clock, or the rebuild prunes dirs the committed exports
 * still reference (see CONTRIBUTING.md "Release Crossroads").
 *
 * Prints nothing when the version is not CalVer - callers then leave
 * RELEASE_DATE unset and the clock applies.
 */
const version = (
  JSON.parse(fs.readFileSync('./package.json', 'utf-8')) as {
    version?: string;
  }
).version;

const match = version?.match(/^(\d{4})\.(1|4|7|10)\.\d+$/);
if (match && match[1] !== undefined && match[2] !== undefined) {
  console.log(`${match[1]}-${match[2].padStart(2, '0')}-15`);
}
