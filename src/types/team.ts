export type Sport =
  | 'soccer'
  | 'baseball'
  | 'tennis'
  | 'football'
  | 'badminton'
  | 'swim'
  | 'cross_country'
  | 'volleyball'
  | 'water_polo'
  | 'golf'
  | 'wrestling'
  | 'swim_dive'
  | 'basketball'
  | 'other';

export type Gender = 'boys' | 'girls';

export type Level = 'varsity' | 'jv' | 'frosh';

export interface Program {
  sport: Sport;
  gender: Gender;
  level: Level;
}

export type Venue = 'Home' | 'Away' | 'Neutral';

export interface Game {
  id: string;
  sport: Sport;
  gender: Gender;
  level: Level;
  date: Date;
  time?: string;
  opponent?: string;
  venue: Venue;
  location?: string;
  isLeague: boolean;
  title?: string;
  result?: {
    won: boolean;
    score: string;
  };
}

export interface Player {
  id: string;
  name: string;
  jerseyNumber?: string;
  position?: string;
  hometown?: string;
  email?: string;
  phone?: string;
  photo?: string;
  rosterRole?: 'player' | 'manager';
  sports: Sport[];
  programKey?: string;
}

export interface WinLossStats {
  wins: number;
  losses: number;
  ties: number;
  pct: number;
}

export interface ImportedTeamStats {
  overall?: WinLossStats;
  league?: WinLossStats;
  nonLeague?: WinLossStats;
}

export interface Coach {
  id: string;
  name: string;
  role: 'Head Coach' | 'Assistant Coach' | 'Volunteer';
  email?: string;
  phone?: string;
  photo?: string;
  sports: Sport[];
  programKey?: string;
}

export interface TeamInfo {
  name: string;
  sport: Sport;
  season: string;
  headCoach?: string;
}
