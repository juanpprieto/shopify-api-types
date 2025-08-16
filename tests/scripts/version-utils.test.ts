import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getLastFourVersions,
  getLatestVersion,
} from '../../scripts/version-utils.js';

describe('version-utils', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2025-08-13'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getLastFourVersions', () => {
    it('should return 4 valid API versions in descending order', () => {
      const versions = getLastFourVersions();

      expect(versions).toHaveLength(4);
      versions.forEach((version) => {
        expect(version).toMatch(/^\d{4}-(01|04|07|10)$/);
      });

      // Verify descending order
      for (let i = 0; i < versions.length - 1; i++) {
        const current = new Date(versions[i] + '-01');
        const next = new Date(versions[i + 1] + '-01');
        expect(current.getTime()).toBeGreaterThan(next.getTime());
      }
    });

    it('should return correct versions for each quarter', () => {
      // Test Q3 (August)
      expect(getLastFourVersions()).toEqual([
        '2025-07',
        '2025-04',
        '2025-01',
        '2024-10',
      ]);

      // Test Q1
      vi.setSystemTime(new Date('2025-01-15'));
      expect(getLastFourVersions()).toEqual([
        '2025-01',
        '2024-10',
        '2024-07',
        '2024-04',
      ]);

      // Test Q4
      vi.setSystemTime(new Date('2025-10-05'));
      expect(getLastFourVersions()).toEqual([
        '2025-10',
        '2025-07',
        '2025-04',
        '2025-01',
      ]);
    });

    it('should handle year transitions', () => {
      // Test a date in December before Q1 starts
      vi.setSystemTime(new Date('2024-12-31')); // End of year
      const versions = getLastFourVersions();

      expect(versions[0]).toBe('2024-10'); // Still in Q4 2024
      expect(versions[1]).toBe('2024-07'); // Previous is Q3 2024
      expect(versions[2]).toBe('2024-04'); // Then Q2 2024
      expect(versions[3]).toBe('2024-01'); // Then Q1 2024
    });
  });

  describe('getLatestVersion', () => {
    it('should return the latest version', () => {
      const latest = getLatestVersion();
      const allVersions = getLastFourVersions();

      expect(latest).toBe(allVersions[0]);
      expect(latest).toMatch(/^\d{4}-(01|04|07|10)$/);
    });
  });
});
