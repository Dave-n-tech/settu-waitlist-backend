import { describe, expect, it } from 'vitest';
import { waitlistEntriesToCsv } from '../src/csv.js';

describe('waitlistEntriesToCsv', () => {
  it('quotes headers and escapes commas, quotes, and newlines', () => {
    const csv = waitlistEntriesToCsv([
      {
        id: 'entry-1',
        name: 'Zara, "Z"',
        businessName: 'Zara Couture',
        businessType: 'Fashion\nTailoring',
        whatsapp: '08012345678',
        email: null,
        createdAt: new Date('2026-08-21T10:00:00.000Z')
      }
    ]);

    expect(csv).toContain('"Zara, ""Z"""');
    expect(csv).toContain('"Fashion\nTailoring"');
    expect(csv).toContain('""');
  });

  it('returns the header row when there are no entries', () => {
    expect(waitlistEntriesToCsv([])).toBe(
      '"ID","Name","Business Name","Business Type","WhatsApp","Email","Signed Up At"'
    );
  });
});