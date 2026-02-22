import { Game, Sport, TeamInfo, Venue, Player, Coach, ImportedTeamStats, WinLossStats } from '@/types/team';

interface ParseResult {
  teamInfo: TeamInfo | null;
  games: Game[];
  players: Player[];
  coaches: Coach[];
  importedStats?: ImportedTeamStats;
}

export function parseScheduleHtml(html: string, sport: Sport = 'tennis'): ParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Extract team info
  let teamInfo: TeamInfo | null = null;
  const teamNameEl = doc.querySelector('.team-name');
  const schoolYearEl = doc.querySelector('.team-schoolyear');
  const headCoachEl = doc.querySelector('.team-headcoach');
  
  if (teamNameEl) {
    teamInfo = {
      name: teamNameEl.textContent?.trim() || 'Unknown Team',
      sport,
      season: schoolYearEl?.textContent?.trim() || '',
      headCoach: headCoachEl?.textContent?.replace('Head Coach:', '').trim() || undefined,
    };
  }
  
  // Extract games
  const games: Game[] = [];
  const gameElements = doc.querySelectorAll('.game');
  
  gameElements.forEach((gameEl, index) => {
    const game = parseGameElement(gameEl, sport, index);
    if (game) {
      games.push(game);
    }
  });
  
  // Extract roster (players and coaches)
  const { players, coaches } = parseRoster(doc, sport, teamInfo?.headCoach);

  // Extract team stats (W/L/T/%) if present
  const importedStats = parseTeamStats(doc);
  
  return { teamInfo, games, players, coaches, importedStats };
}

function parseGameElement(gameEl: Element, sport: Sport, index: number): Game | null {
  // Get date
  const dateSpans = gameEl.querySelectorAll('.schedule-date');
  const dateText = dateSpans[0]?.textContent?.trim() || '';
  const timeText = dateSpans[1]?.textContent?.trim() || '';
  
  const parsedDate = parseDate(dateText);
  if (!parsedDate) return null;
  
  // Get venue (Home/Away/Neutral)
  const siteEl = gameEl.querySelector('.schedule-site');
  const venueText = siteEl?.textContent?.trim() || 'Home';
  const venue: Venue = venueText === 'Away' ? 'Away' : venueText === 'Neutral' ? 'Neutral' : 'Home';
  
  // Get opponent
  const opponentEl = gameEl.querySelector('.schedule-opponent');
  const opponent = opponentEl?.textContent?.trim() || undefined;
  
  // Get location
  const locationEl = gameEl.querySelector('.schedule-location');
  const location = locationEl?.textContent?.trim() || undefined;
  
  // Check if league game
  const leagueEl = gameEl.querySelector('.league-status');
  const isLeague = !!leagueEl;
  
  // Get title (for special events like playoffs)
  const titleEl = gameEl.querySelector('.schedule-title');
  const title = titleEl?.textContent?.trim() || undefined;
  
  // Get result if available
  const winlossEl = gameEl.querySelector('.winloss');
  const scoreEl = gameEl.querySelector('.score');
  const winloss = winlossEl?.textContent?.trim();
  const score = scoreEl?.textContent?.trim();
  
  let result = undefined;

  const parseResultFromText = (text?: string): { won: boolean; score: string } | undefined => {
    if (!text) return undefined;
    const normalized = text.replace(/\s+/g, ' ').trim();
    // Matches: "W 3-2", "L, 1-2", "Win 10-4", "Loss 2-3"
    const match = normalized.match(/\b(w|l|win|loss)\b\s*[:\-,]?\s*([0-9]+\s*[-–]\s*[0-9]+)/i);
    if (!match) return undefined;
    const wl = match[1].toLowerCase();
    const won = wl === 'w' || wl === 'win';
    const sc = match[2].replace(/\s+/g, '').replace('–', '-');
    return { won, score: sc };
  };

  if (winlossEl) {
    const wlTextLower = (winloss || '').toLowerCase();

    // Check class tokens (case-insensitive) AND text content — whichever fires first wins
    const isWin =
      winlossEl.classList.contains('Win') ||
      winlossEl.classList.contains('win') ||
      wlTextLower === 'win' ||
      wlTextLower === 'w';

    const isLoss =
      winlossEl.classList.contains('Loss') ||
      winlossEl.classList.contains('loss') ||
      wlTextLower === 'loss' ||
      wlTextLower === 'l';

    if (isWin || isLoss) {
      const determined = isWin && !isLoss; // isLoss takes priority in ambiguous cases
      if (score) {
        // Normal Webb/Blackbaud format: separate winloss + score spans
        result = { won: determined, score };
      } else {
        // Score may be embedded in the winloss text, e.g. "W 3-2"
        const fromText = parseResultFromText(winloss);
        result = fromText ? { won: determined, score: fromText.score } : undefined;
      }
    }
  }

  // Fallback: combined element like "W 3-2" or "Win 28-27" somewhere in the game row
  if (!result && winloss) {
    result = parseResultFromText(winloss);
  }

  // Last-resort: scan full game text only when no winloss element was present at all
  if (!result && !winlossEl) {
    result = parseResultFromText(gameEl.textContent || undefined);
  }
  
  return {
    id: `game-${Date.now()}-${index}`,
    sport,
    date: parsedDate,
    time: timeText || undefined,
    opponent,
    venue,
    location,
    isLeague,
    title,
    result,
  };
}

function parseRoster(doc: Document, sport: Sport, headCoachName?: string): { players: Player[]; coaches: Coach[] } {
  const players: Player[] = [];
  const coaches: Coach[] = [];

  const normalizeImageUrl = (src: string) => {
    const trimmed = src.trim();
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    return trimmed;
  };
  
  // Add head coach if found in team info
  if (headCoachName) {
    coaches.push({
      id: generateId(),
      name: headCoachName,
      role: 'Head Coach',
      sports: [sport],
    });
  }
  
  // Look for roster section - common class patterns
  const rosterSection = doc.querySelector('.roster, .team-roster, .athleticteamroster, [class*="roster"]');
  
  if (rosterSection) {
    // Webb-style roster: <li class="roster-entry"> ... <a class="player-name-link">Name</a> ... <div class="hometown">Town</div>
    const rosterEntries = rosterSection.querySelectorAll('li.roster-entry');
    rosterEntries.forEach((entry) => {
      const nameEl = entry.querySelector('a.player-name-link, .player-name-link');
      const name = nameEl?.textContent?.trim();
      if (!name) return;

      const hometownEl = entry.querySelector('.hometown');
      const hometown = hometownEl?.textContent?.trim() || undefined;

      players.push({
        id: generateId(),
        name,
        hometown,
        sports: [sport],
      });
    });

    // Look for player rows
    const playerRows = rosterSection.querySelectorAll('.player, .roster-player, tr[class*="player"], .roster-row');
    
    playerRows.forEach((row) => {
      const nameEl = row.querySelector('.player-name, .name, td:first-child');
      const numberEl = row.querySelector('.player-number, .jersey, .number, td:nth-child(2)');
      const positionEl = row.querySelector('.player-position, .position, td:nth-child(3)');
      
      const name = nameEl?.textContent?.trim();
      if (name) {
        const alreadyAdded = players.some((p) => p.name.toLowerCase() === name.toLowerCase());
        if (!alreadyAdded) {
          players.push({
            id: generateId(),
            name,
            jerseyNumber: numberEl?.textContent?.trim() || undefined,
            position: positionEl?.textContent?.trim() || undefined,
            sports: [sport],
          });
        }
      }
    });
    
    // Look for coach rows
    const coachRows = rosterSection.querySelectorAll('.coach, .roster-coach, tr[class*="coach"]');
    
    coachRows.forEach((row) => {
      const nameEl = row.querySelector('.coach-name, .name, td:first-child');
      const roleEl = row.querySelector('.coach-role, .role, td:nth-child(2)');
      
      const name = nameEl?.textContent?.trim();
      if (name && name !== headCoachName) {
        const roleText = roleEl?.textContent?.trim()?.toLowerCase() || '';
        const role: Coach['role'] = roleText.includes('head') ? 'Head Coach' : 
                                    roleText.includes('assistant') ? 'Assistant Coach' : 'Volunteer';
        
        coaches.push({
          id: generateId(),
          name,
          role,
          sports: [sport],
        });
      }
    });
  }

  // Directory-style cards (Blackbaud): <img class="bb-avatar-image" src="..."> and <h1 class="bb-card-title">Name '27</h1>
  const directoryCards = doc.querySelectorAll('.directory-card, .bb-card.directory-card');
  directoryCards.forEach((card) => {
    const titleEl = card.querySelector('h1.bb-card-title');
    const imgEl = card.querySelector('img.bb-avatar-image');
    const rawTitle = titleEl?.textContent?.trim();
    const src = imgEl?.getAttribute('src')?.trim();
    if (!rawTitle || !src) return;

    const nameOnly = rawTitle.replace(/\s*'\d+\s*$/, '').trim();
    if (!nameOnly) return;

    const photo = normalizeImageUrl(src);

    const existing = players.find((p) => p.name.toLowerCase() === nameOnly.toLowerCase());
    if (existing) {
      if (!existing.photo) existing.photo = photo;
      return;
    }
  });
  
  return { players, coaches };
}

function parseTeamStats(doc: Document): ImportedTeamStats | undefined {
  const statsRoot = doc.querySelector('.athleticteamstatistics, .team-stats, [class*="teamstat"], [class*="statistics"]');
  if (!statsRoot) return undefined;

  const parseBlock = (selector: string): WinLossStats | undefined => {
    const block = statsRoot.querySelector(selector);
    if (!block) return undefined;

    const row = block.querySelector('tbody tr');
    if (!row) return undefined;

    const cells = Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim() || '');
    if (cells.length < 4) return undefined;

    const wins = Number(cells[0]);
    const losses = Number(cells[1]);
    const ties = Number(cells[2]);
    const pct = Number(cells[3]);
    if ([wins, losses, ties, pct].some((n) => Number.isNaN(n))) return undefined;

    return { wins, losses, ties, pct };
  };

  const overall = parseBlock('.winloss-overall');
  const league = parseBlock('.winloss-league');
  const nonLeague = parseBlock('.winloss-nonleague');

  if (!overall && !league && !nonLeague) return undefined;
  return { overall, league, nonLeague };
}

function parseDate(dateStr: string): Date | null {
  // Handle formats like "Thursday, 2/19/2026"
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [, month, day, year] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  return null;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
