import fs from 'fs';
import path from 'path';

export function validateComparisons(): void {
  try {
    const manifestPath = 'dist/comparisons/manifest.json';

    if (!fs.existsSync(manifestPath)) {
      throw new Error('Comparison manifest not found at: ' + manifestPath);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    console.log('📋 Validating comparison manifest...');
    console.log('Generated at:', manifest.generatedAt);
    console.log('Version set:', JSON.stringify(manifest.versionSet));
    console.log(
      'Available comparisons:',
      Object.keys(manifest.comparisons).join(', '),
    );

    // Flatten manifest entries: the current/next aliases are single
    // comparisons, the adjacent key holds an array of pair comparisons
    const entries: Array<[string, { file: string }]> = [];
    for (const [key, value] of Object.entries(manifest.comparisons)) {
      if (Array.isArray(value)) {
        value.forEach(
          (comparison: { from: string; to: string; file: string }) =>
            entries.push([
              `${key} ${comparison.from}→${comparison.to}`,
              comparison,
            ]),
        );
      } else {
        entries.push([key, value as { file: string }]);
      }
    }

    // Check that comparison files exist and count APIs
    let totalApis = 0;
    for (const [key, comparison] of entries) {
      const filePath = path.join('dist/comparisons', comparison.file);
      if (!fs.existsSync(filePath)) {
        throw new Error('Missing comparison file: ' + filePath);
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<
        string,
        unknown
      >;
      const apiCount = Object.keys(data).filter((k) => data[k] !== null).length;
      console.log(
        '✅ ' + key + ': ' + apiCount + ' APIs in ' + comparison.file,
      );
      totalApis += apiCount;
    }

    console.log(
      '✅ All comparison files validated, ' +
        totalApis +
        ' API comparisons total',
    );
    // Success - no return needed for void function
  } catch (error) {
    console.error(
      '❌ Comparison validation failed:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateComparisons();
}
