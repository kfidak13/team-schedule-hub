import { TrackResult } from '@/types/team';

export interface TrackParseResult {
  results: Omit<TrackResult, 'id'>[];
  unmatched: string[];
  meetName: string;
  meetDate: string;
}

// Convert a time string to milliseconds for comparison/PR detection
// Handles: "4:32.15" (m:ss.cs), "55.23" (ss.cs), "1:02:15.00" (h:mm:ss.cs)
// Field events (distances like "18-04.50") return 0 — sort by raw string
export function timeToMs(time: string): number {
  const t = time.trim();
  // Field event format: feet-inches e.g. "18-04.50" or "42-06" → not a time, return 0
  if (/^\d+-\d+/.test(t)) return 0;

  const parts = t.split(':');
  try {
    if (parts.length === 1) {
      // ss.cs
      return Math.round(parseFloat(parts[0]) * 1000);
    } else if (parts.length === 2) {
      // m:ss.cs
      return Math.round((parseInt(parts[0]) * 60 + parseFloat(parts[1])) * 1000);
    } else if (parts.length === 3) {
      // h:mm:ss.cs
      return Math.round((parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2])) * 1000);
    }
  } catch { return 0; }
  return 0;
}

// Returns true if newTime is faster (lower ms) or farther (higher raw for field)
export function isFasterThan(newTime: string, prTime: string): boolean {
  const newMs = timeToMs(newTime);
  const prMs = timeToMs(prTime);
  // Field events: higher value = better — but we can't compare strings reliably here
  // For now, lower ms = faster (track). Field events return 0 for both, so no PR auto-detection
  if (newMs === 0 && prMs === 0) return false;
  return newMs < prMs;
}

// ── Line classifiers ──────────────────────────────────────────────────────────

// Common track events to detect event header lines
const TRACK_EVENTS = [
  '100 Meters', '200 Meters', '400 Meters', '800 Meters',
  '1600 Meters', '3200 Meters', '110 Hurdles', '300 Hurdles',
  '400 Hurdles', '100 Hurdles', '4x100', '4x400', '4x800',
  'High Jump', 'Long Jump', 'Triple Jump', 'Pole Vault',
  'Shot Put', 'Discus', 'Javelin', 'Hammer', 'Pentathlon', 'Decathlon',
  'Mile', '2 Mile', '5000', '10000', '3000 Steeplechase',
];

const EVENT_RE = new RegExp(
  '(' + TRACK_EVENTS.map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')',
  'i'
);

// Time/distance result line: "1  John Smith  Webb  4:32.15  PR" or "3  Jane Doe  OHS  55.23"
// Also handles just "John Smith  4:32.15" minimal format
const RESULT_LINE_RE = /^(\d+)?\s+(.+?)\s{2,}(.+?)\s{2,}([\d:.\-]+)\s*(PR)?/i;

// Simpler: split by 2+ spaces
function parseCells(line: string): string[] {
  return line.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
}

// Detect a time/distance value
// Handles: 10.85, 48.32, 4:32.15, 10:23.45, 1:02:34.56, 18-04.50 (field)
const TIME_RE = /^\d{1,2}:\d{2}(\.\d+)?$|^\d{1,2}:\d{2}:\d{2}(\.\d+)?$|^\d+\.\d+$|^\d+-\d+(\.\d+)?$/;
const PLACE_RE = /^\d+$/;

function isTime(s: string): boolean { return TIME_RE.test(s.trim()); }
function isPlace(s: string): boolean { return PLACE_RE.test(s.trim()) && parseInt(s) < 200; }

// Meet header patterns: "Bear Valley Invitational - March 5, 2026"
const DATE_RE = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/i;
const ISO_DATE_RE = /\b(\d{4})-(\d{2})-(\d{2})\b/;

function extractDate(text: string): string | null {
  const iso = text.match(ISO_DATE_RE);
  if (iso) return iso[0];
  const m = text.match(DATE_RE);
  if (!m) return null;
  return new Date(m[0]).toISOString().slice(0, 10);
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseTrackResults(
  rawText: string,
  meetName: string,
  meetDate: string,
  existingPlayers: { id: string; name: string }[],
  existingResults: TrackResult[],  // to detect PRs
): TrackParseResult {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // Try to extract date from text if not provided
  if (!meetDate) {
    for (const line of lines) {
      const d = extractDate(line);
      if (d) { meetDate = d; break; }
    }
  }

  let currentEvent = '';
  const results: Omit<TrackResult, 'id'>[] = [];
  const unmatchedNames = new Set<string>();

  for (const line of lines) {
    // Skip lines that are clearly headers/footers
    if (/^(place|athlete|team|time|mark|result|finals|prelims|heat)/i.test(line)) continue;
    if (line.length < 3) continue;

    // Detect event header
    const evMatch = line.match(EVENT_RE);
    if (evMatch && line.length < 60) {
      currentEvent = normalizeEvent(evMatch[1]);
      continue;
    }

    if (!currentEvent) continue;

    // Parse result row by splitting on 2+ spaces
    const cells = parseCells(line);
    if (cells.length < 2) continue;

    // Try to find: [place?] [name] [school?] [time] [PR?]
    let place: number | undefined;
    let athleteName = '';
    let time = '';
    let schoolToken = '';
    let isPRFlag = false;

    // Check last cell for PR marker
    if (/^pr$/i.test(cells[cells.length - 1])) {
      isPRFlag = true;
      cells.pop();
    }

    // Check first cell for place number
    if (cells.length >= 1 && isPlace(cells[0])) {
      place = parseInt(cells.shift()!);
    }

    // Last remaining cell should be the time
    if (cells.length >= 1 && isTime(cells[cells.length - 1])) {
      time = cells.pop()!;
    } else {
      // Can't find a time — skip
      continue;
    }

    // Second to last might be school abbreviation (short, all caps)
    if (cells.length >= 2 && /^[A-Z0-9]{1,8}$/.test(cells[cells.length - 1])) {
      schoolToken = cells.pop()!;
    }

    // Remaining cells = athlete name
    athleteName = cells.join(' ').trim();
    if (!athleteName) continue;

    // Only import Webb athletes (if school token present and not Webb, skip)
    if (schoolToken) {
      const up = schoolToken.toUpperCase();
      if (up !== 'WEBB' && up !== 'WSC') continue;
    }

    // Match to roster
    const matched = findAthlete(athleteName, existingPlayers);
    const athleteId = matched?.id ?? '';
    const resolvedName = matched?.name ?? athleteName;
    if (!matched) unmatchedNames.add(athleteName);

    // PR detection: is this better than their existing best for this event?
    const ms = timeToMs(time);
    const existingBest = getPersonalBest(resolvedName, athleteId, currentEvent, existingResults);
    let isPR = isPRFlag;
    if (!isPR && ms > 0 && existingBest) {
      isPR = ms < existingBest;
    } else if (!isPR && ms > 0 && !existingBest) {
      isPR = true; // First time = automatic PR
    }

    results.push({
      athleteId,
      athleteName: resolvedName,
      event: currentEvent,
      time,
      timeMs: ms,
      place,
      meetName,
      meetDate,
      isPR,
      importedAt: new Date().toISOString(),
    });
  }

  return {
    results,
    unmatched: [...unmatchedNames],
    meetName,
    meetDate,
  };
}

function normalizeEvent(raw: string): string {
  const lower = raw.trim().toLowerCase();
  // Normalize common variations
  if (/^100\s*m/i.test(raw)) return '100m';
  if (/^200\s*m/i.test(raw)) return '200m';
  if (/^400\s*m/i.test(raw)) return '400m';
  if (/^800\s*m/i.test(raw)) return '800m';
  if (/^1600\s*m|^mile/i.test(raw)) return '1600m';
  if (/^3200\s*m|^2\s*mile/i.test(raw)) return '3200m';
  if (/110.*hurdle/i.test(raw)) return '110m Hurdles';
  if (/300.*hurdle/i.test(raw)) return '300m Hurdles';
  if (/400.*hurdle/i.test(raw)) return '400m Hurdles';
  if (/4.?x.?100/i.test(raw)) return '4x100m Relay';
  if (/4.?x.?400/i.test(raw)) return '4x400m Relay';
  if (/4.?x.?800/i.test(raw)) return '4x800m Relay';
  if (/high\s*jump/i.test(raw)) return 'High Jump';
  if (/long\s*jump/i.test(raw)) return 'Long Jump';
  if (/triple\s*jump/i.test(raw)) return 'Triple Jump';
  if (/pole\s*vault/i.test(raw)) return 'Pole Vault';
  if (/shot\s*put/i.test(raw)) return 'Shot Put';
  if (/discus/i.test(raw)) return 'Discus';
  if (/javelin/i.test(raw)) return 'Javelin';
  return raw.trim();
  void lower;
}

function getPersonalBest(
  name: string,
  id: string,
  event: string,
  existing: TrackResult[]
): number | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const matches = existing.filter(r =>
    r.event === event &&
    (r.athleteId === id || norm(r.athleteName) === norm(name)) &&
    r.timeMs > 0
  );
  if (!matches.length) return null;
  return Math.min(...matches.map(r => r.timeMs));
}

function findAthlete(
  name: string,
  players: { id: string; name: string }[]
): { id: string; name: string } | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const sortedWords = (s: string) => s.toLowerCase().split(/\s+/).map(norm).sort().join('');
  const nameSorted = sortedWords(name);

  let found = players.find(p => norm(p.name) === norm(name));
  if (found) return found;

  found = players.find(p => sortedWords(p.name) === nameSorted);
  if (found) return found;

  // Last name match fallback
  const lastName = norm(name.split(/\s+/)[0]);
  found = players.find(p => {
    const parts = p.name.split(/\s+/);
    return norm(parts[parts.length - 1]) === lastName || norm(parts[0]) === lastName;
  });
  return found;
}
