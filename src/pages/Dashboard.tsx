import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTeam } from '@/context/TeamContext';
import { useAuth } from '@/context/AuthContext';
import { programLabel } from '@/lib/programUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, BarChart3, MapPin, Clock, ArrowRight, Trophy, Home } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { games, currentProgram, currentSport } = useTeam();
  const { primaryProgram } = useAuth();

  const now = new Date();

  const filteredGames = useMemo(
    () => games.filter((g) => currentSport === 'all' || g.sport === currentSport),
    [games, currentSport]
  );

  const sortedGames = useMemo(
    () => [...filteredGames].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [filteredGames]
  );

  const upcomingGame = useMemo(
    () => sortedGames.find((g) => isAfter(new Date(g.date), now) || !g.result),
    [sortedGames, now]
  );

  const recentResults = useMemo(
    () =>
      [...sortedGames]
        .filter((g) => g.result && isBefore(new Date(g.date), now))
        .reverse()
        .slice(0, 5),
    [sortedGames, now]
  );

  const wins = filteredGames.filter((g) => g.result?.won === true).length;
  const losses = filteredGames.filter((g) => g.result?.won === false).length;
  const hasRecord = wins + losses > 0;

  if (!currentProgram) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-gold/40">
          <img src="/images/webb-logo.png" alt="Webb" className="h-14 w-14 object-contain" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">No program selected</h2>
          <p className="mt-2 text-muted-foreground">Choose a sport to see your dashboard.</p>
        </div>
        <Button onClick={() => navigate('/get-started')} className="gap-2 border border-gold/40">
          Choose a program <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Current Program</p>
          <h1 className="text-3xl font-bold tracking-tight">{programLabel(currentProgram)}</h1>
        </div>
        {hasRecord && (
          <div className="flex items-center gap-3 rounded-xl border border-gold/30 bg-gold/5 px-5 py-3">
            <span className="text-3xl font-bold text-gold">{wins}</span>
            <span className="text-xl text-muted-foreground">–</span>
            <span className="text-3xl font-bold">{losses}</span>
            <span className="ml-1 text-sm text-muted-foreground">W–L</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Next Game */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Calendar className="h-4 w-4" /> Next Game
          </h2>
          {upcomingGame ? (
            <div className="space-y-3">
              <div className="text-xl font-bold">vs. {upcomingGame.opponent || 'TBD'}</div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(upcomingGame.date), 'EEE, MMM d')}
                </span>
                {upcomingGame.time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {upcomingGame.time}
                  </span>
                )}
                <Badge variant="outline" className={cn(
                  upcomingGame.venue === 'Home' ? 'border-gold/50 text-gold' : 'text-muted-foreground'
                )}>
                  {upcomingGame.venue}
                </Badge>
                {upcomingGame.isLeague && (
                  <Badge variant="outline" className="border-primary/40 text-primary">League</Badge>
                )}
              </div>
              {upcomingGame.location && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {upcomingGame.location}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming games scheduled.</p>
          )}
        </div>

        {/* Recent Results */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Trophy className="h-4 w-4" /> Recent Results
          </h2>
          {recentResults.length > 0 ? (
            <div className="space-y-2.5">
              {recentResults.map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn(
                      'shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      g.result?.won
                        ? 'bg-gold/15 text-gold border border-gold/40'
                        : 'bg-destructive/15 text-destructive border border-destructive/30'
                    )}>
                      {g.result?.won ? 'W' : 'L'}
                    </span>
                    <span className="truncate text-sm">vs. {g.opponent || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-sm">
                    {g.result?.score && (
                      <span className="font-mono text-xs text-muted-foreground">{g.result.score}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{format(new Date(g.date), 'M/d')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No results yet.</p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { to: '/schedule', icon: Calendar, label: 'Schedule' },
          { to: '/roster/players', icon: Users, label: 'Roster' },
          { to: '/stats/team', icon: BarChart3, label: 'Stats' },
        ].map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Icon className="h-5 w-5 text-muted-foreground" />
            {label}
          </Link>
        ))}
      </div>

      {/* Switch team prompt */}
      <div className="flex items-center justify-between rounded-xl border border-dashed p-4">
        <div className="text-sm text-muted-foreground">
          Want to view a different sport?
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-2">
          <Home className="h-4 w-4" /> Home
        </Button>
      </div>
    </div>
  );
}
