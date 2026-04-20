import { Player, TrackResult } from '@/types/team';
import { useTrack } from '@/context/TrackContext';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Timer, Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrackRecordModalProps {
  player: Player;
  open: boolean;
  onClose: () => void;
}

export function TrackRecordModal({ player, open, onClose }: TrackRecordModalProps) {
  const { getAthleteResults, getAthleteResultsByName, deleteTrackResult } = useTrack();
  const { isAdmin } = useAuth();

  const results = (() => {
    const byId = getAthleteResults(player.id);
    return byId.length > 0 ? byId : getAthleteResultsByName(player.name);
  })();

  // Group by event
  const byEvent = results.reduce<Record<string, TrackResult[]>>((acc, r) => {
    if (!acc[r.event]) acc[r.event] = [];
    acc[r.event].push(r);
    return acc;
  }, {});

  // For each event: PR = best time (lowest timeMs), or the one marked isPR
  function getPR(eventResults: TrackResult[]): TrackResult | null {
    const timed = eventResults.filter(r => r.timeMs > 0);
    if (timed.length > 0) return timed.reduce((best, r) => r.timeMs < best.timeMs ? r : best);
    const marked = eventResults.find(r => r.isPR);
    return marked ?? null;
  }

  // Last result per event (most recent date)
  function getLast(eventResults: TrackResult[]): TrackResult {
    return eventResults.reduce((latest, r) =>
      r.meetDate > latest.meetDate ? r : latest
    );
  }

  const eventNames = Object.keys(byEvent).sort();
  const totalPRs = results.filter(r => r.isPR).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Timer className="h-5 w-5 text-gold" />
            {player.name} — Track Record
          </DialogTitle>
        </DialogHeader>

        {results.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">No results imported yet.</p>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded border border-border bg-card p-3 text-center">
                <p className="text-xs text-muted-foreground">Events</p>
                <p className="text-2xl font-bold text-gold">{eventNames.length}</p>
              </div>
              <div className="rounded border border-border bg-card p-3 text-center">
                <p className="text-xs text-muted-foreground">Performances</p>
                <p className="text-2xl font-bold text-foreground">{results.length}</p>
              </div>
              <div className="rounded border border-border bg-card p-3 text-center">
                <p className="text-xs text-muted-foreground">PRs Set</p>
                <p className="text-2xl font-bold text-green-400">{totalPRs}</p>
              </div>
            </div>

            {/* Per-event breakdown */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-gold" />
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Event History</span>
              </div>
              <div className="space-y-3">
                {eventNames.map(event => {
                  const evResults = byEvent[event].sort((a, b) => a.meetDate > b.meetDate ? -1 : 1);
                  const pr = getPR(evResults);
                  const last = getLast(evResults);

                  return (
                    <div key={event} className="rounded border border-border bg-card/50">
                      {/* Event header */}
                      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                        <span className="font-semibold text-sm">{event}</span>
                        <div className="flex items-center gap-2">
                          {pr && (
                            <span className="text-xs text-muted-foreground">
                              PR: <span className="font-mono font-semibold text-green-400">{pr.time}</span>
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Last: <span className="font-mono font-semibold text-foreground">{last.time}</span>
                          </span>
                        </div>
                      </div>

                      {/* Individual results */}
                      <div className="divide-y divide-border/30">
                        {evResults.map(r => (
                          <div key={r.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                            {r.place !== undefined && (
                              <span className={cn(
                                'w-6 text-center font-semibold text-xs',
                                r.place === 1 ? 'text-gold' : r.place <= 3 ? 'text-foreground' : 'text-muted-foreground'
                              )}>
                                {r.place === 1 ? '🥇' : r.place === 2 ? '🥈' : r.place === 3 ? '🥉' : `#${r.place}`}
                              </span>
                            )}
                            <span className="font-mono font-semibold text-foreground">{r.time}</span>
                            {r.isPR && (
                              <Badge className="h-4 px-1 text-[10px] bg-green-500/20 text-green-400 border-green-500/40">
                                <Star className="h-2.5 w-2.5 mr-0.5" />PR
                              </Badge>
                            )}
                            <span className="flex-1 text-muted-foreground text-xs">{r.meetName}</span>
                            <span className="text-muted-foreground text-xs">
                              {new Date(r.meetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteTrackResult(r.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
