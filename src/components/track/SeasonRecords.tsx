import { useMemo } from 'react';
import { useTrack } from '@/context/TrackContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star } from 'lucide-react';
import type { Player, TrackResult } from '@/types/team';
import { cn } from '@/lib/utils';

interface SeasonRecordsProps {
  /** Roster of athletes for the current program — only their results are considered. */
  athletes: Player[];
}

/**
 * Per-event leaderboard of the team's best season results.
 * Timed events: lowest timeMs (>0) wins.
 * Field events (timeMs = 0): use the most recent isPR=true result.
 */
export function SeasonRecords({ athletes }: SeasonRecordsProps) {
  const { trackResults } = useTrack();

  const records = useMemo(() => buildEventRecords(trackResults, athletes), [trackResults, athletes]);

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Season Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No track results imported yet for this program.
            {athletes.length === 0 && ' Add athletes to the roster first.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Season Records
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Best mark per event from imported results.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {records.map(({ event, best, runnerUp, totalEntries }) => (
            <div key={event} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-sm truncate">{event}</span>
                  {best.isPR && (
                    <Badge className="h-4 px-1 text-[10px] bg-green-500/20 text-green-400 border-green-500/40 shrink-0">
                      <Star className="h-2.5 w-2.5 mr-0.5" />PR
                    </Badge>
                  )}
                </div>
                <span className="font-mono text-base font-bold text-[#D4AF37] shrink-0">
                  {best.time}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 flex-wrap text-xs">
                <span className={cn('flex items-center gap-1.5')}>
                  <span className="font-medium text-foreground">{best.athleteName}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{best.meetName}</span>
                </span>
                <span className="text-muted-foreground">
                  {new Date(best.meetDate).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </div>
              {runnerUp && (
                <div className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <span>2nd:</span>
                  <span className="font-mono">{runnerUp.time}</span>
                  <span>·</span>
                  <span>{runnerUp.athleteName}</span>
                  {totalEntries > 2 && (
                    <span className="ml-auto">+{totalEntries - 2} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface EventRecord {
  event: string;
  best: TrackResult;
  runnerUp?: TrackResult;
  totalEntries: number;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
const sortedWords = (s: string) => s.toLowerCase().split(/\s+/).map(norm).sort().join('');

function buildEventRecords(allResults: TrackResult[], athletes: Player[]): EventRecord[] {
  if (athletes.length === 0) return [];

  // Build set of accepted athlete identifiers (id + normalized name + sorted words)
  const ids = new Set(athletes.map(a => a.id));
  const names = new Set(athletes.map(a => norm(a.name)));
  const namesSorted = new Set(athletes.map(a => sortedWords(a.name)));

  const ourResults = allResults.filter(r =>
    ids.has(r.athleteId) ||
    names.has(norm(r.athleteName)) ||
    namesSorted.has(sortedWords(r.athleteName))
  );

  if (ourResults.length === 0) return [];

  // Group by event
  const byEvent = new Map<string, TrackResult[]>();
  for (const r of ourResults) {
    const list = byEvent.get(r.event) ?? [];
    list.push(r);
    byEvent.set(r.event, list);
  }

  const records: EventRecord[] = [];
  for (const [event, list] of byEvent) {
    const sorted = sortBest(list);
    if (sorted.length === 0) continue;
    records.push({
      event,
      best: sorted[0],
      runnerUp: sorted[1],
      totalEntries: sorted.length,
    });
  }

  // Sort events alphabetically
  records.sort((a, b) => a.event.localeCompare(b.event));
  return records;
}

/**
 * Sort track results best-first.
 * Timed events (timeMs > 0): lowest timeMs is best.
 * Field events (timeMs = 0): newest PR first, then newest meet.
 */
function sortBest(results: TrackResult[]): TrackResult[] {
  const timed = results.filter(r => r.timeMs > 0);
  const field = results.filter(r => r.timeMs === 0);

  if (timed.length > 0) {
    return [...timed].sort((a, b) => a.timeMs - b.timeMs);
  }

  // Field — prioritize PRs by date desc
  const prs = field.filter(r => r.isPR).sort((a, b) => (b.meetDate > a.meetDate ? 1 : -1));
  const others = field.filter(r => !r.isPR).sort((a, b) => (b.meetDate > a.meetDate ? 1 : -1));
  return [...prs, ...others];
}
