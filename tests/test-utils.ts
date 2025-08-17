import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

/**
 * Create a temporary directory for testing
 */
export async function createTempDir(prefix: string = 'test-'): Promise<string> {
  const tempDir = path.join(
    tmpdir(),
    `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  );
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Clean up a temporary directory
 */
export async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors in tests
    console.error(`Failed to cleanup temp dir ${tempDir}:`, error);
  }
}

/**
 * Create a mock package.json file
 */
export async function createMockPackageJson(
  dir: string,
  content: Record<string, unknown> = {},
): Promise<string> {
  const defaultContent = {
    name: 'test-package',
    version: '1.0.0',
    exports: {},
    typesVersions: {},
  };

  const packagePath = path.join(dir, 'package.json');
  await fs.writeFile(
    packagePath,
    JSON.stringify({ ...defaultContent, ...content }, null, 2),
    'utf-8',
  );
  return packagePath;
}

/**
 * Create mock directory structure
 */
export async function createMockDirStructure(
  baseDir: string,
  structure: Record<string, string | Record<string, unknown>>,
): Promise<void> {
  for (const [key, value] of Object.entries(structure)) {
    const fullPath = path.join(baseDir, key);

    if (typeof value === 'string') {
      // It's a file
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, value, 'utf-8');
    } else {
      // It's a directory with nested structure
      await fs.mkdir(fullPath, { recursive: true });
      await createMockDirStructure(
        fullPath,
        value as Record<string, string | Record<string, unknown>>,
      );
    }
  }
}

/**
 * Read JSON file and return parsed content
 */
export async function readJsonFile(filePath: string): Promise<unknown> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all files in a directory recursively
 */
export async function getFilesRecursively(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function traverse(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else {
        files.push(path.relative(dir, fullPath));
      }
    }
  }

  await traverse(dir);
  return files.sort();
}
