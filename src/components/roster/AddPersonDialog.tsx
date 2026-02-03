import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

type PersonType = 'player' | 'coach';

const sportOptions: { value: Sport; label: string }[] = [
  { value: 'tennis', label: 'Tennis' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'volleyball', label: 'Volleyball' },
  { value: 'baseball', label: 'Baseball' },
  { value: 'football', label: 'Football' },
  { value: 'other', label: 'Other' },
];

const coachRoles = ['Head Coach', 'Assistant Coach', 'Volunteer'] as const;

interface AddPersonDialogProps {
  type: PersonType;
}

export function AddPersonDialog({ type }: AddPersonDialogProps) {
  const [open, setOpen] = useState(false);
  const { addPlayer, addCoach } = useTeam();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  
  // Player-specific
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [position, setPosition] = useState('');
  
  // Coach-specific
  const [role, setRole] = useState<typeof coachRoles[number]>('Head Coach');
  
  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSelectedSports([]);
    setJerseyNumber('');
    setPosition('');
    setRole('Head Coach');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    
    if (selectedSports.length === 0) {
      toast.error('Please select at least one sport');
      return;
    }
    
    if (type === 'player') {
      addPlayer({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        jerseyNumber: jerseyNumber.trim() || undefined,
        position: position.trim() || undefined,
        sports: selectedSports,
      });
      toast.success('Player added!');
    } else {
      addCoach({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        role,
        sports: selectedSports,
      });
      toast.success('Coach added!');
    }
    
    resetForm();
    setOpen(false);
  };
  
  const toggleSport = (sport: Sport) => {
    setSelectedSports(prev =>
      prev.includes(sport)
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add {type === 'player' ? 'Player' : 'Coach'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {type === 'player' ? 'Player' : 'Coach'}</DialogTitle>
          <DialogDescription>
            Add a new {type} to your team roster.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
            />
          </div>
          
          {type === 'player' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jersey">Jersey Number</Label>
                <Input
                  id="jersey"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  placeholder="12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Singles"
                />
              </div>
            </div>
          )}
          
          {type === 'coach' && (
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {coachRoles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Sports *</Label>
            <div className="flex flex-wrap gap-3">
              {sportOptions.map((sport) => (
                <label
                  key={sport.value}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={selectedSports.includes(sport.value)}
                    onCheckedChange={() => toggleSport(sport.value)}
                  />
                  {sport.label}
                </label>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add {type === 'player' ? 'Player' : 'Coach'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
