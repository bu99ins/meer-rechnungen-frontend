import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDate } from './format';

// Regression coverage for the PDF/list/details date-mismatch bug: the backend now sends and
// accepts plain calendar dates ("yyyy-MM-dd", no time, no timezone). Display must render the exact
// calendar day, in every viewer timezone, without ever routing the value through `new Date()` in a
// way that reads it back via local-timezone accessors — that would silently reintroduce an
// off-by-one day depending on the machine's zone.
describe('formatDate — timezone independence', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const zones = ['UTC', 'Pacific/Kiritimati', 'Pacific/Niue'] as const; // UTC, UTC+14, UTC-11

  for (const tz of zones) {
    describe(`in ${tz}`, () => {
      beforeEach(() => {
        vi.stubEnv('TZ', tz);
      });

      it('renders the exact calendar day, never shifted', () => {
        const expected = new Date(Date.UTC(2026, 7, 10)).toLocaleDateString(undefined, { timeZone: 'UTC' });
        expect(formatDate('2026-08-10')).toBe(expected);
      });
    });
  }

  it('returns a placeholder for an empty value', () => {
    expect(formatDate(undefined)).toBe('-');
    expect(formatDate('')).toBe('-');
  });

  it('returns the raw value unchanged if it is not a plain calendar date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });

  it('returns the raw value unchanged for an out-of-range month or day', () => {
    expect(formatDate('2026-13-01')).toBe('2026-13-01');
    expect(formatDate('2026-01-32')).toBe('2026-01-32');
  });
});
