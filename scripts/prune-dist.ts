import fs from 'fs/promises';
import path from 'path';
import { getSupportedVersions } from './version-utils.js';
import { SUPPORTED_APIS } from '../src/lib/zod.js';

/**
 * Remove dist version dirs that are outside the current version set.
 *
 * The build compiles every version dir present in src (src keeps retired
 * versions forever - see CONTRIBUTING.md "Release Crossroads"), but the
 * published package must ship only the release window. Runs as part of
 * postbuild so prepublishOnly rebuilds always produce a clean dist.
 * Honors RELEASE_DATE like the rest of the version tooling.
 */
async function pruneDist(): Promise<void> {
  const supported = new Set<string>(getSupportedVersions());
  let pruned = 0;

  for (const api of SUPPORTED_APIS) {
    const apiDir = path.join('dist', api);
    const entries = await fs
      .readdir(apiDir, { withFileTypes: true })
      .catch(() => []);

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (supported.has(entry.name)) continue;

      await fs.rm(path.join(apiDir, entry.name), {
        recursive: true,
        force: true,
      });
      console.log(`✂ Pruned dist/${api}/${entry.name} (outside version set)`);
      pruned++;
    }
  }

  console.log(
    pruned > 0
      ? `✅ Pruned ${pruned} out-of-window dist dir(s)`
      : '✅ dist contains only the supported version set',
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  pruneDist().catch((error) => {
    console.error('❌ dist prune failed:', error);
    process.exit(1);
  });
}

export { pruneDist };
