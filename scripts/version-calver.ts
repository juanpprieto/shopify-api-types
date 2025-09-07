#!/usr/bin/env tsx
/**
 * CalVer-aware Changeset Version Script
 *
 * This script wraps `changeset version` to ensure proper Shopify CalVer versioning:
 * 1. Runs `changeset version` (normal SemVer workflow)
 * 2. Corrects the version to follow CalVer constraints
 * 3. Updates package.json and CHANGELOG.md with correct CalVer
 *
 * Usage: tsx scripts/version-calver.ts [--dry-run]
 */

import { execSync } from 'child_process';

/**
 * Run CalVer-aware changeset version
 */
async function runCalVerChangeset(): Promise<void> {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('🦋 CalVer Changeset Version');
  console.log('============================');

  if (isDryRun) {
    console.log('🧪 Dry run mode - no changes will be made');

    // For dry run, just run changeset version --dry-run and show what would happen
    console.log('');
    console.log('1️⃣ Running changeset version --dry-run...');
    execSync('npx changeset version --dry-run', { stdio: 'inherit' });

    console.log('');
    console.log('2️⃣ CalVer correction would run after this...');
    console.log('💡 Run without --dry-run to apply CalVer corrections');
  } else {
    console.log('');
    console.log('1️⃣ Running changeset version...');

    try {
      execSync('npx changeset version', { stdio: 'inherit' });
      console.log('✅ Changeset version completed');
    } catch (error) {
      console.error('❌ Changeset version failed:', error);
      process.exit(1);
    }

    console.log('');
    console.log('2️⃣ Applying CalVer corrections...');

    try {
      execSync('tsx scripts/calver-correct.ts', { stdio: 'inherit' });
      console.log('✅ CalVer correction completed');
    } catch (error) {
      console.error('❌ CalVer correction failed:', error);
      console.log(
        '⚠️ Changeset version completed but CalVer correction failed',
      );
      console.log(
        '💡 You may need to manually correct the version in package.json',
      );
      process.exit(1);
    }

    console.log('');
    console.log('🎉 CalVer changeset version complete!');
    console.log('💡 Review the changes and commit when ready');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCalVerChangeset().catch((error) => {
    console.error('❌ CalVer changeset failed:', error);
    process.exit(1);
  });
}
