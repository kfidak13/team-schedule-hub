import { useTeam } from '@/context/TeamContext';
import { PlayerCard } from '@/components/roster/PlayerCard';
import { CoachCard } from '@/components/roster/CoachCard';
import { AddPersonDialog } from '@/components/roster/AddPersonDialog';
import { RosterImporter } from '@/components/roster/RosterImporter';
import { SportSelector } from '@/components/dashboard/SportSelector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Users, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export default function Roster() {
  const { players, coaches, currentSport, deletePlayer, deleteCoach } = useTeam();
  const location = useLocation();

  const activeView = location.pathname.includes('/roster/coaches') ? 'coaches' : 'players';
  
  // Filter by current sport
  const filteredPlayers = currentSport === 'all'
    ? players
    : players.filter(p => p.sports.includes(currentSport));
  
  const filteredCoaches = currentSport === 'all'
    ? coaches
    : coaches.filter(c => c.sports.includes(currentSport));
  
  const handleDeletePlayer = (id: string) => {
    deletePlayer(id);
    toast.success('Player removed');
  };
  
  const handleDeleteCoach = (id: string) => {
    deleteCoach(id);
    toast.success('Coach removed');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roster</h1>
          <p className="text-muted-foreground">
            Manage your team's players and coaches
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {activeView === 'players' ? <Users className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                {activeView === 'players' ? `Players (${filteredPlayers.length})` : `Coaches (${filteredCoaches.length})`}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/roster/players" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Players ({filteredPlayers.length})
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/roster/coaches" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Coaches ({filteredCoaches.length})
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <RosterImporter />
          <AddPersonDialog type="player" />
          <AddPersonDialog type="coach" />
        </div>
      </div>
      
      <SportSelector />
      
      {activeView === 'players' ? (
        <div className="space-y-3">
          {filteredPlayers.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                No players yet. Add your first player above!
              </p>
            </div>
          ) : (
            filteredPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} onDelete={handleDeletePlayer} />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCoaches.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                No coaches yet. Add your first coach above!
              </p>
            </div>
          ) : (
            filteredCoaches.map((coach) => (
              <CoachCard key={coach.id} coach={coach} onDelete={handleDeleteCoach} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
