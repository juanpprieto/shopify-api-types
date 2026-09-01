import fs from 'fs/promises';
import path from 'path';
import {
  getCurrentVersionSet,
  getAdjacentVersionPairs,
} from './version-utils.js';
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

  // All adjacent version pairs, oldest first:
  // older[1] → older[0] → previous → current → releaseCandidate
  const pairs = getAdjacentVersionPairs(versionSet);

  console.log(`📋 Generating comparisons:`);
  pairs.forEach(({ from, to }) => console.log(`   ${from} → ${to}`));
  console.log(`   Output: ${outputDir}\n`);

  try {
    for (const { from, to } of pairs) {
      console.log(`🔍 Generating comparison ${from} → ${to}...`);
      const comparison = await generateComparisonData(from, to);

      const filePath = path.join(outputDir, `${from}-to-${to}.json`);
      await fs.writeFile(
        filePath,
        JSON.stringify(comparison, null, 2),
        'utf-8',
      );
      console.log(`✅ Saved: ${filePath}`);
    }

    // Generate comparison manifest: every adjacent pair, plus the
    // current/next semantic aliases
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
        adjacent: pairs.map(({ from, to }) => ({
          from,
          to,
          file: `${from}-to-${to}.json`,
        })),
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
