import { useTeam } from '@/context/TeamContext';
import { Sport } from '@/types/team';
import type { ElementType } from 'react';
import { Trophy, Volleyball, CircleDot, Dumbbell, CalendarDays } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const sportOptions: { value: Sport | 'all'; label: string; icon: ElementType }[] = [
  { value: 'all', label: 'All Sports', icon: Trophy },
  { value: 'tennis', label: 'Tennis', icon: CircleDot },
  { value: 'basketball', label: 'Basketball', icon: Dumbbell },
  { value: 'soccer', label: 'Soccer', icon: CircleDot },
  { value: 'volleyball', label: 'Volleyball', icon: Volleyball },
  { value: 'baseball', label: 'Baseball', icon: Trophy },
  { value: 'football', label: 'Football', icon: CalendarDays },
  { value: 'badminton', label: 'Badminton', icon: CircleDot },
  { value: 'swim', label: 'Swim', icon: Trophy },
  { value: 'cross_country', label: 'Cross Country', icon: Trophy },
  { value: 'water_polo', label: 'Water Polo', icon: Trophy },
  { value: 'golf', label: 'Golf', icon: Trophy },
  { value: 'wrestling', label: 'Wrestling', icon: Dumbbell },
  { value: 'swim_dive', label: 'Swim and Dive', icon: Trophy },
  { value: 'other', label: 'Other', icon: Trophy },
];

export function SportSelector() {
  const { currentSport, setCurrentSport, games, players, coaches, teamInfos, importedStats } = useTeam();
  
  // Only show sports that have data
  const sportsWithData = new Set<Sport>();
  games.forEach(g => sportsWithData.add(g.sport));
  players.forEach(p => p.sports.forEach(s => sportsWithData.add(s)));
  coaches.forEach(c => c.sports.forEach(s => sportsWithData.add(s)));
  teamInfos.forEach(t => sportsWithData.add(t.sport));
  (Object.keys(importedStats) as Sport[]).forEach(s => sportsWithData.add(s));

  const availableSports = sportOptions.filter(
    s => s.value === 'all' || sportsWithData.has(s.value as Sport)
  );
  
  // If no games yet, show all sport options
  const displaySports = availableSports.length > 1 ? availableSports : sportOptions;
  
  return (
    <Select value={currentSport} onValueChange={(v) => setCurrentSport(v as Sport | 'all')}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Select sport" />
      </SelectTrigger>
      <SelectContent>
        {displaySports.map((sport) => (
          <SelectItem key={sport.value} value={sport.value}>
            <span className="flex items-center gap-2">
              <sport.icon className="h-4 w-4" />
              {sport.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
