import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSupportedVersions,
  getLatestVersion,
  getCurrentVersionSet,
  getAllSupportedVersions,
  getStableVersions,
  classifyVersion,
} from '../../scripts/version-utils.js';

describe('version-utils', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2025-08-13'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getSupportedVersions', () => {
    it('should return 4 supported versions including unstable', () => {
      const versions = getSupportedVersions();

      expect(versions).toHaveLength(4);
      expect(versions).toContain('unstable');

      // First 3 should be valid API versions
      versions.slice(0, 3).forEach((version) => {
        expect(version).toMatch(/^\d{4}-(01|04|07|10)$/);
      });
    });

    it('should return versions from current version set', () => {
      const versionSet = getCurrentVersionSet();
      const versions = getSupportedVersions();

      expect(versions[0]).toBe(versionSet.current);
      expect(versions[1]).toBe(versionSet.previous);
      expect(versions[2]).toBe(versionSet.releaseCandidate);
      expect(versions[3]).toBe(versionSet.unstable);
    });

    it('should always include unstable as last version', () => {
      const versions = getSupportedVersions();
      expect(versions[versions.length - 1]).toBe('unstable');
    });
  });

  describe('getCurrentVersionSet', () => {
    it('should return valid version set for August 2025', () => {
      const versionSet = getCurrentVersionSet();

      expect(versionSet.current).toBe('2025-07');
      expect(versionSet.previous).toBe('2025-04');
      expect(versionSet.releaseCandidate).toBe('2025-10');
      expect(versionSet.unstable).toBe('unstable');
    });

    it('should update based on date', () => {
      // Test Q4
      vi.setSystemTime(new Date('2025-10-15'));
      const versionSet = getCurrentVersionSet();

      expect(versionSet.current).toBe('2025-10');
      expect(versionSet.previous).toBe('2025-07');
      expect(versionSet.releaseCandidate).toBe('2026-01');
      expect(versionSet.unstable).toBe('unstable');
    });

    it('should handle year transitions', () => {
      // Test end of year
      vi.setSystemTime(new Date('2024-12-31'));
      const versionSet = getCurrentVersionSet();

      expect(versionSet.current).toBe('2024-10');
      expect(versionSet.previous).toBe('2024-07');
      expect(versionSet.releaseCandidate).toBe('2025-01');
      expect(versionSet.unstable).toBe('unstable');
    });
  });

  describe('getLatestVersion', () => {
    it('should return the current version', () => {
      const latest = getLatestVersion();
      const versionSet = getCurrentVersionSet();

      expect(latest).toBe(versionSet.current);
      expect(latest).toMatch(/^\d{4}-(01|04|07|10)$/);
    });
  });

  describe('getStableVersions', () => {
    it('should return only current and previous versions', () => {
      const stableVersions = getStableVersions();
      const versionSet = getCurrentVersionSet();

      expect(stableVersions).toHaveLength(2);
      expect(stableVersions[0]).toBe(versionSet.current);
      expect(stableVersions[1]).toBe(versionSet.previous);
    });
  });

  describe('classifyVersion', () => {
    it('should classify versions correctly', () => {
      const versionSet = getCurrentVersionSet();

      expect(classifyVersion(versionSet.current)).toBe('current');
      expect(classifyVersion(versionSet.previous)).toBe('previous');
      expect(classifyVersion(versionSet.releaseCandidate)).toBe(
        'release-candidate',
      );
      expect(classifyVersion('unstable')).toBe('unstable');
    });

    it('should classify unknown versions as previous', () => {
      expect(classifyVersion('2023-01')).toBe('previous');
      expect(classifyVersion('2024-01')).toBe('previous');
    });
  });

  describe('getAllSupportedVersions', () => {
    it('should return the same as getSupportedVersions', () => {
      const all = getAllSupportedVersions();
      const supported = getSupportedVersions();

      expect(all).toEqual(supported);
    });
  });
});
