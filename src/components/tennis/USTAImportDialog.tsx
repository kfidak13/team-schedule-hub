import { useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { useTennis } from '@/context/TennisContext';
import { parseUSTAScorecard, USTAParseResult, resolveSchoolName } from '@/lib/ustaParser';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ClipboardPaste, CheckCircle2, AlertCircle, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function USTAImportDialog() {
  const { players, currentProgram, addGame, games, updateGame } = useTeam();
  const { addMatchRecords } = useTennis();
  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [preview, setPreview] = useState<USTAParseResult | null>(null);
  const [addToSchedule, setAddToSchedule] = useState(true);
  const [loading, setLoading] = useState(false);

  const allPlayers = players.map(p => ({ id: p.id, name: p.name }));

  function handlePreview() {
    if (!rawText.trim()) return;
    const result = parseUSTAScorecard(rawText, matchDate, allPlayers);
    setPreview(result);
  }

  async function handleImport() {
    if (!preview || preview.records.length === 0) return;
    setLoading(true);
    try {
      await addMatchRecords(preview.records);

      // Optionally create/update a game in the schedule
      if (addToSchedule && preview.overallScore && currentProgram) {
        const { webbWins, oppWins } = preview.overallScore;
        const webbWon = webbWins > oppWins;
        const scoreStr = `${webbWins}-${oppWins}`;
        const abbrev = preview.opponentSchool || 'Unknown';
        const opponent = resolveSchoolName(abbrev);

        // Find existing game by date + program + fuzzy opponent name match
        const dateStr = matchDate;
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
        const existing = games.find(g =>
          g.sport === currentProgram.sport &&
          g.gender === currentProgram.gender &&
          g.level === currentProgram.level &&
          new Date(g.date).toISOString().slice(0, 10) === dateStr &&
          g.opponent &&
          (norm(g.opponent).includes(norm(opponent)) ||
           norm(opponent).includes(norm(g.opponent)) ||
           norm(g.opponent).includes(norm(abbrev)))
        );

        if (existing) {
          updateGame(existing.id, { result: { won: webbWon, score: scoreStr } });
        } else {
          addGame({
            sport: currentProgram.sport,
            gender: currentProgram.gender,
            level: currentProgram.level,
            date: new Date(matchDate),
            opponent,
            venue: 'Away',
            isLeague: false,
            result: { won: webbWon, score: scoreStr },
          });
        }
      }

      toast.success(`Imported ${preview.records.length} match records`);
      setOpen(false);
      setRawText('');
      setPreview(null);
    } catch {
      toast.error('Import failed');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      setRawText('');
      setPreview(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ClipboardPaste className="h-4 w-4" />
          Import USTA Scorecard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardPaste className="h-5 w-5" />
            Import USTA Scorecard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-300">
            <strong>How to import:</strong> Open the USTA scorecard page in your browser → Select All (Cmd+A) → Copy (Cmd+C) → Paste below.
          </div>

          <div className="space-y-2">
            <Label>Match Date</Label>
            <Input
              type="date"
              value={matchDate}
              onChange={e => setMatchDate(e.target.value)}
              className="w-48"
            />
          </div>

          <div className="space-y-2">
            <Label>Paste Scorecard Text</Label>
            <Textarea
              placeholder="Paste the full text from the USTA scorecard page here..."
              value={rawText}
              onChange={e => { setRawText(e.target.value); setPreview(null); }}
              className="min-h-[180px] font-mono text-xs"
            />
          </div>

          <Button onClick={handlePreview} variant="secondary" disabled={!rawText.trim()}>
            Preview Parsed Results
          </Button>

          {preview && (
            <div className="space-y-3">
              {/* Overall score banner */}
              {preview.overallScore && (
                <div className={cn(
                  'rounded-lg border p-3 text-center',
                  preview.overallScore.webbWins > preview.overallScore.oppWins
                    ? 'border-green-500/40 bg-green-500/10'
                    : 'border-destructive/40 bg-destructive/10'
                )}>
                  <div className="flex items-center justify-center gap-2 font-bold text-lg">
                    <Trophy className="h-5 w-5" />
                    Webb {preview.overallScore.webbWins} — {preview.overallScore.oppWins} {preview.opponentSchool}
                  </div>
                  <div className={cn(
                    'text-sm font-semibold mt-1',
                    preview.overallScore.webbWins > preview.overallScore.oppWins
                      ? 'text-green-400'
                      : 'text-destructive'
                  )}>
                    {preview.overallScore.webbWins > preview.overallScore.oppWins ? 'WIN' : 'LOSS'}
                  </div>
                  <label className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addToSchedule}
                      onChange={e => setAddToSchedule(e.target.checked)}
                      className="accent-primary"
                    />
                    Add result to schedule
                  </label>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm font-semibold">
                Found {preview.records.length} individual match result{preview.records.length !== 1 ? 's' : ''}
              </div>

              {preview.unmatched.length > 0 && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    <AlertCircle className="h-4 w-4" />
                    Could not match to roster players:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {preview.unmatched.map(n => (
                      <Badge key={n} variant="outline" className="border-yellow-500/50 text-yellow-300">{n}</Badge>
                    ))}
                  </div>
                  <p className="mt-2 text-xs opacity-80">Records will still be imported — they'll show up when the player name matches.</p>
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {preview.records.map((r, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center justify-between rounded-md border px-3 py-2 text-sm',
                      r.won ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-destructive'
                    )}
                  >
                    <div>
                      <span className="font-medium">{r.playerName}</span>
                      <span className="text-muted-foreground mx-2">vs.</span>
                      <span>{r.opponentName} ({r.opponentSchool})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{r.score}</span>
                      <span>•</span>
                      <span className="capitalize">{r.matchType}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          r.won
                            ? 'border-green-500/50 text-green-400'
                            : 'border-destructive/50 text-destructive'
                        )}
                      >
                        {r.won ? 'W' : 'L'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleImport}
                  disabled={loading || preview.records.length === 0}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {loading ? 'Importing...' : `Import ${preview.records.length} Records`}
                </Button>
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Edit Text
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
