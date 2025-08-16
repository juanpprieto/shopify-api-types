import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { commands, type Command } from '../../scripts/generate.js';

// Mock the individual generation functions
vi.mock('../../scripts/generate-exports.js', () => ({
  generatePackageExports: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../scripts/generate-indexes.js', () => ({
  generateIndexFiles: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../scripts/generate-comparisons.js', () => ({
  generateComparisonFiles: vi.fn().mockResolvedValue(undefined),
}));

import { generatePackageExports } from '../../scripts/generate-exports.js';
import { generateIndexFiles } from '../../scripts/generate-indexes.js';
import { generateComparisonFiles } from '../../scripts/generate-comparisons.js';

describe('Consolidated Generate Script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Command Structure', () => {
    it('should have all required commands', () => {
      const expectedCommands: Command[] = [
        'exports',
        'indexes',
        'comparisons',
        'all',
      ];
      const actualCommands = Object.keys(commands);

      expect(actualCommands).toEqual(expectedCommands);
    });

    it('should have descriptions for all commands', () => {
      Object.entries(commands).forEach(([, command]) => {
        expect(command.description).toBeTruthy();
        expect(command.description.length).toBeGreaterThan(10);
      });
    });

    it('should have run functions for all commands', () => {
      Object.entries(commands).forEach(([, command]) => {
        expect(typeof command.run).toBe('function');
      });
    });
  });

  describe('Individual Commands', () => {
    it('should run exports command', async () => {
      await commands.exports.run();

      expect(generatePackageExports).toHaveBeenCalledTimes(1);
      expect(generateIndexFiles).not.toHaveBeenCalled();
      expect(generateComparisonFiles).not.toHaveBeenCalled();
    });

    it('should run indexes command', async () => {
      await commands.indexes.run();

      expect(generateIndexFiles).toHaveBeenCalledTimes(1);
      expect(generatePackageExports).not.toHaveBeenCalled();
      expect(generateComparisonFiles).not.toHaveBeenCalled();
    });

    it('should run comparisons command', async () => {
      await commands.comparisons.run();

      expect(generateComparisonFiles).toHaveBeenCalledTimes(1);
      expect(generatePackageExports).not.toHaveBeenCalled();
      expect(generateIndexFiles).not.toHaveBeenCalled();
    });
  });

  describe('All Command', () => {
    it('should run all commands in correct order', async () => {
      const callOrder: string[] = [];

      vi.mocked(generateIndexFiles).mockImplementation(async () => {
        callOrder.push('indexes');
      });

      vi.mocked(generatePackageExports).mockImplementation(async () => {
        callOrder.push('exports');
      });

      vi.mocked(generateComparisonFiles).mockImplementation(async () => {
        callOrder.push('comparisons');
      });

      await commands.all.run();

      // Verify all were called
      expect(generateIndexFiles).toHaveBeenCalledTimes(1);
      expect(generatePackageExports).toHaveBeenCalledTimes(1);
      expect(generateComparisonFiles).toHaveBeenCalledTimes(1);

      // Verify correct order
      expect(callOrder).toEqual(['indexes', 'exports', 'comparisons']);
    });

    it('should handle errors in all command', async () => {
      const testError = new Error('Test error');
      vi.mocked(generateIndexFiles).mockRejectedValue(testError);

      await expect(commands.all.run()).rejects.toThrow('Test error');

      // Should stop at first error
      expect(generateIndexFiles).toHaveBeenCalledTimes(1);
      expect(generatePackageExports).not.toHaveBeenCalled();
      expect(generateComparisonFiles).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in individual commands', async () => {
      const testError = new Error('Export generation failed');
      vi.mocked(generatePackageExports).mockRejectedValue(testError);

      await expect(commands.exports.run()).rejects.toThrow(
        'Export generation failed',
      );
    });

    it('should propagate async errors', async () => {
      const testError = new Error('Async error');
      vi.mocked(generateIndexFiles).mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw testError;
      });

      await expect(commands.indexes.run()).rejects.toThrow('Async error');
    });
  });
});
