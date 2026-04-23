// ── Season boundary logic ──────────────────────────────────────────────────────
// Seasons start:  Aug 15 (Fall), Nov 8 (Winter), Feb 8 (Spring)
// Each season is identified by a key like "2025-fall", "2025-winter", "2026-spring"

export type SeasonName = 'fall' | 'winter' | 'spring';

export interface Season {
  key: string;       // e.g. "2025-fall"
  name: SeasonName;
  label: string;     // e.g. "Fall 2025"
  startYear: number;
}

export function getCurrentSeason(now: Date = new Date()): Season {
  const y = now.getFullYear();
  const m = now.getMonth() + 1; // 1-based
  const d = now.getDate();

  // Helper: is the date on or after month/day?
  const onOrAfter = (month: number, day: number) =>
    m > month || (m === month && d >= day);

  // Fall: Aug 15 – Nov 7
  // Winter: Nov 8 – Feb 7
  // Spring: Feb 8 – Aug 14

  if (onOrAfter(8, 15) && !onOrAfter(11, 8)) {
    // Fall season — year is the calendar year it starts in
    return { key: `${y}-fall`, name: 'fall', label: `Fall ${y}`, startYear: y };
  }

  if (onOrAfter(11, 8)) {
    // Winter season starts in Nov of year y, ends early next year
    return { key: `${y}-winter`, name: 'winter', label: `Winter ${y}–${y + 1}`, startYear: y };
  }

  if (onOrAfter(2, 8)) {
    // Spring — belongs to the academic year that started the previous fall
    return { key: `${y}-spring`, name: 'spring', label: `Spring ${y}`, startYear: y };
  }

  // Jan 1 – Feb 7: still in winter from the previous year's Nov
  return { key: `${y - 1}-winter`, name: 'winter', label: `Winter ${y - 1}–${y}`, startYear: y - 1 };
}

export const SEASON_SPORTS: Record<SeasonName, string[]> = {
  fall:   ['soccer', 'football', 'cross_country', 'water_polo', 'volleyball'],
  winter: ['basketball', 'swim_dive', 'wrestling'],
  spring: ['baseball', 'tennis', 'badminton', 'track_field', 'golf', 'swim'],
};

export const GRADES = ['9', '10', '11', '12', 'Faculty/Staff'];
