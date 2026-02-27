import { useEffect, useState } from 'react';
import { Game, Venue, Sport, Gender, Level } from '@/types/team';
import { useTeam } from '@/context/TeamContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditGameDialogProps {
  game: Game | null;
  open: boolean;
  onClose: () => void;
}

const SPORTS: Sport[] = [
  'soccer','baseball','tennis','football','badminton','swim',
  'cross_country','volleyball','water_polo','golf','wrestling',
  'swim_dive','basketball','other',
];

const sportLabel = (s: Sport) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function EditGameDialog({ game, open, onClose }: EditGameDialogProps) {
  const { updateGame } = useTeam();

  const [opponent, setOpponent] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState<Venue>('Home');
  const [location, setLocation] = useState('');
  const [isLeague, setIsLeague] = useState(false);
  const [sport, setSport] = useState<Sport>('soccer');
  const [gender, setGender] = useState<Gender>('boys');
  const [level, setLevel] = useState<Level>('varsity');

  // Score / result
  const [hasResult, setHasResult] = useState(false);
  const [won, setWon] = useState<'win' | 'loss'>('win');
  const [score, setScore] = useState('');

  useEffect(() => {
    if (!game) return;
    setOpponent(game.opponent ?? '');
    setTitle(game.title ?? '');
    setDate(new Date(game.date).toISOString().slice(0, 10));
    setTime(game.time ?? '');
    setVenue(game.venue);
    setLocation(game.location ?? '');
    setIsLeague(game.isLeague);
    setSport(game.sport);
    setGender(game.gender);
    setLevel(game.level);
    setHasResult(!!game.result);
    setWon(game.result?.won ? 'win' : 'loss');
    setScore(game.result?.score ?? '');
  }, [game]);

  const handleSave = () => {
    if (!game) return;
    if (!date) { toast.error('Date is required'); return; }

    const result = hasResult && score.trim()
      ? { won: won === 'win', score: score.trim() }
      : undefined;

    updateGame(game.id, {
      opponent: opponent.trim() || undefined,
      title: title.trim() || undefined,
      date: new Date(date),
      time: time.trim() || undefined,
      venue,
      location: location.trim() || undefined,
      isLeague,
      sport,
      gender,
      level,
      result,
    });

    toast.success('Game updated');
    onClose();
  };

  const handleClearResult = () => {
    setHasResult(false);
    setScore('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Game</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Program fields */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Sport</Label>
              <Select value={sport} onValueChange={(v) => setSport(v as Sport)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPORTS.map((s) => (
                    <SelectItem key={s} value={s}>{sportLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="boys">Boys</SelectItem>
                  <SelectItem value="girls">Girls</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as Level)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="varsity">Varsity</SelectItem>
                  <SelectItem value="jv">JV</SelectItem>
                  <SelectItem value="frosh">Frosh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Opponent / Title */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Opponent</Label>
              <Input
                placeholder="e.g. Polytechnic"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Title <span className="text-muted-foreground text-xs">(optional override)</span></Label>
              <Input
                placeholder="e.g. CIF Playoffs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          {/* Date / Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input
                placeholder="e.g. 3:30 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Venue / Location / League */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Venue</Label>
              <Select value={venue} onValueChange={(v) => setVenue(v as Venue)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Away">Away</SelectItem>
                  <SelectItem value="Neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Location</Label>
              <Input
                placeholder="e.g. Webb Fields"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isLeague"
              type="checkbox"
              checked={isLeague}
              onChange={(e) => setIsLeague(e.target.checked)}
              className="h-4 w-4 rounded accent-[#D4AF37]"
            />
            <Label htmlFor="isLeague" className="cursor-pointer">League game</Label>
          </div>

          {/* Score / Result */}
          <div className="rounded border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Result / Score</Label>
              {hasResult && (
                <button
                  type="button"
                  onClick={handleClearResult}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear result
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                id="hasResult"
                type="checkbox"
                checked={hasResult}
                onChange={(e) => setHasResult(e.target.checked)}
                className="h-4 w-4 rounded accent-[#D4AF37]"
              />
              <Label htmlFor="hasResult" className="cursor-pointer">Game has been played</Label>
            </div>

            {hasResult && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Outcome</Label>
                  <Select value={won} onValueChange={(v) => setWon(v as 'win' | 'loss')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="win">Win</SelectItem>
                      <SelectItem value="loss">Loss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Score</Label>
                  <Input
                    placeholder="e.g. 3-1"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            className="bg-[#D4AF37] text-[#002855] font-semibold hover:bg-[#C5A551]"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
