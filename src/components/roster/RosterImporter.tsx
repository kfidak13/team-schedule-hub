import { useState } from 'react';
import { parseScheduleHtml } from '@/lib/htmlParser';
import { useTeam } from '@/context/TeamContext';
import { Sport } from '@/types/team';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link, Loader2, Check, AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

const sportOptions: { value: Sport; label: string }[] = [
  { value: 'tennis', label: 'Tennis' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'volleyball', label: 'Volleyball' },
  { value: 'baseball', label: 'Baseball' },
  { value: 'football', label: 'Football' },
  { value: 'other', label: 'Other' },
];

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export function RosterImporter() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [sport, setSport] = useState<Sport>('tennis');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<{
    players: number;
    coaches: number;
    teamName?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addPlayers, addCoaches, addTeamInfo } = useTeam();

  const fetchAndParse = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(CORS_PROXY + encodeURIComponent(url.trim()));
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      const html = await response.text();
      const result = parseScheduleHtml(html, sport);
      return result;
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
        players: result.players.length,
        coaches: result.coaches.length,
        teamName: result.teamInfo?.name,
      });
    }
  };

  const handleImport = async () => {
    const result = await fetchAndParse();
    if (!result) return;

    if (result.players.length === 0 && result.coaches.length === 0) {
      toast.error('No roster data found at this URL. Check the URL is correct.');
      return;
    }

    if (result.teamInfo) addTeamInfo(result.teamInfo);
    if (result.players.length > 0) addPlayers(result.players);
    if (result.coaches.length > 0) addCoaches(result.coaches);

    const parts = [];
    if (result.players.length > 0) parts.push(`${result.players.length} players`);
    if (result.coaches.length > 0) parts.push(`${result.coaches.length} coaches`);

    toast.success(`Imported ${parts.join(' and ')}!`);
    setUrl('');
    setPreview(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          Import Roster from URL
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Import Roster
          </DialogTitle>
          <DialogDescription>
            Enter the URL of your school's team roster page to import players and coaches.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="roster-sport">Sport</Label>
            <Select value={sport} onValueChange={(v) => { setSport(v as Sport); setPreview(null); setError(null); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {sportOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roster-url">Roster Page URL</Label>
            <Input
              id="roster-url"
              type="url"
              placeholder="https://yourschool.org/athletics/team/roster..."
              value={url}
              onChange={(e) => { setUrl(e.target.value); setPreview(null); setError(null); }}
            />
            <p className="text-xs text-muted-foreground">
              Paste the full URL to your team's roster page
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
                    Found {preview.players} players, {preview.coaches} coaches
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handlePreview} disabled={!url.trim() || isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Fetching...</> : 'Preview'}
            </Button>
            <Button onClick={handleImport} disabled={!url.trim() || isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</> : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
