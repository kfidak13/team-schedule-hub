import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TrackResult } from '@/types/team';
import { supabase } from '@/lib/supabase';

interface TrackContextValue {
  trackResults: TrackResult[];
  addTrackResults: (results: Omit<TrackResult, 'id'>[]) => Promise<void>;
  deleteTrackResult: (id: string) => Promise<void>;
  getAthleteResults: (athleteId: string) => TrackResult[];
  getAthleteResultsByName: (name: string) => TrackResult[];
}

const TrackContext = createContext<TrackContextValue | undefined>(undefined);

export function TrackProvider({ children }: { children: ReactNode }) {
  const [trackResults, setTrackResults] = useState<TrackResult[]>([]);

  useEffect(() => {
    loadResults();
    const sub = supabase
      .channel('track_results')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'track_results' }, loadResults)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  async function loadResults() {
    const { data } = await supabase
      .from('track_results')
      .select('*')
      .order('meet_date', { ascending: false });
    if (data) setTrackResults(data.map(rowToResult));
  }

  const addTrackResults = async (results: Omit<TrackResult, 'id'>[]) => {
    const rows = results.map(r => ({
      athlete_id: r.athleteId,
      athlete_name: r.athleteName,
      event: r.event,
      time: r.time,
      time_ms: r.timeMs,
      place: r.place ?? null,
      meet_name: r.meetName,
      meet_date: r.meetDate,
      is_pr: r.isPR,
      imported_at: r.importedAt,
    }));
    await supabase.from('track_results').insert(rows);
    await loadResults();
  };

  const deleteTrackResult = async (id: string) => {
    await supabase.from('track_results').delete().eq('id', id);
    setTrackResults(prev => prev.filter(r => r.id !== id));
  };

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const sortedWords = (s: string) => s.toLowerCase().split(/\s+/).map(norm).sort().join('');

  const getAthleteResults = (athleteId: string) =>
    trackResults.filter(r => r.athleteId === athleteId);

  const getAthleteResultsByName = (name: string) => {
    const rosterSorted = sortedWords(name);
    return trackResults.filter(r =>
      norm(r.athleteName) === norm(name) ||
      sortedWords(r.athleteName) === rosterSorted
    );
  };

  return (
    <TrackContext.Provider value={{
      trackResults,
      addTrackResults,
      deleteTrackResult,
      getAthleteResults,
      getAthleteResultsByName,
    }}>
      {children}
    </TrackContext.Provider>
  );
}

export function useTrack() {
  const ctx = useContext(TrackContext);
  if (!ctx) throw new Error('useTrack must be used inside TrackProvider');
  return ctx;
}

function rowToResult(row: Record<string, unknown>): TrackResult {
  return {
    id: row.id as string,
    athleteId: row.athlete_id as string,
    athleteName: row.athlete_name as string,
    event: row.event as string,
    time: row.time as string,
    timeMs: row.time_ms as number,
    place: row.place as number | undefined,
    meetName: row.meet_name as string,
    meetDate: row.meet_date as string,
    isPR: row.is_pr as boolean,
    importedAt: row.imported_at as string,
  };
}
