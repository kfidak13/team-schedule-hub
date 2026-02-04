import { Game, Sport, TeamInfo, Venue, Player, Coach } from '@/types/team';

interface ParseResult {
  teamInfo: TeamInfo | null;
  games: Game[];
  players: Player[];
  coaches: Coach[];
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
  
  return { teamInfo, games, players, coaches };
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
  if (winloss && score) {
    result = {
      won: winloss.toLowerCase() === 'w',
      score,
    };
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
    // Look for player rows
    const playerRows = rosterSection.querySelectorAll('.player, .roster-player, tr[class*="player"], .roster-row');
    
    playerRows.forEach((row) => {
      const nameEl = row.querySelector('.player-name, .name, td:first-child');
      const numberEl = row.querySelector('.player-number, .jersey, .number, td:nth-child(2)');
      const positionEl = row.querySelector('.player-position, .position, td:nth-child(3)');
      
      const name = nameEl?.textContent?.trim();
      if (name) {
        players.push({
          id: generateId(),
          name,
          jerseyNumber: numberEl?.textContent?.trim() || undefined,
          position: positionEl?.textContent?.trim() || undefined,
          sports: [sport],
        });
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
  
  return { players, coaches };
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
