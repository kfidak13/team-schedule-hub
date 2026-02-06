import { useTeam } from '@/context/TeamContext';
import { PlayerCard } from '@/components/roster/PlayerCard';
import { CoachCard } from '@/components/roster/CoachCard';
import { AddPersonDialog } from '@/components/roster/AddPersonDialog';
import { RosterImporter } from '@/components/roster/RosterImporter';
import { SportSelector } from '@/components/dashboard/SportSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function Roster() {
  const { players, coaches, currentSport, deletePlayer, deleteCoach } = useTeam();
  
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
        <div className="flex flex-wrap gap-2">
          <RosterImporter />
          <AddPersonDialog type="player" />
          <AddPersonDialog type="coach" />
        </div>
      </div>
      
      <SportSelector />
      
      <Tabs defaultValue="players" className="space-y-4">
        <TabsList>
          <TabsTrigger value="players">
            Players ({filteredPlayers.length})
          </TabsTrigger>
          <TabsTrigger value="coaches">
            Coaches ({filteredCoaches.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="players" className="space-y-3">
          {filteredPlayers.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                No players yet. Add your first player above!
              </p>
            </div>
          ) : (
            filteredPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onDelete={handleDeletePlayer}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="coaches" className="space-y-3">
          {filteredCoaches.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                No coaches yet. Add your first coach above!
              </p>
            </div>
          ) : (
            filteredCoaches.map((coach) => (
              <CoachCard
                key={coach.id}
                coach={coach}
                onDelete={handleDeleteCoach}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
