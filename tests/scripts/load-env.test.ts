import { describe, it, expect, vi, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
  delete process.env['LOAD_ENV_TEST_KEY'];
  vi.resetModules();
});

describe('load-env', () => {
  it('lets .env win over a variable exported in the shell', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'load-env-'));
    writeFileSync(path.join(dir, '.env'), 'LOAD_ENV_TEST_KEY=from-file\n');
    process.env['LOAD_ENV_TEST_KEY'] = 'from-shell';
    process.chdir(dir);

    await import('../../scripts/lib/load-env.js');

    expect(process.env['LOAD_ENV_TEST_KEY']).toBe('from-file');
  });

  it('keeps the shell value when there is no .env', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'load-env-'));
    process.env['LOAD_ENV_TEST_KEY'] = 'from-shell';
    process.chdir(dir);

    await import('../../scripts/lib/load-env.js');

    expect(process.env['LOAD_ENV_TEST_KEY']).toBe('from-shell');
  });
});
