import fs from 'fs';
import { releaseDateFromPackageVersion } from './version-utils.js';

/**
 * Print the RELEASE_DATE (YYYY-MM-15) that matches the package version.
 *
 * CI and the pre-push hook rebuild release commits later than their
 * release date. The version set must derive from the committed version,
 * not the wall clock, or the rebuild prunes dirs the committed exports
 * still reference (see CONTRIBUTING.md "Release rules").
 *
 * Prints nothing when the version is not CalVer - callers then leave
 * RELEASE_DATE unset and the clock applies.
 */
const { version } = JSON.parse(fs.readFileSync('./package.json', 'utf-8')) as {
  version: string;
};
const date = releaseDateFromPackageVersion(version);
if (date) console.log(date);
