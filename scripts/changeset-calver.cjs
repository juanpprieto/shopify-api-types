/* eslint-env node */
/* eslint no-console: "off" */
/* eslint no-unused-vars: "off" */
/* globals process, console */

const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Custom Changesets changelog generator that enforces Shopify CalVer versioning
 * 
 * Shopify CalVer Pattern: YYYY.[1|4|7|10].PATCH
 * - Major versions only for new API quarters (1, 4, 7, 10)
 * - Minor changes are treated as patches
 * - Only patch increments are allowed for bug fixes
 */

/**
 * Validate that version follows Shopify CalVer pattern
 */
function validateShopifyCalVer(version) {
  const calVerPattern = /^(\d{4})\.([1|4|7]|10)\.(\d+)$/;
  const match = version.match(calVerPattern);
  
  if (!match) {
    throw new Error(
      `Invalid Shopify CalVer version: ${version}. ` +
      `Must follow pattern YYYY.[1|4|7|10].PATCH (e.g., 2025.7.0)`
    );
  }
  
  const [, year, month, patch] = match;
  const validMonths = ['1', '4', '7', '10'];
  
  if (!validMonths.includes(month)) {
    throw new Error(
      `Invalid API quarter month: ${month}. ` +
      `Must be one of: ${validMonths.join(', ')}`
    );
  }
  
  return { year, month, patch };
}

/**
 * Calculate next CalVer version based on changeset types
 */
function calculateNextCalVer(currentVersion, changeSummary) {
  const { releases } = changeSummary;
  
  // Check what types of changes we have
  const hasMajorChanges = releases.some(release => 
    release.changesets.some(changeset => 
      changeset.releases.some(r => r.type === 'major')
    )
  );
  
  const hasMinorChanges = releases.some(release => 
    release.changesets.some(changeset => 
      changeset.releases.some(r => r.type === 'minor')
    )
  );
  
  const hasPatchChanges = releases.some(release => 
    release.changesets.some(changeset => 
      changeset.releases.some(r => r.type === 'patch')
    )
  );
  
  // Parse current version
  const currentParts = validateShopifyCalVer(currentVersion);
  const currentYear = parseInt(currentParts.year);
  const currentMonth = parseInt(currentParts.month);
  const currentPatch = parseInt(currentParts.patch);
  
  // Determine next version based on change types
  if (hasMajorChanges) {
    // Major changes = new API version
    // This should align with Shopify's quarterly releases
    const latestApiVersion = getLatestShopifyApiVersion();
    const [apiYear, apiMonth] = latestApiVersion.split('-');
    return `${apiYear}.${parseInt(apiMonth)}.0`;
  } else if (hasMinorChanges || hasPatchChanges) {
    // Minor and patch changes both increment patch number in CalVer
    return `${currentYear}.${currentMonth}.${currentPatch + 1}`;
  }
  
  return currentVersion;
}

/**
 * Get latest Shopify API version from the codebase
 */
function getLatestShopifyApiVersion() {
  try {
    const output = execSync('npx tsx -e "import { getLatestVersion } from \'./scripts/version-utils.js\'; console.log(getLatestVersion());"', {
      encoding: 'utf-8',
      cwd: process.cwd()
    });
    return output.trim();
  } catch (error) {
    console.warn('Could not get latest API version:', error.message);
    // Fallback - get from current package version
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
    const currentVersion = packageJson.version;
    const parts = validateShopifyCalVer(currentVersion);
    return `${parts.year}-${parts.month.padStart(2, '0')}`;
  }
}

/**
 * Custom changelog function for Changesets
 */
async function getReleaseLine(changeset, type, options) {
  const [firstLine, ...futureLines] = changeset.summary
    .split('\n')
    .map(l => l.trimRight());

  let returnVal = `- ${firstLine}`;

  if (futureLines.length > 0) {
    returnVal += `\n${futureLines.map(l => `  ${l}`).join('\n')}`;
  }

  const changesetType = changeset.releases[0]?.type || 'patch';
  
  // Add CalVer context to changelog entries
  if (changesetType === 'major') {
    returnVal += ` (New API Version)`;
  } else if (changesetType === 'minor') {
    returnVal += ` (Feature - treated as patch in CalVer)`;
  }

  return returnVal;
}

/**
 * Custom dependency changelog function
 */
async function getDependencyReleaseLine(changesets, dependenciesUpdated, options) {
  if (dependenciesUpdated.length === 0) return '';

  const changesetLinks = changesets.map(
    changeset => `- Updated dependencies`
  );

  return changesetLinks.join('\n');
}

/**
 * Validation hook that runs before version calculation
 */
function preVersionHook(changeSummary) {
  console.log('🔍 Validating Shopify CalVer constraints...');
  
  const { releases } = changeSummary;
  
  // Check for invalid minor changes that should be patches
  const hasMinorChanges = releases.some(release => 
    release.changesets.some(changeset => 
      changeset.releases.some(r => r.type === 'minor')
    )
  );
  
  if (hasMinorChanges) {
    console.warn('⚠️  Warning: Minor changes detected. In Shopify CalVer, these are treated as patch releases.');
  }
  
  // Check for major changes without corresponding API version
  const hasMajorChanges = releases.some(release => 
    release.changesets.some(changeset => 
      changeset.releases.some(r => r.type === 'major')
    )
  );
  
  if (hasMajorChanges) {
    console.log('🚀 Major changes detected. This will create a new API version release.');
    console.log('📅 Ensure this aligns with Shopify\'s quarterly API release schedule.');
  }
  
  console.log('✅ CalVer validation complete');
}

module.exports = {
  getReleaseLine,
  getDependencyReleaseLine,
  validateShopifyCalVer,
  calculateNextCalVer,
  preVersionHook
};