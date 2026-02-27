import { useState } from 'react';
import { parseScheduleHtml } from '@/lib/htmlParser';
import { useTeam } from '@/context/TeamContext';
import { programKey, programLabel } from '@/lib/programUtils';
import type { Game } from '@/types/team';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Link, Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Use local proxy server (must be running on port 3001)
const PROXY_URL = 'http://localhost:3001/api/proxy?url=';

async function fetchWithProxy(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(PROXY_URL + encodeURIComponent(url), {
      signal: controller.signal,
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text().catch(() => '');
      throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out. Try again.');
    }
    if (err instanceof TypeError) {
      throw new Error('Proxy server not running (or blocked). Please start it with: npm run proxy');
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function HtmlImporter() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<{
    games: number;
    players: number;
    coaches: number;
    teamName?: string;
    hasStats?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { currentProgram, replaceGamesForProgram, replacePlayersForProgram, replaceCoachesForProgram, addTeamInfo, addImportedStats } = useTeam();

  const fetchAndParse = async () => {
    if (!url.trim()) { setError('Please enter a URL'); return null; }
    if (!currentProgram) { setError('No program selected. Choose a sport first.'); return null; }

    setIsLoading(true);
    setError(null);

    try {
      const html = await fetchWithProxy(url.trim());
      const raw = parseScheduleHtml(html, currentProgram.sport);
      const pKey = programKey(currentProgram);
      // Tag every game with the full program (sport + gender + level)
      const taggedGames: Game[] = raw.games.map(g => ({
        ...g,
        gender: currentProgram.gender,
        level: currentProgram.level,
      }));
      // Tag players/coaches with this program's key
      const taggedPlayers = raw.players.map(p => ({ ...p, programKey: pKey, sports: [currentProgram.sport] }));
      const taggedCoaches = raw.coaches.map(c => ({ ...c, programKey: pKey, sports: [currentProgram.sport] }));
      return { ...raw, games: taggedGames, players: taggedPlayers, coaches: taggedCoaches };
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch URL');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    const result = await fetchAndParse();
    if (result) {
      setPreview({
        games: result.games.length,
        players: result.players.length,
        coaches: result.coaches.length,
        teamName: result.teamInfo?.name,
        hasStats: !!result.importedStats,
      });
    }
  };

  const handleImport = async () => {
    const result = await fetchAndParse();
    if (!result) return;

    if (result.games.length === 0 && result.players.length === 0 && result.coaches.length === 0 && !result.importedStats) {
      toast.error('No data found at this URL. Please check the URL is correct.');
      return;
    }

    if (result.games.length > 0 && currentProgram) {
      replaceGamesForProgram(currentProgram, result.games);
    }
    const pKey = programKey(currentProgram!);
    if (result.teamInfo) addTeamInfo(result.teamInfo);
    if (result.players.length > 0) replacePlayersForProgram(pKey, result.players);
    if (result.coaches.length > 0) replaceCoachesForProgram(pKey, result.coaches);
    if (result.importedStats && currentProgram) {
      addImportedStats(programKey(currentProgram), result.importedStats);
    }

    const parts = [];
    if (result.games.length > 0) parts.push(`${result.games.length} games`);
    if (result.players.length > 0) parts.push(`${result.players.length} players`);
    if (result.coaches.length > 0) parts.push(`${result.coaches.length} coaches`);
    if (result.importedStats) parts.push('team stats');

    toast.success(`Imported ${parts.join(', ')}!`);
    setUrl('');
    setPreview(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Link className="h-4 w-4" />
          Import from URL
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Import Schedule & Roster
          </DialogTitle>
          <DialogDescription>
            {currentProgram
              ? `Importing for: ${programLabel(currentProgram)}`
              : 'Select a program first from the sport switcher.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="url">Team Page URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://yourschool.org/athletics/team/..."
              value={url}
              onChange={(e) => { setUrl(e.target.value); setPreview(null); setError(null); }}
            />
            <p className="text-xs text-muted-foreground">
              Paste the full URL to your team's schedule page
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {preview && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-primary">
                <Check className="h-5 w-5" />
                <div>
                  <span className="font-medium">
                    {preview.teamName && `${preview.teamName}: `}
                  </span>
                  <span>
                    Found {preview.games} games, {preview.coaches} coaches
                    {preview.players > 0 && `, ${preview.players} players`}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={!url.trim() || isLoading || !currentProgram}
            >
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Fetching...</> : 'Preview'}
            </Button>
            <Button
              onClick={handleImport}
              disabled={!url.trim() || isLoading || !currentProgram}
            >
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</> : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
