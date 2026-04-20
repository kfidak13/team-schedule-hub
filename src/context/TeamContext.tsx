import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Game, Player, Coach, Sport, TeamInfo, ImportedTeamStats, Program } from '@/types/team';
import { generateId } from '@/lib/htmlParser';
import { supabase } from '@/lib/supabase';

interface TeamContextType {
  currentSport: Sport | 'all';
  setCurrentSport: (sport: Sport | 'all') => void;
  currentProgram?: Program;
  setCurrentProgram: (program: Program) => void;
  loading: boolean;
  games: Game[];
  addGame: (game: Omit<Game, 'id'>) => void;
  addGames: (games: Omit<Game, 'id'>[]) => void;
  replaceGamesForProgram: (program: Program, games: Game[]) => void;
  updateGame: (id: string, game: Partial<Game>) => void;
  deleteGame: (id: string) => void;
  players: Player[];
  addPlayer: (player: Omit<Player, 'id'>) => void;
  addPlayers: (players: Player[]) => void;
  replacePlayersForProgram: (programKey: string, players: Player[]) => void;
  updatePlayer: (id: string, player: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
  coaches: Coach[];
  addCoach: (coach: Omit<Coach, 'id'>) => void;
  addCoaches: (coaches: Coach[]) => void;
  replaceCoachesForProgram: (programKey: string, coaches: Coach[]) => void;
  updateCoach: (id: string, coach: Partial<Coach>) => void;
  deleteCoach: (id: string) => void;
  teamInfos: TeamInfo[];
  addTeamInfo: (info: TeamInfo) => void;
  importedStats: Record<string, ImportedTeamStats>;
  addImportedStats: (key: string, stats: ImportedTeamStats) => void;
  getRecord: (program?: Program) => { wins: number; losses: number };
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

// ── Row-to-model mappers ──────────────────────────────────────────────────────

function rowToGame(row: any): Game {
  return {
    id: row.id,
    sport: row.sport,
    gender: row.gender,
    level: row.level,
    opponent: row.opponent,
    date: new Date(row.date),
    time: row.time,
    venue: row.venue,
    location: row.location,
    isLeague: row.is_league,
    result: row.result,
    title: row.title,
  };
}

function gameToRow(game: Game) {
  return {
    id: game.id,
    sport: game.sport,
    gender: game.gender,
    level: game.level,
    opponent: game.opponent ?? null,
    date: game.date instanceof Date ? game.date.toISOString() : game.date,
    time: game.time ?? null,
    venue: game.venue ?? null,
    location: game.location ?? null,
    is_league: game.isLeague ?? false,
    result: game.result ?? null,
    title: game.title ?? null,
  };
}

function rowToPlayer(row: any): Player {
  return {
    id: row.id,
    programKey: row.program_key,
    name: row.name,
    jerseyNumber: row.jersey_number,
    position: row.position,
    hometown: row.hometown,
    email: row.email,
    phone: row.phone,
    photo: row.photo,
    rosterRole: row.roster_role,
    sports: row.sports ?? [],
  };
}

function playerToRow(player: Player) {
  return {
    id: player.id,
    program_key: player.programKey ?? null,
    name: player.name,
    jersey_number: player.jerseyNumber ?? null,
    position: player.position ?? null,
    hometown: player.hometown ?? null,
    email: player.email ?? null,
    phone: player.phone ?? null,
    photo: player.photo ?? null,
    roster_role: player.rosterRole ?? null,
    sports: player.sports ?? [],
  };
}

function rowToCoach(row: any): Coach {
  return {
    id: row.id,
    programKey: row.program_key,
    name: row.name,
    role: row.role ?? 'Assistant Coach',
    email: row.email,
    phone: row.phone,
    photo: row.photo,
    sports: row.sports ?? [],
  };
}

function coachToRow(coach: Coach) {
  return {
    id: coach.id,
    program_key: coach.programKey ?? null,
    name: coach.name,
    role: coach.role ?? null,
    email: coach.email ?? null,
    phone: coach.phone ?? null,
    photo: coach.photo ?? null,
    sports: coach.sports ?? [],
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function TeamProvider({ children }: { children: ReactNode }) {
  const [currentSport, setCurrentSport] = useState<Sport | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [teamInfos, setTeamInfos] = useState<TeamInfo[]>([]);
  const [importedStats, setImportedStats] = useState<Record<string, ImportedTeamStats>>({});
  const [currentProgram, setCurrentProgramState] = useState<Program | undefined>(() => {
    try {
      const s = localStorage.getItem('currentProgram');
      return s ? JSON.parse(s) : undefined;
    } catch { return undefined; }
  });

  // ── Initial load from Supabase ──
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const [gRes, pRes, cRes, sRes] = await Promise.all([
        supabase.from('games').select('*'),
        supabase.from('players').select('*'),
        supabase.from('coaches').select('*'),
        supabase.from('imported_stats').select('*'),
      ]);
      if (gRes.data) setGames(gRes.data.map(rowToGame));
      if (pRes.data) setPlayers(pRes.data.map(rowToPlayer));
      if (cRes.data) setCoaches(cRes.data.map(rowToCoach));
      if (sRes.data) {
        const stats: Record<string, ImportedTeamStats> = {};
        sRes.data.forEach((row: any) => { stats[row.program_key] = row.data; });
        setImportedStats(stats);
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  // ── Real-time subscriptions so all viewers see admin changes instantly ──
  useEffect(() => {
    const gamesSub = supabase.channel('games-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        supabase.from('games').select('*').then(({ data }) => {
          if (data) setGames(data.map(rowToGame));
        });
      }).subscribe();

    const playersSub = supabase.channel('players-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        supabase.from('players').select('*').then(({ data }) => {
          if (data) setPlayers(data.map(rowToPlayer));
        });
      }).subscribe();

    const coachesSub = supabase.channel('coaches-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coaches' }, () => {
        supabase.from('coaches').select('*').then(({ data }) => {
          if (data) setCoaches(data.map(rowToCoach));
        });
      }).subscribe();

    const statsSub = supabase.channel('stats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'imported_stats' }, () => {
        supabase.from('imported_stats').select('*').then(({ data }) => {
          if (data) {
            const stats: Record<string, ImportedTeamStats> = {};
            data.forEach((row: any) => { stats[row.program_key] = row.data; });
            setImportedStats(stats);
          }
        });
      }).subscribe();

    return () => {
      supabase.removeChannel(gamesSub);
      supabase.removeChannel(playersSub);
      supabase.removeChannel(coachesSub);
      supabase.removeChannel(statsSub);
    };
  }, []);

  const setCurrentProgram = (program: Program) => {
    setCurrentProgramState(program);
    setCurrentSport(program.sport);
    localStorage.setItem('currentProgram', JSON.stringify(program));
  };

  // ── Games ──
  const addGame = async (game: Omit<Game, 'id'>) => {
    const newGame: Game = { ...game, id: generateId() };
    setGames(prev => [...prev, newGame]);
    await supabase.from('games').insert(gameToRow(newGame));
  };

  const addGames = async (newGames: Omit<Game, 'id'>[]) => {
    const withIds = newGames.map(g => ({ ...g, id: generateId() }));
    setGames(prev => [...prev, ...withIds]);
    await supabase.from('games').insert(withIds.map(gameToRow));
  };

  const replaceGamesForProgram = async (program: Program, newGames: Game[]) => {
    setGames(prev => {
      const kept = prev.filter(g => !(g.sport === program.sport && g.gender === program.gender && g.level === program.level));
      return [...kept, ...newGames];
    });
    await supabase.from('games').delete().match({ sport: program.sport, gender: program.gender, level: program.level });
    if (newGames.length > 0) await supabase.from('games').insert(newGames.map(gameToRow));
  };

  const updateGame = async (id: string, game: Partial<Game>) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, ...game } : g));
    const updated = games.find(g => g.id === id);
    if (updated) await supabase.from('games').update(gameToRow({ ...updated, ...game })).eq('id', id);
  };

  const deleteGame = async (id: string) => {
    setGames(prev => prev.filter(g => g.id !== id));
    await supabase.from('games').delete().eq('id', id);
  };

  // ── Players ──
  const addPlayer = async (player: Omit<Player, 'id'>) => {
    const newPlayer: Player = { ...player, id: generateId() };
    setPlayers(prev => [...prev, newPlayer]);
    await supabase.from('players').insert(playerToRow(newPlayer));
  };

  const addPlayers = async (newPlayers: Player[]) => {
    const unique = newPlayers.filter(np =>
      !players.some(p => p.name.toLowerCase() === np.name.toLowerCase() && p.programKey === np.programKey)
    );
    setPlayers(prev => [...prev, ...unique]);
    if (unique.length > 0) await supabase.from('players').insert(unique.map(playerToRow));
  };

  const replacePlayersForProgram = async (pKey: string, newPlayers: Player[]) => {
    setPlayers(prev => [...prev.filter(p => p.programKey !== pKey), ...newPlayers]);
    await supabase.from('players').delete().eq('program_key', pKey);
    if (newPlayers.length > 0) await supabase.from('players').insert(newPlayers.map(playerToRow));
  };

  const updatePlayer = async (id: string, player: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...player } : p));
    const updated = players.find(p => p.id === id);
    if (updated) await supabase.from('players').update(playerToRow({ ...updated, ...player })).eq('id', id);
  };

  const deletePlayer = async (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    await supabase.from('players').delete().eq('id', id);
  };

  // ── Coaches ──
  const addCoach = async (coach: Omit<Coach, 'id'>) => {
    const newCoach: Coach = { ...coach, id: generateId() };
    setCoaches(prev => [...prev, newCoach]);
    await supabase.from('coaches').insert(coachToRow(newCoach));
  };

  const addCoaches = async (newCoaches: Coach[]) => {
    const unique = newCoaches.filter(nc =>
      !coaches.some(c => c.name.toLowerCase() === nc.name.toLowerCase() && c.programKey === nc.programKey)
    );
    setCoaches(prev => [...prev, ...unique]);
    if (unique.length > 0) await supabase.from('coaches').insert(unique.map(coachToRow));
  };

  const replaceCoachesForProgram = async (pKey: string, newCoaches: Coach[]) => {
    setCoaches(prev => [...prev.filter(c => c.programKey !== pKey), ...newCoaches]);
    await supabase.from('coaches').delete().eq('program_key', pKey);
    if (newCoaches.length > 0) await supabase.from('coaches').insert(newCoaches.map(coachToRow));
  };

  const updateCoach = async (id: string, coach: Partial<Coach>) => {
    setCoaches(prev => prev.map(c => c.id === id ? { ...c, ...coach } : c));
    const updated = coaches.find(c => c.id === id);
    if (updated) await supabase.from('coaches').update(coachToRow({ ...updated, ...coach })).eq('id', id);
  };

  const deleteCoach = async (id: string) => {
    setCoaches(prev => prev.filter(c => c.id !== id));
    await supabase.from('coaches').delete().eq('id', id);
  };

  // ── Team Info (local only — not user-facing data) ──
  const addTeamInfo = (info: TeamInfo) => {
    setTeamInfos(prev => [...prev.filter(t => t.sport !== info.sport), info]);
  };

  // ── Imported Stats ──
  const addImportedStats = async (key: string, stats: ImportedTeamStats) => {
    setImportedStats(prev => ({ ...prev, [key]: stats }));
    await supabase.from('imported_stats').upsert({ program_key: key, data: stats });
  };

  const getRecord = (program?: Program) => {
    const filtered = program
      ? games.filter(g => g.sport === program.sport && g.gender === program.gender && g.level === program.level && g.result)
      : games.filter(g => g.result);
    return {
      wins: filtered.filter(g => g.result?.won).length,
      losses: filtered.filter(g => g.result && !g.result.won).length,
    };
  };

  return (
    <TeamContext.Provider value={{
      currentSport, setCurrentSport,
      currentProgram, setCurrentProgram,
      loading,
      games, addGame, addGames, replaceGamesForProgram, updateGame, deleteGame,
      players, addPlayer, addPlayers, replacePlayersForProgram, updatePlayer, deletePlayer,
      coaches, addCoach, addCoaches, replaceCoachesForProgram, updateCoach, deleteCoach,
      teamInfos, addTeamInfo,
      importedStats, addImportedStats,
      getRecord,
    }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (!context) throw new Error('useTeam must be used within a TeamProvider');
  return context;
}
