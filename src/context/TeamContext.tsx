import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Game, Player, Coach, Sport, TeamInfo } from '@/types/team';
import { generateId } from '@/lib/htmlParser';

interface TeamContextType {
  // Current sport filter
  currentSport: Sport | 'all';
  setCurrentSport: (sport: Sport | 'all') => void;
  
  // Games
  games: Game[];
  addGame: (game: Omit<Game, 'id'>) => void;
  addGames: (games: Omit<Game, 'id'>[]) => void;
  updateGame: (id: string, game: Partial<Game>) => void;
  deleteGame: (id: string) => void;
  
  // Players
  players: Player[];
  addPlayer: (player: Omit<Player, 'id'>) => void;
  addPlayers: (players: Player[]) => void;
  updatePlayer: (id: string, player: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
  
  // Coaches
  coaches: Coach[];
  addCoach: (coach: Omit<Coach, 'id'>) => void;
  addCoaches: (coaches: Coach[]) => void;
  updateCoach: (id: string, coach: Partial<Coach>) => void;
  deleteCoach: (id: string) => void;
  
  // Team Info
  teamInfos: TeamInfo[];
  addTeamInfo: (info: TeamInfo) => void;
  
  // Stats
  getRecord: (sport?: Sport) => { wins: number; losses: number };
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

const STORAGE_KEY = 'sports-team-data';

interface StoredData {
  games: Game[];
  players: Player[];
  coaches: Coach[];
  teamInfos: TeamInfo[];
}

function loadFromStorage(): StoredData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Convert date strings back to Date objects
      data.games = data.games.map((g: any) => ({
        ...g,
        date: new Date(g.date),
      }));
      return data;
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
  return { games: [], players: [], coaches: [], teamInfos: [] };
}

function saveToStorage(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const [currentSport, setCurrentSport] = useState<Sport | 'all'>('all');
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [teamInfos, setTeamInfos] = useState<TeamInfo[]>([]);
  
  // Load data on mount
  useEffect(() => {
    const data = loadFromStorage();
    setGames(data.games);
    setPlayers(data.players);
    setCoaches(data.coaches);
    setTeamInfos(data.teamInfos);
  }, []);
  
  // Save data on changes
  useEffect(() => {
    saveToStorage({ games, players, coaches, teamInfos });
  }, [games, players, coaches, teamInfos]);
  
  const addGame = (game: Omit<Game, 'id'>) => {
    setGames(prev => [...prev, { ...game, id: generateId() }]);
  };
  
  const addGames = (newGames: Omit<Game, 'id'>[]) => {
    const gamesWithIds = newGames.map(g => ({ ...g, id: generateId() }));
    setGames(prev => [...prev, ...gamesWithIds]);
  };
  
  const updateGame = (id: string, game: Partial<Game>) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, ...game } : g));
  };
  
  const deleteGame = (id: string) => {
    setGames(prev => prev.filter(g => g.id !== id));
  };
  
  const addPlayer = (player: Omit<Player, 'id'>) => {
    setPlayers(prev => [...prev, { ...player, id: generateId() }]);
  };
  
  const addPlayers = (newPlayers: Player[]) => {
    setPlayers(prev => {
      // Avoid duplicates by name
      const existingNames = new Set(prev.map(p => p.name.toLowerCase()));
      const uniqueNew = newPlayers.filter(p => !existingNames.has(p.name.toLowerCase()));
      return [...prev, ...uniqueNew];
    });
  };
  
  const updatePlayer = (id: string, player: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...player } : p));
  };
  
  const deletePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  };
  
  const addCoach = (coach: Omit<Coach, 'id'>) => {
    setCoaches(prev => [...prev, { ...coach, id: generateId() }]);
  };
  
  const addCoaches = (newCoaches: Coach[]) => {
    setCoaches(prev => {
      // Avoid duplicates by name
      const existingNames = new Set(prev.map(c => c.name.toLowerCase()));
      const uniqueNew = newCoaches.filter(c => !existingNames.has(c.name.toLowerCase()));
      return [...prev, ...uniqueNew];
    });
  };
  
  const updateCoach = (id: string, coach: Partial<Coach>) => {
    setCoaches(prev => prev.map(c => c.id === id ? { ...c, ...coach } : c));
  };
  
  const deleteCoach = (id: string) => {
    setCoaches(prev => prev.filter(c => c.id !== id));
  };
  
  const addTeamInfo = (info: TeamInfo) => {
    setTeamInfos(prev => {
      // Replace if same sport exists
      const filtered = prev.filter(t => t.sport !== info.sport);
      return [...filtered, info];
    });
  };
  
  const getRecord = (sport?: Sport) => {
    const filteredGames = sport 
      ? games.filter(g => g.sport === sport && g.result)
      : games.filter(g => g.result);
    
    return {
      wins: filteredGames.filter(g => g.result?.won).length,
      losses: filteredGames.filter(g => g.result && !g.result.won).length,
    };
  };
  
  return (
    <TeamContext.Provider value={{
      currentSport,
      setCurrentSport,
      games,
      addGame,
      addGames,
      updateGame,
      deleteGame,
      players,
      addPlayer,
      addPlayers,
      updatePlayer,
      deletePlayer,
      coaches,
      addCoach,
      addCoaches,
      updateCoach,
      deleteCoach,
      teamInfos,
      addTeamInfo,
      getRecord,
    }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}
