import { useState } from 'react';
import { Game, Venue, Sport, Gender, Level } from '@/types/team';
import { useTeam } from '@/context/TeamContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { sportDisplayName } from '@/lib/programUtils';

const SPORTS: Sport[] = [
  'soccer','baseball','tennis','football','badminton','swim',
  'cross_country','volleyball','water_polo','golf','wrestling',
  'swim_dive','basketball','track_field','other',
];

export function AddGameDialog() {
  const { addGame, currentProgram } = useTeam();
  const [open, setOpen] = useState(false);

  // Form state — pre-fill from currentProgram
  const [title, setTitle] = useState('');
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState<Venue>('Away');
  const [location, setLocation] = useState('');
  const [isLeague, setIsLeague] = useState(false);
  const [sport, setSport] = useState<Sport>(currentProgram?.sport ?? 'track_field');
  const [gender, setGender] = useState<Gender>(currentProgram?.gender ?? 'boys');
  const [level, setLevel] = useState<Level>(currentProgram?.level ?? 'varsity');

  // Track-specific: no opponent needed (it's a meet)
  const isTrack = sport === 'track_field' || sport === 'cross_country' || sport === 'swim';

  function handleOpen(val: boolean) {
    if (val) {
      // Reset and prefill from current program
      setTitle('');
      setOpponent('');
      setDate('');
      setTime('');
      setVenue('Away');
      setLocation('');
      setIsLeague(false);
      setSport(currentProgram?.sport ?? 'track_field');
      setGender(currentProgram?.gender ?? 'boys');
      setLevel(currentProgram?.level ?? 'varsity');
    }
    setOpen(val);
  }

  function handleSave() {
    if (!date) { toast.error('Date is required'); return; }
    if (!title.trim() && !opponent.trim()) {
      toast.error('Enter either an event name or opponent'); return;
    }

    addGame({
      sport,
      gender,
      level,
      date: new Date(date + 'T12:00:00'),
      time: time.trim() || undefined,
      opponent: opponent.trim() || undefined,
      title: title.trim() || undefined,
      venue,
      location: location.trim() || undefined,
      isLeague,
    });

    toast.success('Event added');
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Program */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Sport</Label>
              <Select value={sport} onValueChange={(v) => setSport(v as Sport)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPORTS.map((s) => (
                    <SelectItem key={s} value={s}>{sportDisplayName(s)}</SelectItem>
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

          {/* Event name (for meets/invitationals) */}
          <div className="space-y-1.5">
            <Label>{isTrack ? 'Meet Name' : 'Event Title'} <span className="text-muted-foreground text-xs">(optional if opponent set)</span></Label>
            <Input
              placeholder={isTrack ? 'e.g. Bear Valley Invitational' : 'e.g. League Finals'}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Opponent — optional for track */}
          <div className="space-y-1.5">
            <Label>
              Opponent
              {isTrack && <span className="text-muted-foreground text-xs ml-1">(optional for meets)</span>}
            </Label>
            <Input
              placeholder={isTrack ? 'Leave blank for invitationals' : 'e.g. Claremont'}
              value={opponent}
              onChange={e => setOpponent(e.target.value)}
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Time <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>

          {/* Venue */}
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-1.5">
              <Label>Location <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                placeholder="e.g. Webb Campus"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* League toggle */}
          <div className="flex items-center gap-3">
            <Switch id="league" checked={isLeague} onCheckedChange={setIsLeague} />
            <Label htmlFor="league">League event</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Add Event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
