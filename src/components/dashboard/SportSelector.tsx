import { useTeam } from '@/context/TeamContext';
import { Button } from '@/components/ui/button';
import { Sport } from '@/types/team';
import { cn } from '@/lib/utils';

const sportOptions: { value: Sport | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All Sports', emoji: '🏆' },
  { value: 'tennis', label: 'Tennis', emoji: '🎾' },
  { value: 'basketball', label: 'Basketball', emoji: '🏀' },
  { value: 'soccer', label: 'Soccer', emoji: '⚽' },
  { value: 'volleyball', label: 'Volleyball', emoji: '🏐' },
  { value: 'baseball', label: 'Baseball', emoji: '⚾' },
  { value: 'football', label: 'Football', emoji: '🏈' },
];

export function SportSelector() {
  const { currentSport, setCurrentSport, games } = useTeam();
  
  // Only show sports that have games
  const sportsWithGames = new Set(games.map(g => g.sport));
  const availableSports = sportOptions.filter(
    s => s.value === 'all' || sportsWithGames.has(s.value as Sport)
  );
  
  // If no games yet, show all sport options
  const displaySports = availableSports.length > 1 ? availableSports : sportOptions;
  
  return (
    <div className="flex flex-wrap gap-2">
      {displaySports.map((sport) => (
        <Button
          key={sport.value}
          variant={currentSport === sport.value ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentSport(sport.value)}
          className={cn(
            "gap-1.5 transition-all",
            currentSport === sport.value && "shadow-md"
          )}
        >
          <span>{sport.emoji}</span>
          <span className="hidden sm:inline">{sport.label}</span>
        </Button>
      ))}
    </div>
  );
}
