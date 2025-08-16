import fs from 'fs/promises';
import path from 'path';
import { getCurrentVersionSet } from './version-utils.js';
import { generateComparisonData } from './generate-changelog.js';

/**
 * Generate all version comparisons for the build process
 */
async function generateComparisonFiles(): Promise<void> {
  console.log('🔄 Generating schema comparisons for documentation...\n');

  const versionSet = getCurrentVersionSet();
  const outputDir = './dist/comparisons';

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`📋 Generating comparisons:`);
  console.log(
    `   Previous → Current: ${versionSet.previous} → ${versionSet.current}`,
  );
  console.log(
    `   Current → Next: ${versionSet.current} → ${versionSet.releaseCandidate}`,
  );
  console.log(`   Output: ${outputDir}\n`);

  try {
    // Generate previous → current comparison (what's new in latest release)
    console.log('🔍 Generating current release comparison...');
    const currentComparisons = await generateComparisonData(
      versionSet.previous,
      versionSet.current,
    );

    const currentPath = path.join(
      outputDir,
      `${versionSet.previous}-to-${versionSet.current}.json`,
    );
    await fs.writeFile(
      currentPath,
      JSON.stringify(currentComparisons, null, 2),
      'utf-8',
    );
    console.log(`✅ Saved: ${currentPath}`);

    // Generate current → next comparison (what's coming in RC)
    console.log('🔍 Generating next release comparison...');
    const nextComparisons = await generateComparisonData(
      versionSet.current,
      versionSet.releaseCandidate,
    );

    const nextPath = path.join(
      outputDir,
      `${versionSet.current}-to-${versionSet.releaseCandidate}.json`,
    );
    await fs.writeFile(
      nextPath,
      JSON.stringify(nextComparisons, null, 2),
      'utf-8',
    );
    console.log(`✅ Saved: ${nextPath}`);

    // Generate comparison manifest
    const manifest = {
      generatedAt: new Date().toISOString(),
      versionSet,
      comparisons: {
        current: {
          from: versionSet.previous,
          to: versionSet.current,
          file: `${versionSet.previous}-to-${versionSet.current}.json`,
        },
        next: {
          from: versionSet.current,
          to: versionSet.releaseCandidate,
          file: `${versionSet.current}-to-${versionSet.releaseCandidate}.json`,
        },
      },
    };

    const manifestPath = path.join(outputDir, 'manifest.json');
    await fs.writeFile(
      manifestPath,
      JSON.stringify(manifest, null, 2),
      'utf-8',
    );
    console.log(`✅ Saved: ${manifestPath}`);

    console.log('\n🎉 Schema comparisons generated successfully!');
    console.log(`   📁 Available in: ${path.resolve(outputDir)}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Comparison generation failed:', errorMessage);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateComparisonFiles().catch(console.error);
}

export { generateComparisonFiles };
