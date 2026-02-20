import { useTeam } from '@/context/TeamContext';
import { SportSelector } from '@/components/dashboard/SportSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, TrendingUp, Calendar, Users, Percent } from 'lucide-react';

export default function TeamStats() {
  const { games, players, coaches, currentSport, getRecord, importedStats } = useTeam();

  const filteredGames = currentSport === 'all' 
    ? games 
    : games.filter(g => g.sport === currentSport);

  const record = currentSport === 'all' 
    ? getRecord() 
    : getRecord(currentSport as any);

  const statsForSport = currentSport === 'all' ? undefined : importedStats[currentSport];
  const overallImported = statsForSport?.overall;

  const totalGames = filteredGames.length;
  const completedGames = filteredGames.filter(g => g.result).length;
  const computedWinRate = completedGames > 0 ? Math.round((record.wins / completedGames) * 100) : 0;
  const importedWinRate = overallImported ? Math.round(overallImported.pct) : undefined;
  const winRate = importedWinRate ?? computedWinRate;

  const homeGames = filteredGames.filter(g => g.venue === 'Home').length;
  const awayGames = filteredGames.filter(g => g.venue === 'Away').length;
  const leagueGames = filteredGames.filter(g => g.isLeague).length;

  const upcomingGames = filteredGames.filter(g => new Date(g.date) > new Date()).length;
  const pastGames = filteredGames.filter(g => new Date(g.date) <= new Date()).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Stats</h1>
          <p className="text-muted-foreground">
            Performance metrics and analytics
          </p>
        </div>
        <SportSelector />
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Record</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallImported ? `${overallImported.wins} - ${overallImported.losses}` : `${record.wins} - ${record.losses}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {overallImported ? 'Imported team record' : `${completedGames} games played`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate}%</div>
            <Progress value={winRate} className="mt-2" />
            {overallImported && (
              <p className="mt-2 text-xs text-muted-foreground">
                Imported from team page
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGames}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingGames} upcoming, {pastGames} past
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{players.length}</div>
            <p className="text-xs text-muted-foreground">
              {coaches.length} coaches
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Game Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statsForSport?.league && statsForSport?.nonLeague && (
              <div className="rounded-lg border bg-card p-3">
                <div className="grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <div className="text-muted-foreground">League</div>
                    <div className="font-medium">
                      {statsForSport.league.wins}-{statsForSport.league.losses}-{statsForSport.league.ties} ({statsForSport.league.pct}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Non-League</div>
                    <div className="font-medium">
                      {statsForSport.nonLeague.wins}-{statsForSport.nonLeague.losses}-{statsForSport.nonLeague.ties} ({statsForSport.nonLeague.pct}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Overall</div>
                    <div className="font-medium">
                      {statsForSport.overall?.wins ?? '-'}-{statsForSport.overall?.losses ?? '-'}-{statsForSport.overall?.ties ?? '-'} ({statsForSport.overall?.pct ?? '-'}%)
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Home Games</span>
                <span className="font-medium">{homeGames}</span>
              </div>
              <Progress value={totalGames > 0 ? (homeGames / totalGames) * 100 : 0} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Away Games</span>
                <span className="font-medium">{awayGames}</span>
              </div>
              <Progress value={totalGames > 0 ? (awayGames / totalGames) * 100 : 0} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">League Games</span>
                <span className="font-medium">{leagueGames}</span>
              </div>
              <Progress value={totalGames > 0 ? (leagueGames / totalGames) * 100 : 0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedGames === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No completed games yet
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGames
                  .filter(g => g.result)
                  .slice(-5)
                  .reverse()
                  .map((game, idx) => (
                    <div key={game.id} className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${game.result?.won ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-muted-foreground w-24">
                        {new Date(game.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-sm flex-1 truncate">{game.opponent || 'Unknown'}</span>
                      <span className={`text-sm font-medium ${game.result?.won ? 'text-green-600' : 'text-red-600'}`}>
                        {game.result?.won ? 'W' : 'L'} {game.result?.score}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
