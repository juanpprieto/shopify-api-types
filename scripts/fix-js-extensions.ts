#!/usr/bin/env tsx
/**
 * Fix .js extensions in generated .d.ts files and schema paths
 *
 * 1. TypeScript generates imports with .js extensions in declaration files,
 *    but this breaks module resolution when the actual files are .d.ts
 * 2. Schema imports point to graphql-schemas in source, but schemas in dist
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, relative } from 'path';

async function fixJsExtensions(dir: string): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subdirectories
      await fixJsExtensions(fullPath);
    } else if (entry.name.endsWith('.d.ts')) {
      // Process .d.ts files
      let content = await readFile(fullPath, 'utf-8');

      // Replace .js extensions in imports/exports
      const originalContent = content;
      content = content.replace(/(from\s+['"]\..*?)\.js(['"])/g, '$1$2');
      content = content.replace(/(import\s+['"]\..*?)\.js(['"])/g, '$1$2');

      // Fix schema paths (graphql-schemas -> schemas)
      content = content.replace(
        /\.\.\/\.\.\/graphql-schemas\//g,
        '../../schemas/',
      );

      if (content !== originalContent) {
        await writeFile(fullPath, content, 'utf-8');
        console.log(`✅ Fixed: ${relative(process.cwd(), fullPath)}`);
      }
    }
  }
}

async function main(): Promise<void> {
  console.log('🔧 Fixing .js extensions in declaration files...\n');

  try {
    await fixJsExtensions('./dist');
    console.log('\n✅ All .js extensions fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing extensions:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
