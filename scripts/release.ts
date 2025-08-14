import { execSync } from 'child_process';
import fs from 'fs/promises';
import { match } from 'ts-pattern';
import {
  calculateNextVersion,
  detectChangesetTypes,
  validateCalVerFormat,
  getVersionInfo,
} from './calver-version.js';
import {
  createFileOperationHandler,
  handleOperationResult,
} from '../src/lib/patterns.js';

interface ReleaseOptions {
  dryRun?: boolean;
  skipBuild?: boolean;
  skipTests?: boolean;
}

/**
 * Custom release process for CalVer versioning
 */
async function runRelease(options: ReleaseOptions = {}): Promise<void> {
  console.log('🚀 Starting CalVer release process...\n');

  const fileHandler = createFileOperationHandler();

  try {
    // 1. Read current package.json version
    const packageResult = await fileHandler(
      { operation: 'read', target: './package.json' },
      async () => {
        const content = await fs.readFile('./package.json', 'utf-8');
        return { content, size: Buffer.byteLength(content, 'utf-8') };
      },
    );

    if (!packageResult.success) {
      throw new Error(`Failed to read package.json: ${packageResult.error}`);
    }

    const packageJson = JSON.parse(packageResult.data.content);
    const currentVersion = packageJson.version;

    if (!validateCalVerFormat(currentVersion)) {
      throw new Error(
        `Current version ${currentVersion} is not in CalVer format (YYYY.M.PATCH)`,
      );
    }

    console.log(`📦 Current version: ${currentVersion}`);

    // 2. Detect changeset types
    const { hasMajor, hasPatches } = detectChangesetTypes();

    if (!hasMajor && !hasPatches) {
      console.log('ℹ️  No changesets detected. Nothing to release.');
      return;
    }

    const changeType = hasMajor ? 'major' : 'patch';
    console.log(
      `📝 Change type detected: ${changeType} (${hasMajor ? 'API update' : 'bug fixes'})`,
    );

    // 3. Calculate next version
    const versionInfo = calculateNextVersion(currentVersion, changeType);
    console.log(`🎯 Next version: ${versionInfo.nextVersion}`);

    if (versionInfo.apiVersion) {
      console.log(`🌐 Target API version: ${versionInfo.apiVersion}`);
    }

    // Display version info
    const currentInfo = getVersionInfo(currentVersion);
    const nextInfo = getVersionInfo(versionInfo.nextVersion);

    console.log('\n📊 Version Analysis:');
    console.log(
      `   Current: ${currentVersion} (API ${currentInfo.apiVersion}, Q${Math.ceil(currentInfo.month / 3)} ${currentInfo.year})`,
    );
    console.log(
      `   Next:    ${versionInfo.nextVersion} (API ${nextInfo.apiVersion}, Q${Math.ceil(nextInfo.month / 3)} ${nextInfo.year})`,
    );

    if (options.dryRun) {
      console.log('\n🔍 Dry run mode - would make these changes:');
      console.log(
        `   - Update package.json version to ${versionInfo.nextVersion}`,
      );
      console.log(`   - Run changeset version to update changelog`);
      console.log(`   - Run build and tests`);
      console.log(`   - Create git tag v${versionInfo.nextVersion}`);
      console.log(
        `   - Generate new README with version ${versionInfo.nextVersion}`,
      );
      return;
    }

    // 4. Update package.json
    packageJson.version = versionInfo.nextVersion;

    const writeResult = await fileHandler(
      { operation: 'write', target: './package.json' },
      async () => {
        const content = JSON.stringify(packageJson, null, 2) + '\n';
        await fs.writeFile('./package.json', content, 'utf-8');
        return { size: Buffer.byteLength(content, 'utf-8') };
      },
    );

    await handleOperationResult(writeResult, {
      onSuccess: () =>
        console.log(
          `✅ Updated package.json to version ${versionInfo.nextVersion}`,
        ),
      onError: (error) => {
        throw new Error(`Failed to update package.json: ${error}`);
      },
    });

    // 5. Run changeset version
    console.log('\n📝 Running changeset version...');
    execSync('npx changeset version', { stdio: 'inherit' });

    // 6. Run tests (unless skipped)
    if (!options.skipTests) {
      console.log('\n🧪 Running tests...');
      execSync('npm test', { stdio: 'inherit' });
    }

    // 7. Run build (unless skipped)
    if (!options.skipBuild) {
      console.log('\n🏗️  Running build...');
      execSync('npm run build', { stdio: 'inherit' });
    }

    // 8. Update documentation
    console.log('\n📚 Updating documentation...');
    execSync('npm run docs', { stdio: 'inherit' });

    // 9. Create git tag
    console.log(`\n🏷️  Creating git tag v${versionInfo.nextVersion}...`);
    execSync(`git add .`);
    execSync(`git commit -m "Release v${versionInfo.nextVersion}"`);
    execSync(`git tag v${versionInfo.nextVersion}`);

    console.log(
      `\n🎉 Release ${versionInfo.nextVersion} completed successfully!`,
    );
    console.log(`\nNext steps:`);
    console.log(`  - Review the changes: git show v${versionInfo.nextVersion}`);
    console.log(`  - Push to remote: git push origin main --tags`);
    console.log(`  - Publish to npm: npm publish`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Release failed: ${errorMessage}`);
    process.exit(1);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options: ReleaseOptions = {};

  // Parse CLI arguments
  for (const arg of args) {
    match(arg)
      .with('--dry-run', () => {
        options.dryRun = true;
      })
      .with('--skip-build', () => {
        options.skipBuild = true;
      })
      .with('--skip-tests', () => {
        options.skipTests = true;
      })
      .with('--help', () => {
        console.log('Usage: tsx scripts/release.ts [options]');
        console.log('');
        console.log('Options:');
        console.log(
          '  --dry-run     Show what would be done without making changes',
        );
        console.log('  --skip-build  Skip the build step');
        console.log('  --skip-tests  Skip the test step');
        console.log('  --help        Show this help message');
        console.log('');
        console.log('Examples:');
        console.log('  tsx scripts/release.ts              # Full release');
        console.log('  tsx scripts/release.ts --dry-run    # Preview release');
        process.exit(0);
      })
      .otherwise(() => {
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
      });
  }

  runRelease(options).catch(console.error);
}

export { runRelease };
