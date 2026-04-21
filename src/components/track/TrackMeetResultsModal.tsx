import { useTrack } from '@/context/TrackContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrackMeetResultsModalProps {
  meetName: string;
  open: boolean;
  onClose: () => void;
}

export function TrackMeetResultsModal({ meetName, open, onClose }: TrackMeetResultsModalProps) {
  const { getMeetResults } = useTrack();
  const results = getMeetResults(meetName);

  // Group by event, sort by place within each event
  const byEvent = results.reduce<Record<string, typeof results>>((acc, r) => {
    if (!acc[r.event]) acc[r.event] = [];
    acc[r.event].push(r);
    return acc;
  }, {});

  const eventOrder = Object.keys(byEvent).sort();

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meetName} — Results</DialogTitle>
        </DialogHeader>

        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No imported results for this meet yet.
          </p>
        ) : (
          <div className="space-y-4 pt-1">
            {eventOrder.map(event => {
              const evResults = [...byEvent[event]].sort((a, b) => {
                if (a.place !== undefined && b.place !== undefined) return a.place - b.place;
                if (a.place !== undefined) return -1;
                if (b.place !== undefined) return 1;
                return (a.timeMs || 0) - (b.timeMs || 0);
              });

              return (
                <div key={event} className="rounded border border-border bg-card/50">
                  <div className="px-4 py-2 border-b border-border/50 font-semibold text-sm">
                    {event}
                  </div>
                  <div className="divide-y divide-border/30">
                    {evResults.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
                        {r.place !== undefined ? (
                          <span className="w-6 text-center text-xs text-muted-foreground font-semibold">
                            #{r.place}
                          </span>
                        ) : (
                          <span className="w-6" />
                        )}
                        <span className="flex-1 font-medium">{r.athleteName}</span>
                        <span className={cn(
                          'font-mono font-semibold',
                          r.isPR ? 'text-green-400' : 'text-foreground'
                        )}>
                          {r.time}
                        </span>
                        {r.isPR && (
                          <Badge className="h-4 px-1 text-[10px] bg-green-500/20 text-green-400 border-green-500/40">
                            <Star className="h-2.5 w-2.5 mr-0.5" />PR
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
