import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TennisMatchRecord } from '@/types/team';
import { supabase } from '@/lib/supabase';

interface TennisContextValue {
  matchRecords: TennisMatchRecord[];
  addMatchRecords: (records: Omit<TennisMatchRecord, 'id'>[]) => Promise<void>;
  deleteMatchRecord: (id: string) => Promise<void>;
  getPlayerRecords: (playerId: string) => TennisMatchRecord[];
  getPlayerRecordsByName: (playerName: string) => TennisMatchRecord[];
}

const TennisContext = createContext<TennisContextValue | undefined>(undefined);

export function TennisProvider({ children }: { children: ReactNode }) {
  const [matchRecords, setMatchRecords] = useState<TennisMatchRecord[]>([]);

  useEffect(() => {
    loadRecords();

    const sub = supabase
      .channel('tennis_match_records')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tennis_match_records' }, () => {
        loadRecords();
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  async function loadRecords() {
    const { data } = await supabase
      .from('tennis_match_records')
      .select('*')
      .order('date', { ascending: false });
    if (data) {
      setMatchRecords(data.map(rowToRecord));
    }
  }

  const addMatchRecords = async (records: Omit<TennisMatchRecord, 'id'>[]) => {
    const rows = records.map(r => ({
      player_id: r.playerId,
      player_name: r.playerName,
      opponent_name: r.opponentName,
      opponent_school: r.opponentSchool,
      match_type: r.matchType,
      round: r.round,
      score: r.score,
      won: r.won,
      date: r.date,
      imported_at: r.importedAt,
    }));
    await supabase.from('tennis_match_records').insert(rows);
    await loadRecords();
  };

  const deleteMatchRecord = async (id: string) => {
    await supabase.from('tennis_match_records').delete().eq('id', id);
    setMatchRecords(prev => prev.filter(r => r.id !== id));
  };

  const getPlayerRecords = (playerId: string) =>
    matchRecords.filter(r => r.playerId === playerId);

  const getPlayerRecordsByName = (playerName: string) => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
    const sortedWords = (s: string) => s.toLowerCase().split(/\s+/).map(norm).sort().join('');
    const rosterSorted = sortedWords(playerName);
    return matchRecords.filter(r =>
      norm(r.playerName) === norm(playerName) ||
      sortedWords(r.playerName) === rosterSorted
    );
  };

  return (
    <TennisContext.Provider value={{
      matchRecords,
      addMatchRecords,
      deleteMatchRecord,
      getPlayerRecords,
      getPlayerRecordsByName,
    }}>
      {children}
    </TennisContext.Provider>
  );
}

export function useTennis() {
  const ctx = useContext(TennisContext);
  if (!ctx) throw new Error('useTennis must be used inside TennisProvider');
  return ctx;
}

function rowToRecord(row: Record<string, unknown>): TennisMatchRecord {
  return {
    id: row.id as string,
    playerId: row.player_id as string,
    playerName: row.player_name as string,
    opponentName: row.opponent_name as string,
    opponentSchool: row.opponent_school as string,
    matchType: row.match_type as 'singles' | 'doubles',
    round: row.round as string,
    score: row.score as string,
    won: row.won as boolean,
    date: row.date as string,
    importedAt: row.imported_at as string,
  };
}
