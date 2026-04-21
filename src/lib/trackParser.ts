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

const WEBB_SCHOOLS = ['THE WEBB SCH', 'THE WEBB SCHOOLS', 'WEBB SCH', 'WEBB SCHOOLS', 'WEBB', 'WSC'];

function isWebbSchool(school: string): boolean {
  const up = school.toUpperCase().trim();
  // Exact match or contains a Webb variant
  // Use word-boundary check so e.g. "WEST COVINA" doesn't match "WEBB"
  return WEBB_SCHOOLS.some(w => up === w || new RegExp('\\b' + w + '\\b').test(up));
}

// ── Line type detection ────────────────────────────────────────────────────────

// Split-lap line: "    1:06.037 (1:06.037)     2:08.681 (1:02.644)"
const SPLIT_LINE_RE = /^\s*\d+:\d+\.\d+\s*\(\d+:\d+\.\d+\)/;

// Separator line: "=====..." or "-----..."
const SEP_LINE_RE = /^[=\-]{5,}/;

// Column header line
const HEADER_LINE_RE = /^\s*Name\s+Year\s+School/i;

// A valid time/distance result token
// Handles: 11.11, 53.93, 2:08.69, 4:42.79, 10:32.71, 6-02.00, 113-02, 45-08.50
const FINALS_RE = /^x?(\d{1,3}:\d{2}(:\d{2})?(\.\d+)?|\d+\.\d+|\d+-\d+(\.\d+)?)$/i;

// A skip-worthy result token
const SKIP_RESULT_RE = /^(DNF|FOUL|NH|NWI|DQ|SCR)$/i;

// A year-in-school token (grade): 1-digit or 2-digit number 7-12
const YEAR_RE = /^(?:[789]|1[0-2])$/;

// Wind token: "-0.2", "+0.0", "NWI"
const WIND_RE = /^[+-]\d+\.\d+$|^NWI$/i;

// Relay school line: no comma in name portion, school is an org name
const RELAY_LINE_RE = /^\s*(\d+|--)\s+[A-Z].+?\s{2,}(x?[\d:.]+)\s/;

// ── Result line parser (token-based, format-agnostic) ─────────────────────────
// Handles Athletic.net and CIF fixed-width formats.
// Layout: [place|--] Lastname, Firstname  [year]  [School Name]  [finals]  [wind?] [heat?] [pts?]
function parseResultLine(line: string): {
  place: number | undefined;
  namePart: string;
  school: string;
  result: string;
} | null {
  const trimmed = line.trim();

  // Must start with a place number or '--'
  const placeMatch = trimmed.match(/^(\d+|--)\s+/);
  if (!placeMatch) return null;

  const place = placeMatch[1] === '--' ? undefined : parseInt(placeMatch[1]);
  const rest = trimmed.slice(placeMatch[0].length);

  // Must have a comma (Lastname, Firstname format)
  if (!rest.includes(',')) return null;

  // Split by 2+ spaces to get major columns
  const cols = rest.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
  if (cols.length < 2) return null;

  // Find the finals token — scan from the end, it's the first time/distance we find
  let finalsIdx = -1;
  for (let i = cols.length - 1; i >= 1; i--) {
    // Skip pure numbers (heat, points), wind tokens, tiebreak times in parens
    const c = cols[i];
    if (/^\d{1,2}$/.test(c)) continue;       // heat / points
    if (WIND_RE.test(c)) continue;            // wind
    if (/^\d+:\d+\.\d+$/.test(c) && i === cols.length - 1) continue; // trailing split
    if (SKIP_RESULT_RE.test(c)) return null;  // DNF etc — skip
    if (FINALS_RE.test(c)) { finalsIdx = i; break; }
  }
  if (finalsIdx < 0) return null;

  const result = cols[finalsIdx].replace(/^x/i, ''); // strip exhibition 'x'

  // Reconstruct the full middle string (everything between place and finals)
  // e.g. "Mozia, Aaden              12 THE WEBB SCH" (Athletic.net, single-space separated)
  // e.g. "Barrantes, Matthew              9 Webb" (CIF, 2+ space separated into cols)
  const middleCols = cols.slice(0, finalsIdx);
  const middle = middleCols.join('  '); // rejoin with 2 spaces to preserve structure

  // The year (grade 7-12) separates the name from the school.
  // Name always contains a comma (Lastname, Firstname), so require comma before the year.
  // Use greedy match so we get the full name before the last year-like token.
  const yearSplitMatch = middle.match(/^(.+,\s*[^,\d]+?)\s+(\d{1,2})\s+(.+)$/);

  let namePart = '';
  let school = '';

  if (yearSplitMatch && YEAR_RE.test(yearSplitMatch[2])) {
    namePart = yearSplitMatch[1].trim();
    school = yearSplitMatch[3].trim();
  } else {
    // No year found — try to match just name + school with no year
    // Fall back: treat everything before last 2+ space gap as name
    const noYearMatch = middle.match(/^(.+?)\s{2,}(.+)$/);
    if (noYearMatch) {
      namePart = noYearMatch[1].trim();
      school = noYearMatch[2].trim();
    } else {
      namePart = middle.trim();
      school = '';
    }
  }

  if (!namePart) return null;

  return { place, namePart, school, result };
}

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

    // Detect event header — two formats:
    // Athletic.net: "Boys 100 Meter Dash Varsity"
    // CIF/other:    "Event 2  Boys 1600 Meter Run Frosh/Soph RATED"
    const headerLine = trimmed.replace(/^Event\s+\d+\s+/i, '');
    const evMatch = headerLine.match(EVENT_HEADER_RE);
    if (evMatch && !parseResultLine(line) && !RELAY_LINE_RE.test(line)) {
      currentEvent = normalizeEvent(evMatch[0]);
      isRelayEvent = /relay/i.test(trimmed);
      // Detect gender prefix (check after stripping "Event N" prefix)
      if (/^boys/i.test(headerLine)) currentEventGender = 'boys';
      else if (/^girls/i.test(headerLine)) currentEventGender = 'girls';
      else currentEventGender = null; // no prefix — don't filter by gender
      continue;
    }

    if (!currentEvent) continue;

    // Skip relay events — no individual athletes
    if (isRelayEvent) continue;

    // Skip events that don't match the requested gender
    if (gender && currentEventGender && currentEventGender !== gender) continue;

    // Try to parse individual result line (format-agnostic token approach)
    const parsed = parseResultLine(line);
    if (!parsed) continue;

    const { place, namePart, school, result: time } = parsed;

    // Only import Webb athletes
    if (!isWebbSchool(school)) continue;

    // Convert "Lastname, Firstname" → "Firstname Lastname"
    const athleteName = convertName(namePart);

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
