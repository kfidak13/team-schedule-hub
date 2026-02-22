import { HtmlImporter } from '@/components/schedule/HtmlImporter';
import { ScheduleList } from '@/components/schedule/ScheduleList';
import { useTeam } from '@/context/TeamContext';
import { useAuth } from '@/context/AuthContext';
import { programLabel } from '@/lib/programUtils';

export default function Schedule() {
  const { games, currentSport, currentProgram } = useTeam();
  const { isAdmin } = useAuth();

  const filteredGames = games.filter(
    (g) => currentSport === 'all' || g.sport === currentSport
  );
  const wins = filteredGames.filter((g) => g.result?.won === true).length;
  const losses = filteredGames.filter((g) => g.result?.won === false).length;
  const hasRecord = wins > 0 || losses > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {currentProgram ? programLabel(currentProgram) : 'Schedule'}
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage your team's games and events
          </p>
          {hasRecord && (
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-bold text-gold">{wins}</span>
              <span className="text-xl font-semibold text-muted-foreground">–</span>
              <span className="text-3xl font-bold">{losses}</span>
              <span className="text-sm text-muted-foreground pl-1">overall</span>
            </div>
          )}
        </div>
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <HtmlImporter />
          </div>
        )}
      </div>

      <ScheduleList />
    </div>
  );
}
