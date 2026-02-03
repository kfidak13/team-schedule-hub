export type Sport = 'tennis' | 'basketball' | 'soccer' | 'volleyball' | 'baseball' | 'football' | 'other';

export type Venue = 'Home' | 'Away' | 'Neutral';

export interface Game {
  id: string;
  sport: Sport;
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
  email?: string;
  phone?: string;
  photo?: string;
  sports: Sport[];
}

export interface Coach {
  id: string;
  name: string;
  role: 'Head Coach' | 'Assistant Coach' | 'Volunteer';
  email?: string;
  phone?: string;
  photo?: string;
  sports: Sport[];
}

export interface TeamInfo {
  name: string;
  sport: Sport;
  season: string;
  headCoach?: string;
}
