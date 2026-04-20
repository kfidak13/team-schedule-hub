import { TennisMatchRecord, TennisMatchType } from '@/types/team';

// Known USTA school abbreviation → full name mapping
const SCHOOL_NAMES: Record<string, string> = {
  BH: 'Bonita',
  MDHS: 'Mt. Diamond High School',
  WCHS: 'Western Christian',
  TWSOOC: 'Waldorf OC',
  TVT: 'Tarbut V Torah',
  FP: 'Flintridge Preparatory School',
  FPA: 'Fairmont Preparatory',
  CHS: 'Claremont',
  UHS: 'Upland',
  PCHSOC: 'Pacifica Christian OC',
  WEBB: 'Webb',
};

export function resolveSchoolName(abbrev: string): string {
  return SCHOOL_NAMES[abbrev.toUpperCase()] ?? abbrev;
}

export interface USTAParseResult {
  records: Omit<TennisMatchRecord, 'id'>[];
  unmatched: string[];
  overallScore: { webbWins: number; oppWins: number } | null;
  opponentSchool: string;
}

// Lines that should always be skipped
const SKIP_RE = /^(TBC|Privacy Policy|Terms Of Use|Accessibility Statement|Powered by|Match Scorecard|Download PDF|Enable accessibility)/i;
const COPYRIGHT_RE = /^©/;
const ROUND_RE = /^(Singles|Doubles)\s+Round\s+(\d+)/i;
const POSITION_RE = /^(\d+)\.\s*$/;
// Player line: "Any Name (SCHOOL)" — school is 1-6 uppercase letters/numbers
const PLAYER_RE = /^(.+?)\s+\(([A-Z0-9]{1,10})\)\s*$/;
const SCORE_RE = /^\d+$/;
// Date line like "Tuesday, February 24, 2026 at 3:15 PM PST"
const DATE_LINE_RE = /^\w+,\s+\w+\s+\d+,\s+\d{4}/;

interface RawLine {
  text: string;
  type: 'round' | 'position' | 'player' | 'score' | 'skip';
  matchType?: TennisMatchType;
  roundLabel?: string;
  playerName?: string;
  playerSchool?: string;
  scoreVal?: number;
}

function classifyLine(line: string): RawLine {
  if (SKIP_RE.test(line) || COPYRIGHT_RE.test(line) || DATE_LINE_RE.test(line)) return { text: line, type: 'skip' };
  const roundM = line.match(ROUND_RE);
  if (roundM) return {
    text: line, type: 'round',
    matchType: roundM[1].toLowerCase() as TennisMatchType,
    roundLabel: `${roundM[1]} Round ${roundM[2]}`,
  };
  if (POSITION_RE.test(line)) return { text: line, type: 'position' };
  if (SCORE_RE.test(line)) return { text: line, type: 'score', scoreVal: parseInt(line) };
  const playerM = line.match(PLAYER_RE);
  if (playerM) return { text: line, type: 'player', playerName: playerM[1].trim(), playerSchool: playerM[2].trim().toUpperCase() };
  return { text: line, type: 'skip' };
}

interface MatchEntry {
  matchType: TennisMatchType;
  round: string;
  webbPlayers: string[];     // 1 for singles, 2 for doubles
  oppPlayers: string[];
  oppSchool: string;
  webbSets: number[];        // set scores for webb side
  oppSets: number[];
}

export function parseUSTAScorecard(
  rawText: string,
  matchDate: string,
  existingPlayers: { id: string; name: string }[]
): USTAParseResult {
  const rawLines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const lines = rawLines.map(classifyLine);

  const entries: MatchEntry[] = [];
  let currentMatchType: TennisMatchType = 'singles';
  let currentRound = '';

  // State machine per match block
  let inBlock = false;
  let webbPlayers: string[] = [];
  let oppPlayers: string[] = [];
  let oppSchool = '';
  // Interleaved scores: after all players listed, scores come as pairs
  // We collect all score lines in a block, then split them in half
  let allScores: number[] = [];
  // Track which side we're on: before the score gap or after
  // The structure per block is: [webb players...] [score] [opp players...] [score]
  // But scores may appear between sides or at end. We use player groups.
  let webbGroup: string[] = [];
  let oppGroup: string[] = [];
  let webbGroupDone = false; // true once we hit the first score or opp player

  function flushBlock() {
    if (!inBlock || (webbGroup.length === 0 && webbPlayers.length === 0)) return;
    // Reconstruct: scores come after each side
    // allScores layout: [webb set scores..., opp set scores...]
    // They always appear in pairs (one per set)
    const half = Math.floor(allScores.length / 2);
    const wSets = allScores.slice(0, half);
    const oSets = allScores.slice(half);
    entries.push({
      matchType: currentMatchType,
      round: currentRound,
      webbPlayers: webbGroup.length > 0 ? webbGroup : webbPlayers,
      oppPlayers: oppGroup.length > 0 ? oppGroup : oppPlayers,
      oppSchool,
      webbSets: wSets,
      oppSets: oSets,
    });
  }

  function resetBlock() {
    webbGroup = [];
    oppGroup = [];
    oppSchool = '';
    allScores = [];
    webbGroupDone = false;
    inBlock = false;
    webbPlayers = [];
    oppPlayers = [];
  }

  // Two-pass approach: collect all lines per block, then determine sides
  // We use a simpler model: collect players in order seen, scores in order seen
  // Players before first score = webb side (if school=WEBB), after = opp side
  // But doubles interleaves: webb1, webb2, score, opp1, opp2, score
  // So: group players by school as we go

  // Each player entry tracks their accumulated set scores
  interface BlockPlayer { name: string; school: string; sets: number[]; }
  let blockPlayers: BlockPlayer[] = [];

  function flushBlock2() {
    if (!inBlock || blockPlayers.length === 0) return;
    const webb = blockPlayers.filter(p => p.school === 'WEBB');
    const opp = blockPlayers.filter(p => p.school !== 'WEBB');
    const school = opp[0]?.school ?? '';

    if (webb.length === 0) {
      blockPlayers = [];
      inBlock = false;
      return;
    }

    // Skip TBC matches — no opponent players found
    if (opp.length === 0) {
      blockPlayers = [];
      inBlock = false;
      return;
    }

    // For singles: 1 webb, 1 opp — compare their set scores directly
    // For doubles: 2 webb, 2 opp — all webb players share the same score (one score after the pair)
    // Scores are assigned to groups: the score after the last WEBB player = webb score,
    // score after last OPP player = opp score.
    // We detect this by looking at which group each score belongs to based on order.

    // Collect scores per group based on position in blockPlayers
    // Strategy: pair up scores with the "side" they follow.
    // A score that appears after WEBB player(s) and before OPP player(s) = webb set score
    // A score that appears after OPP player(s) = opp set score
    // Already encoded in blockPlayers[].sets — assigned in the main loop below
    const webbSets = webb.flatMap(p => p.sets);
    const oppSets = opp.flatMap(p => p.sets);

    // For doubles, each player in the pair gets the same scores (they share)
    // Deduplicate: for doubles, use first player's sets only
    const wSets = webb.length > 1 ? webb[webb.length - 1].sets : webbSets;
    const oSets = opp.length > 1 ? opp[opp.length - 1].sets : oppSets;

    entries.push({
      matchType: currentMatchType,
      round: currentRound,
      webbPlayers: webb.map(p => p.name),
      oppPlayers: opp.map(p => p.name),
      oppSchool: school,
      webbSets: wSets,
      oppSets: oSets,
    });

    blockPlayers = [];
    inBlock = false;
  }

  for (const line of lines) {
    if (line.type === 'round') {
      flushBlock2();
      resetBlock();
      currentMatchType = line.matchType!;
      currentRound = line.roundLabel!;
      continue;
    }
    if (line.type === 'position') {
      flushBlock2();
      blockPlayers = [];
      inBlock = true;
      continue;
    }
    if (!inBlock) continue;
    if (line.type === 'player') {
      blockPlayers.push({ name: line.playerName!, school: line.playerSchool!, sets: [] });
      continue;
    }
    if (line.type === 'score') {
      // Assign score to the last player in the list that was most recently added
      // For doubles: the score after "Webb1, Webb2" goes to the last Webb player (Webb2)
      // The score after "Opp1, Opp2" goes to the last Opp player (Opp2)
      // This works because doubles format is:
      //   Webb1 (WEBB), Webb2 (WEBB), [score], Opp1 (BH), Opp2 (BH), [score]
      if (blockPlayers.length > 0) {
        blockPlayers[blockPlayers.length - 1].sets.push(line.scoreVal!);
      }
      continue;
    }
  }
  flushBlock2(); // flush last

  // Build records
  const records: Omit<TennisMatchRecord, 'id'>[] = [];
  const unmatched: string[] = [];
  let webbMatchWins = 0;
  let oppMatchWins = 0;
  let detectedOpponentSchool = '';

  for (const entry of entries) {
    if (entry.oppSchool && !detectedOpponentSchool) detectedOpponentSchool = entry.oppSchool;

    // Determine winner by summing sets won
    const wSetsWon = entry.webbSets.reduce((acc, ws, i) => acc + (ws > (entry.oppSets[i] ?? 0) ? 1 : 0), 0);
    const oSetsWon = entry.oppSets.reduce((acc, os, i) => acc + (os > (entry.webbSets[i] ?? 0) ? 1 : 0), 0);
    const hasScores = entry.webbSets.length > 0 && entry.oppSets.length > 0;
    const webbWon = hasScores ? wSetsWon > oSetsWon : false;

    if (hasScores) {
      if (webbWon) webbMatchWins++;
      else oppMatchWins++;
    }

    // Build score string: "6-2" for single set, "7-6, 7-3" for multi
    const scoreStr = hasScores
      ? entry.webbSets.map((ws, i) => `${ws}-${entry.oppSets[i] ?? '?'}`).join(', ')
      : '—';

    // For doubles, create one record per WEBB player
    const webbPlayerList = entry.webbPlayers.length > 0 ? entry.webbPlayers : ['Unknown'];
    const oppLabel = entry.oppPlayers.length > 1
      ? entry.oppPlayers.join(' / ')
      : entry.oppPlayers[0] ?? '';

    for (const wName of webbPlayerList) {
      const matched = findPlayer(wName, existingPlayers);
      if (!matched && !unmatched.includes(wName)) unmatched.push(wName);

      records.push({
        playerId: matched?.id ?? '',
        playerName: wName,
        opponentName: oppLabel,
        opponentSchool: entry.oppSchool,
        matchType: entry.matchType,
        round: entry.round,
        score: scoreStr,
        won: webbWon,
        date: matchDate,
        importedAt: new Date().toISOString(),
      });
    }
  }

  const overallScore = webbMatchWins + oppMatchWins > 0
    ? { webbWins: webbMatchWins, oppWins: oppMatchWins }
    : null;

  return { records, unmatched, overallScore, opponentSchool: detectedOpponentSchool };
}

function findPlayer(
  name: string,
  players: { id: string; name: string }[]
): { id: string; name: string } | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const sortedWords = (s: string) => s.toLowerCase().split(/\s+/).map(norm).sort().join('');
  const nameSorted = sortedWords(name);

  // Exact normalized match
  let found = players.find(p => norm(p.name) === norm(name));
  if (found) return found;

  // Word-order-independent match (handles USTA "Li Thomas" vs roster "Thomas Li")
  found = players.find(p => sortedWords(p.name) === nameSorted);
  if (found) return found;

  // Last name only fallback (USTA first word is last name)
  const lastName = norm(name.split(/\s+/)[0]);
  found = players.find(p => {
    const parts = p.name.split(/\s+/);
    return norm(parts[parts.length - 1]) === lastName || norm(parts[0]) === lastName;
  });
  return found;
}
