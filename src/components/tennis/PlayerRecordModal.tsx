import { Player, TennisMatchRecord } from '@/types/team';
import { useTennis } from '@/context/TennisContext';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PlayerRecordModalProps {
  player: Player;
  open: boolean;
  onClose: () => void;
}

export function PlayerRecordModal({ player, open, onClose }: PlayerRecordModalProps) {
  const { getPlayerRecords, getPlayerRecordsByName, deleteMatchRecord } = useTennis();
  const { isAdmin } = useAuth();

  const byId = getPlayerRecords(player.id);
  const byName = getPlayerRecordsByName(player.name);
  const allRecords = [...new Map([...byId, ...byName].map(r => [r.id, r])).values()];
  allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const singles = allRecords.filter(r => r.matchType === 'singles');
  const doubles = allRecords.filter(r => r.matchType === 'doubles');

  const wins = (arr: TennisMatchRecord[]) => arr.filter(r => r.won).length;
  const losses = (arr: TennisMatchRecord[]) => arr.filter(r => !r.won).length;

  const singlesW = wins(singles);
  const singlesL = losses(singles);
  const doublesW = wins(doubles);
  const doublesL = losses(doubles);
  const totalW = singlesW + doublesW;
  const totalL = singlesL + doublesL;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-5 w-5 text-gold" />
            {player.name} — Match Record
          </DialogTitle>
        </DialogHeader>

        {allRecords.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            No match records yet. Import a USTA scorecard to get started.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Overall" wins={totalW} losses={totalL} />
              <StatBox label="Singles" wins={singlesW} losses={singlesL} />
              <StatBox label="Doubles" wins={doublesW} losses={doublesL} />
            </div>

            {/* Match history */}
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <TrendingUp className="h-4 w-4" />
                Match History
              </h3>
              <div className="space-y-2">
                {allRecords.map(record => (
                  <div
                    key={record.id}
                    className={cn(
                      'flex items-center justify-between rounded-lg border px-4 py-3 text-sm',
                      record.won
                        ? 'border-l-4 border-l-gold bg-gold/5'
                        : 'border-l-4 border-l-destructive bg-destructive/5'
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            record.won
                              ? 'border-gold/50 text-gold'
                              : 'border-destructive/50 text-destructive'
                          )}
                        >
                          {record.won ? 'W' : 'L'}
                        </Badge>
                        <span className="font-medium">
                          vs. {record.opponentName}
                        </span>
                        <span className="text-muted-foreground">
                          ({record.opponentSchool})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{record.round}</span>
                        <span>•</span>
                        <span className="capitalize">{record.matchType}</span>
                        <span>•</span>
                        <span>{record.score}</span>
                        <span>•</span>
                        <span>{formatDate(record.date)}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive hover:text-destructive"
                        onClick={() => deleteMatchRecord(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatBox({ label, wins, losses }: { label: string; wins: number; losses: number }) {
  const total = wins + losses;
  const pct = total > 0 ? Math.round((wins / total) * 100) : 0;
  return (
    <div className="rounded-lg border p-3 text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold">
        <span className="text-green-500">{wins}</span>
        <span className="text-muted-foreground mx-1">-</span>
        <span className="text-destructive">{losses}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{total > 0 ? `${pct}%` : '—'}</div>
    </div>
  );
}

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}
