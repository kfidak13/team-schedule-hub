import { useTeam } from '@/context/TeamContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Clock } from 'lucide-react';
import { format, isAfter, isBefore, addDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

export function UpcomingGames() {
  const { games, currentSport } = useTeam();
  
  const today = startOfDay(new Date());
  const nextWeek = addDays(today, 7);
  
  const upcomingGames = games
    .filter(game => {
      const gameDate = startOfDay(new Date(game.date));
      const isUpcoming = isAfter(gameDate, today) || gameDate.getTime() === today.getTime();
      const isWithinWeek = isBefore(gameDate, nextWeek) || gameDate.getTime() === nextWeek.getTime();
      const matchesSport = currentSport === 'all' || game.sport === currentSport;
      return isUpcoming && isWithinWeek && matchesSport;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
  
  if (upcomingGames.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
            Upcoming Games
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No upcoming games in the next 7 days.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5 text-primary" />
          Upcoming Games
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingGames.map((game) => (
          <div
            key={game.id}
            className="flex flex-col gap-2 rounded-lg border bg-accent/30 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {game.title || (game.opponent ? `vs. ${game.opponent}` : 'Game')}
                  </span>
                  {game.isLeague && (
                    <Badge variant="secondary" className="text-xs">League</Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {format(new Date(game.date), 'EEE, MMM d')}
                  </span>
                  {game.time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {game.time}
                    </span>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0",
                  game.venue === 'Home' && "border-primary/50 text-primary",
                  game.venue === 'Away' && "border-destructive/50 text-destructive",
                  game.venue === 'Neutral' && "border-muted-foreground/50 text-muted-foreground"
                )}
              >
                {game.venue}
              </Badge>
            </div>
            {game.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {game.location}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
