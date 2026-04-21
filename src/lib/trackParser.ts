import { TrackResult } from '@/types/team';

export interface TrackParseResult {
  results: Omit<TrackResult, 'id'>[];
  unmatched: string[];
  meetName: string;
  meetDate: string;
}

// ── Time conversion ────────────────────────────────────────────────────────────

// Handles: "11.11", "53.93", "2:08.69", "4:42.79", "10:32.71"
// Field events (feet-inches like "6-02.00", "113-02") return 0
export function timeToMs(time: string): number {
  const t = time.trim();
  if (/^\d+-\d+/.test(t)) return 0; // field event distance
  const parts = t.split(':');
  try {
    if (parts.length === 1) return Math.round(parseFloat(parts[0]) * 1000);
    if (parts.length === 2) return Math.round((parseInt(parts[0]) * 60 + parseFloat(parts[1])) * 1000);
    if (parts.length === 3) return Math.round((parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2])) * 1000);
  } catch { return 0; }
  return 0;
}

// ── Event header detection ─────────────────────────────────────────────────────

// Matches Athletic.net format: "Boys 100 Meter Dash Varsity", "Boys High Jump Varsity", etc.
// Also plain: "100 Meters", "High Jump"
const EVENT_HEADER_RE = /(?:boys|girls)?\s*([\d.]+\s*(?:x\s*[\d.]+\s*)?(?:meter|mile|yard)[s]?\s*(?:dash|run|hurdles?|relay)?|high jump|long jump|triple jump|pole vault|shot put|discus|javelin|hammer|pentathlon|decathlon)/i;

function normalizeEvent(raw: string): string {
  const r = raw.trim();
  if (/100\s*m.*dash|^100\s*m/i.test(r)) return '100m';
  if (/200\s*m.*dash|^200\s*m/i.test(r)) return '200m';
  if (/400\s*m.*dash|^400\s*m/i.test(r)) return '400m';
  if (/800\s*m.*run|^800\s*m/i.test(r)) return '800m';
  if (/1600\s*m.*run|^1600\s*m/i.test(r)) return '1600m';
  if (/3200\s*m.*run|^3200\s*m/i.test(r)) return '3200m';
  if (/5000\s*m/i.test(r)) return '5000m';
  if (/110\s*m.*hurdl/i.test(r)) return '110m Hurdles';
  if (/100\s*m.*hurdl/i.test(r)) return '100m Hurdles';
  if (/300\s*m.*hurdl/i.test(r)) return '300m Hurdles';
  if (/400\s*m.*hurdl/i.test(r)) return '400m Hurdles';
  if (/4\s*x\s*100/i.test(r)) return '4x100m Relay';
  if (/4\s*x\s*400/i.test(r)) return '4x400m Relay';
  if (/4\s*x\s*800/i.test(r)) return '4x800m Relay';
  if (/high\s*jump/i.test(r)) return 'High Jump';
  if (/long\s*jump/i.test(r)) return 'Long Jump';
  if (/triple\s*jump/i.test(r)) return 'Triple Jump';
  if (/pole\s*vault/i.test(r)) return 'Pole Vault';
  if (/shot\s*put/i.test(r)) return 'Shot Put';
  if (/discus/i.test(r)) return 'Discus';
  if (/javelin/i.test(r)) return 'Javelin';
  if (/hammer/i.test(r)) return 'Hammer';
  return r;
}

// ── Webb school name variants ──────────────────────────────────────────────────

const WEBB_SCHOOLS = ['THE WEBB SCH', 'THE WEBB SCHOOLS', 'WEBB SCH', 'WEBB', 'WSC'];

function isWebbSchool(school: string): boolean {
  const up = school.toUpperCase().trim();
  return WEBB_SCHOOLS.some(w => up.includes(w));
}

// ── Line type detection ────────────────────────────────────────────────────────

// Split-lap line: "    1:06.037 (1:06.037)     2:08.681 (1:02.644)"
const SPLIT_LINE_RE = /^\s*\d+:\d+\.\d+\s*\(\d+:\d+\.\d+\)/;

// Separator line: "=====..." or "-----..."
const SEP_LINE_RE = /^[=\-]{5,}/;

// Column header line
const HEADER_LINE_RE = /^\s*Name\s+Year\s+School/i;

// Place + result line (Athletic.net individual):
// "  1 Mozia, Aaden              12 THE WEBB SCH             11.11  -0.2  1  10"
// "  1 Efuetngu, Jeremy          12 THE WEBB SCH          45-08.50   1  10"
// " -- Grayson, Kaj              11 THE WEBB SCH               DNF  -0.2  1"
const RESULT_LINE_RE = /^\s*(\d+|--)\s+([A-Za-z][^,]+,\s*[A-Za-z][^\d]*?)\s+(\d{1,2})\s+((?:THE\s+)?[A-Z][A-Z\s]+?)\s{2,}([\d:.x\-]+|DNF|FOUL|NH|NWI|DQ)\s/;

// Relay result line: "  1 THE WEBB SCHOOLS (SS)  'A'    45.68   1  10"
const RELAY_LINE_RE = /^\s*(\d+|--)\s+((?:THE\s+)?[A-Z][A-Z\s,\-()'"]+?)\s{2,}(x?[\d:.]+)\s/;

// ── Main parser ────────────────────────────────────────────────────────────────

export function parseTrackResults(
  rawText: string,
  meetName: string,
  meetDate: string,
  existingPlayers: { id: string; name: string }[],
  existingResults: TrackResult[],
  gender?: 'boys' | 'girls',  // if provided, only import events matching this gender
): TrackParseResult {
  const lines = rawText.split('\n');

  let currentEvent = '';
  let isRelayEvent = false;
  let currentEventGender: 'boys' | 'girls' | null = null;
  const results: Omit<TrackResult, 'id'>[] = [];
  const unmatchedNames = new Set<string>();

  for (const rawLine of lines) {
    const line = rawLine;
    const trimmed = line.trim();

    if (!trimmed) continue;
    if (SEP_LINE_RE.test(trimmed)) continue;
    if (HEADER_LINE_RE.test(trimmed)) continue;
    if (SPLIT_LINE_RE.test(line)) continue;

    // Detect event header — Athletic.net format: "Boys 100 Meter Dash Varsity"
    // Must contain a known event keyword and appear as its own line (no result data after)
    const evMatch = trimmed.match(EVENT_HEADER_RE);
    if (evMatch && !RESULT_LINE_RE.test(line) && !RELAY_LINE_RE.test(line)) {
      currentEvent = normalizeEvent(evMatch[0]);
      isRelayEvent = /relay/i.test(trimmed);
      // Detect gender prefix
      if (/^boys/i.test(trimmed)) currentEventGender = 'boys';
      else if (/^girls/i.test(trimmed)) currentEventGender = 'girls';
      else currentEventGender = null; // no prefix — don't filter by gender
      continue;
    }

    if (!currentEvent) continue;

    // Skip relay events — no individual athletes
    if (isRelayEvent) continue;

    // Skip events that don't match the requested gender
    if (gender && currentEventGender && currentEventGender !== gender) continue;

    // Try to parse individual result line
    // Athletic.net fixed-width format:
    // [place] Lastname, Firstname    [year] [SCHOOL NAME]    [finals]  [wind?]  [heat?]  [points?]  [tiebreak?]
    const m = line.match(RESULT_LINE_RE);
    if (!m) continue;

    const placeStr = m[1].trim();
    const namePart = m[2].trim(); // "Lastname, Firstname"
    // m[3] = year, m[4] = school, m[5] = result
    const school = m[4].trim();
    const rawResult = m[5].trim();

    // Skip DNF, FOUL, NH, DQ
    if (/^(DNF|FOUL|NH|DQ|NWI)$/i.test(rawResult)) continue;

    // Only import Webb athletes
    if (!isWebbSchool(school)) continue;

    const place = placeStr === '--' ? undefined : parseInt(placeStr);

    // Convert "Lastname, Firstname" → "Firstname Lastname"
    const athleteName = convertName(namePart);

    // The finals value — strip leading 'x' (exhibition)
    const time = rawResult.replace(/^x/i, '');

    const matched = findAthlete(athleteName, existingPlayers);
    const athleteId = matched?.id ?? '';
    const resolvedName = matched?.name ?? athleteName;
    if (!matched) unmatchedNames.add(athleteName);

    const ms = timeToMs(time);
    const existingBest = getPersonalBest(resolvedName, athleteId, currentEvent, existingResults);
    let isPR = false;
    if (ms > 0 && existingBest === null) {
      isPR = true; // First time = automatic PR
    } else if (ms > 0 && existingBest !== null) {
      isPR = ms < existingBest;
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

  return { results, unmatched: [...unmatchedNames], meetName, meetDate };
}

// "Mozia, Aaden" → "Aaden Mozia"
function convertName(raw: string): string {
  const parts = raw.split(',');
  if (parts.length >= 2) {
    return `${parts[1].trim()} ${parts[0].trim()}`;
  }
  return raw.trim();
}

function getPersonalBest(
  name: string,
  id: string,
  event: string,
  existing: TrackResult[],
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
  players: { id: string; name: string }[],
): { id: string; name: string } | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const sortWords = (s: string) => s.toLowerCase().split(/\s+/).map(norm).sort().join('');
  const ns = sortWords(name);

  return (
    players.find(p => norm(p.name) === norm(name)) ??
    players.find(p => sortWords(p.name) === ns) ??
    players.find(p => {
      const parts = p.name.split(/\s+/);
      const last = norm(parts[parts.length - 1]);
      const inputLast = norm(name.split(/\s+/)[name.split(/\s+/).length - 1]);
      return last === inputLast;
    })
  );
}
