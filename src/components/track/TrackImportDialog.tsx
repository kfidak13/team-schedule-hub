import { useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { useTrack } from '@/context/TrackContext';
import { parseTrackResults, TrackParseResult } from '@/lib/trackParser';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function TrackImportDialog() {
  const { players, currentProgram } = useTeam();
  const { addTrackResults, trackResults } = useTrack();

  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [meetName, setMeetName] = useState('');
  const [meetDate, setMeetDate] = useState('');
  const [preview, setPreview] = useState<TrackParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const trackPlayers = players.filter(p =>
    p.sports?.includes('track_field') &&
    (!currentProgram || p.programKey === `track_field_${currentProgram.gender}_${currentProgram.level}`)
  );

  function handlePreview() {
    if (!rawText.trim()) { toast.error('Paste results text first'); return; }
    if (!meetName.trim()) { toast.error('Enter a meet name'); return; }
    if (!meetDate) { toast.error('Enter the meet date'); return; }

    const result = parseTrackResults(
      rawText,
      meetName,
      meetDate,
      trackPlayers.map(p => ({ id: p.id, name: p.name })),
      trackResults,
    );
    setPreview(result);
    setStep('preview');
  }

  async function handleImport() {
    if (!preview || preview.results.length === 0) return;
    setLoading(true);
    try {
      await addTrackResults(preview.results);
      toast.success(`Imported ${preview.results.length} results`);
      setOpen(false);
      setRawText('');
      setMeetName('');
      setMeetDate('');
      setPreview(null);
      setStep('input');
    } catch {
      toast.error('Import failed');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setStep('input');
    setPreview(null);
  }

  // Group preview results by event
  const byEvent = preview?.results.reduce<Record<string, typeof preview.results>>((acc, r) => {
    if (!acc[r.event]) acc[r.event] = [];
    acc[r.event].push(r);
    return acc;
  }, {}) ?? {};

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Upload className="h-4 w-4" />
          Import Results
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Track Results</DialogTitle>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Meet Name</label>
                <Input
                  placeholder="e.g. Bear Valley Invitational"
                  value={meetName}
                  onChange={e => setMeetName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Meet Date</label>
                <Input
                  type="date"
                  value={meetDate}
                  onChange={e => setMeetDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Paste Results</label>
              <p className="text-xs text-muted-foreground">
                Paste results from Athletic.net, USTA, or any tab/space-separated format with event headers, athlete names, and times.
              </p>
              <Textarea
                className="font-mono text-xs min-h-[240px]"
                placeholder={`100 Meters\n1  Smith John  WEBB  10.85  PR\n2  Doe Jane  OHS  11.12\n\n400 Meters\n1  Smith John  WEBB  48.32`}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button onClick={handlePreview}>Preview Parsed Results</Button>
            </div>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{preview.meetName}</p>
                <p className="text-sm text-muted-foreground">{preview.meetDate}</p>
              </div>
              <Badge variant="secondary">{preview.results.length} results</Badge>
            </div>

            {preview.unmatched.length > 0 && (
              <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm">
                <p className="font-medium text-yellow-400 mb-1">Unmatched athletes (will still import):</p>
                <p className="text-muted-foreground">{preview.unmatched.join(', ')}</p>
              </div>
            )}

            {/* Preview by event */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {Object.entries(byEvent).map(([event, evResults]) => (
                <div key={event} className="rounded border border-border bg-card/50">
                  <div className="px-4 py-2 border-b border-border/50 font-semibold text-sm">{event}</div>
                  <div className="divide-y divide-border/30">
                    {evResults.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
                        {r.place !== undefined && (
                          <span className="w-5 text-center text-xs text-muted-foreground font-semibold">#{r.place}</span>
                        )}
                        <span className="flex-1 font-medium">{r.athleteName}</span>
                        <span className={cn('font-mono font-semibold', r.isPR ? 'text-green-400' : 'text-foreground')}>
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
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setStep('input')}>Edit Text</Button>
              <Button onClick={handleImport} disabled={loading || preview.results.length === 0}>
                <Upload className="h-4 w-4 mr-2" />
                Import {preview.results.length} Results
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
