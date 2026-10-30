import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCurrentVersionSet,
  getSupportedVersions,
  classifyVersion,
  isVersionSupported,
  getVersionMetadata,
} from '../../scripts/version-utils.js';
import type { VersionSet, ExtendedApiVersion } from '../../scripts/lib/zod.js';

describe('Support-Window Version Model', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2025-08-13'));
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env['RELEASE_DATE'];
  });

  describe('getCurrentVersionSet', () => {
    it('should return correct version set for Q3 (July release)', () => {
      const versionSet = getCurrentVersionSet();

      expect(versionSet).toEqual({
        current: '2025-07',
        previous: '2025-04',
        olderSupported: ['2025-01', '2024-10'],
        releaseCandidate: '2025-10',
        unstable: 'unstable',
      });
    });

    it('should handle Q4 to Q1 transition correctly', () => {
      vi.setSystemTime(new Date('2025-10-15'));
      const versionSet = getCurrentVersionSet();

      expect(versionSet).toEqual({
        current: '2025-10',
        previous: '2025-07',
        olderSupported: ['2025-04', '2025-01'],
        releaseCandidate: '2026-01',
        unstable: 'unstable',
      });
    });

    it('should handle Q1 correctly', () => {
      vi.setSystemTime(new Date('2025-01-20'));
      const versionSet = getCurrentVersionSet();

      expect(versionSet).toEqual({
        current: '2025-01',
        previous: '2024-10',
        olderSupported: ['2024-07', '2024-04'],
        releaseCandidate: '2025-04',
        unstable: 'unstable',
      });
    });

    it('should handle Q2 correctly', () => {
      vi.setSystemTime(new Date('2025-04-20'));
      const versionSet = getCurrentVersionSet();

      expect(versionSet).toEqual({
        current: '2025-04',
        previous: '2025-01',
        olderSupported: ['2024-10', '2024-07'],
        releaseCandidate: '2025-07',
        unstable: 'unstable',
      });
    });

    it('should always include unstable version', () => {
      const dates = ['2025-01-15', '2025-04-15', '2025-07-15', '2025-10-15'];

      dates.forEach((date) => {
        vi.setSystemTime(new Date(date));
        const versionSet = getCurrentVersionSet();
        expect(versionSet.unstable).toBe('unstable');
      });
    });
  });

  describe('RELEASE_DATE override', () => {
    it('should compute the version set from RELEASE_DATE when set', () => {
      process.env['RELEASE_DATE'] = '2026-01-15';
      const versionSet = getCurrentVersionSet();

      expect(versionSet).toEqual({
        current: '2026-01',
        previous: '2025-10',
        olderSupported: ['2025-07', '2025-04'],
        releaseCandidate: '2026-04',
        unstable: 'unstable',
      });
    });

    it('should ignore the system date when RELEASE_DATE is set', () => {
      vi.setSystemTime(new Date('2030-06-01'));
      process.env['RELEASE_DATE'] = '2026-04-20';
      const versionSet = getCurrentVersionSet();

      expect(versionSet.current).toBe('2026-04');
      expect(versionSet.previous).toBe('2026-01');
      expect(versionSet.olderSupported).toEqual(['2025-10', '2025-07']);
      expect(versionSet.releaseCandidate).toBe('2026-07');
    });

    it('should throw on an invalid RELEASE_DATE', () => {
      process.env['RELEASE_DATE'] = 'not-a-date';
      expect(() => getCurrentVersionSet()).toThrow('Invalid RELEASE_DATE');
    });
  });

  describe('getSupportedVersions', () => {
    it('should return exactly 6 versions', () => {
      const versions = getSupportedVersions();
      expect(versions).toHaveLength(6);
    });

    it('should return versions in correct order', () => {
      const versions = getSupportedVersions();
      const versionSet = getCurrentVersionSet();

      expect(versions[0]).toBe(versionSet.current);
      expect(versions[1]).toBe(versionSet.previous);
      expect(versions[2]).toBe(versionSet.olderSupported[0]);
      expect(versions[3]).toBe(versionSet.olderSupported[1]);
      expect(versions[4]).toBe(versionSet.releaseCandidate);
      expect(versions[5]).toBe(versionSet.unstable);
    });

    it('should not include retired versions in Q3 2025', () => {
      const versions = getSupportedVersions();

      expect(versions).not.toContain('2024-07');
      expect(versions).not.toContain('2024-04');
    });
  });

  describe('classifyVersion', () => {
    it('should correctly classify all version types', () => {
      const versionSet = getCurrentVersionSet();

      expect(classifyVersion(versionSet.current)).toBe('current');
      expect(classifyVersion(versionSet.previous)).toBe('previous');
      versionSet.olderSupported.forEach((version) => {
        expect(classifyVersion(version)).toBe('previous');
      });
      expect(classifyVersion(versionSet.releaseCandidate)).toBe(
        'release-candidate',
      );
      expect(classifyVersion('unstable')).toBe('unstable');
    });

    it('should classify unknown versions as previous', () => {
      expect(classifyVersion('2024-04' as ExtendedApiVersion)).toBe('previous');
      expect(classifyVersion('2023-10' as ExtendedApiVersion)).toBe('previous');
    });

    it('should work with custom version set', () => {
      const customVersionSet: VersionSet = {
        current: '2025-04',
        previous: '2025-01',
        olderSupported: ['2024-10', '2024-07'],
        releaseCandidate: '2025-07',
        unstable: 'unstable',
      };

      expect(classifyVersion('2025-04', customVersionSet)).toBe('current');
      expect(classifyVersion('2025-01', customVersionSet)).toBe('previous');
      expect(classifyVersion('2024-10', customVersionSet)).toBe('previous');
      expect(classifyVersion('2025-07', customVersionSet)).toBe(
        'release-candidate',
      );
    });
  });

  describe('isVersionSupported', () => {
    it('should return true for all supported versions', () => {
      const versionSet = getCurrentVersionSet();

      expect(isVersionSupported(versionSet.current)).toBe(true);
      expect(isVersionSupported(versionSet.previous)).toBe(true);
      versionSet.olderSupported.forEach((v) => {
        expect(isVersionSupported(v)).toBe(true);
      });
      expect(isVersionSupported(versionSet.releaseCandidate)).toBe(true);
      expect(isVersionSupported('unstable')).toBe(true);
    });

    it('should return false for retired versions', () => {
      expect(isVersionSupported('2024-07')).toBe(false);
      expect(isVersionSupported('2024-04')).toBe(false);
      expect(isVersionSupported('2023-10')).toBe(false);
    });

    it('should return false for invalid version formats', () => {
      expect(isVersionSupported('2025-13')).toBe(false);
      expect(isVersionSupported('2025-00')).toBe(false);
      expect(isVersionSupported('invalid')).toBe(false);
      expect(isVersionSupported('')).toBe(false);
    });
  });

  describe('getVersionMetadata', () => {
    it('should return correct metadata for current version', () => {
      const versionSet = getCurrentVersionSet();
      const metadata = getVersionMetadata(versionSet.current);

      expect(metadata.status).toBe('stable');
      expect(metadata.description).toContain('Current stable release');
    });

    it('should return correct metadata for previous version', () => {
      const versionSet = getCurrentVersionSet();
      const metadata = getVersionMetadata(versionSet.previous);

      expect(metadata.status).toBe('stable');
      expect(metadata.description).toContain('Previous stable release');
    });

    it('should return stable metadata for older supported versions', () => {
      const versionSet = getCurrentVersionSet();

      versionSet.olderSupported.forEach((version) => {
        const metadata = getVersionMetadata(version);
        expect(metadata.status).toBe('stable');
      });
    });

    it('should return correct metadata for release candidate', () => {
      const versionSet = getCurrentVersionSet();
      const metadata = getVersionMetadata(versionSet.releaseCandidate);

      expect(metadata.status).toBe('preview');
      expect(metadata.description).toContain('Release candidate');
    });

    it('should return correct metadata for unstable', () => {
      const metadata = getVersionMetadata('unstable');

      expect(metadata.status).toBe('experimental');
      expect(metadata.description).toContain('Unstable development version');
    });

    it('should return deprecated metadata for unsupported versions', () => {
      const metadata = getVersionMetadata('2024-04' as ExtendedApiVersion);

      expect(metadata.status).toBe('deprecated');
      expect(metadata.description).toContain('No longer supported');
    });
  });

  describe('Version Set Consistency', () => {
    it('should maintain consistency across different quarters', () => {
      const quarters = [
        {
          date: '2025-01-15',
          current: '2025-01',
          previous: '2024-10',
          older: ['2024-07', '2024-04'],
          rc: '2025-04',
        },
        {
          date: '2025-04-15',
          current: '2025-04',
          previous: '2025-01',
          older: ['2024-10', '2024-07'],
          rc: '2025-07',
        },
        {
          date: '2025-07-15',
          current: '2025-07',
          previous: '2025-04',
          older: ['2025-01', '2024-10'],
          rc: '2025-10',
        },
        {
          date: '2025-10-15',
          current: '2025-10',
          previous: '2025-07',
          older: ['2025-04', '2025-01'],
          rc: '2026-01',
        },
      ];

      quarters.forEach(({ date, current, previous, older, rc }) => {
        vi.setSystemTime(new Date(date));
        const versionSet = getCurrentVersionSet();

        expect(versionSet.current).toBe(current);
        expect(versionSet.previous).toBe(previous);
        expect(versionSet.olderSupported).toEqual(older);
        expect(versionSet.releaseCandidate).toBe(rc);
        expect(versionSet.unstable).toBe('unstable');

        // Verify all versions are properly formatted
        const stable = [
          versionSet.current,
          versionSet.previous,
          ...versionSet.olderSupported,
          versionSet.releaseCandidate,
        ];
        stable.forEach((v) => {
          expect(v).toMatch(/^\d{4}-(01|04|07|10)$/);
        });
      });
    });

    it('should have exactly 6 unique versions', () => {
      const versions = getSupportedVersions();
      const uniqueVersions = new Set(versions);

      expect(uniqueVersions.size).toBe(6);
    });
  });
});
