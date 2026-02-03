import { useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { GameCard } from './GameCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, List, Search } from 'lucide-react';
import { format, isSameMonth, startOfMonth } from 'date-fns';
import { Venue } from '@/types/team';
import { toast } from 'sonner';

type ViewMode = 'list' | 'month';
type VenueFilter = Venue | 'all';
type LeagueFilter = 'all' | 'league' | 'non-league';

export function ScheduleList() {
  const { games, currentSport, deleteGame } = useTeam();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [venueFilter, setVenueFilter] = useState<VenueFilter>('all');
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>('all');
  
  // Filter games
  let filteredGames = games.filter(game => {
    if (currentSport !== 'all' && game.sport !== currentSport) return false;
    if (venueFilter !== 'all' && game.venue !== venueFilter) return false;
    if (leagueFilter === 'league' && !game.isLeague) return false;
    if (leagueFilter === 'non-league' && game.isLeague) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesOpponent = game.opponent?.toLowerCase().includes(query);
      const matchesLocation = game.location?.toLowerCase().includes(query);
      const matchesTitle = game.title?.toLowerCase().includes(query);
      if (!matchesOpponent && !matchesLocation && !matchesTitle) return false;
    }
    return true;
  });
  
  // Sort by date
  filteredGames = [...filteredGames].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const handleDelete = (id: string) => {
    deleteGame(id);
    toast.success('Game deleted');
  };
  
  // Group by month for month view
  const gamesByMonth = filteredGames.reduce((acc, game) => {
    const monthKey = format(startOfMonth(new Date(game.date)), 'yyyy-MM');
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(game);
    return acc;
  }, {} as Record<string, typeof filteredGames>);
  
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={venueFilter} onValueChange={(v) => setVenueFilter(v as VenueFilter)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Venues</SelectItem>
            <SelectItem value="Home">Home</SelectItem>
            <SelectItem value="Away">Away</SelectItem>
            <SelectItem value="Neutral">Neutral</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={leagueFilter} onValueChange={(v) => setLeagueFilter(v as LeagueFilter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Games</SelectItem>
            <SelectItem value="league">League Only</SelectItem>
            <SelectItem value="non-league">Non-League</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex rounded-md border">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-r-none"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'month' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('month')}
            className="rounded-l-none"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Games list */}
      {filteredGames.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {games.length === 0
              ? 'No games yet. Import a schedule or add games manually.'
              : 'No games match your filters.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(gamesByMonth).map(([monthKey, monthGames]) => (
            <div key={monthKey}>
              <h3 className="mb-3 text-lg font-semibold">
                {format(new Date(monthKey + '-01'), 'MMMM yyyy')}
              </h3>
              <div className="space-y-3">
                {monthGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
