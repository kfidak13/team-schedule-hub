import { useTeam } from '@/context/TeamContext';
import { programKey } from '@/lib/programUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Calendar, Users, Clock } from 'lucide-react';
import { differenceInDays, startOfDay, isAfter } from 'date-fns';

export function QuickStats() {
  const { games, players, coaches, currentProgram, getRecord } = useTeam();

  const pKey = currentProgram ? programKey(currentProgram) : undefined;
  const filteredPlayers = pKey ? players.filter(p => p.programKey === pKey) : players;
  const filteredCoaches = pKey ? coaches.filter(c => c.programKey === pKey) : coaches;

  const record = getRecord(currentProgram ?? undefined);
  
  // Find next game
  const today = startOfDay(new Date());
  const filteredGames = currentProgram
    ? games.filter(g => g.sport === currentProgram.sport && g.gender === currentProgram.gender && g.level === currentProgram.level)
    : games;
  
  const nextGame = filteredGames
    .filter(g => isAfter(new Date(g.date), today) || startOfDay(new Date(g.date)).getTime() === today.getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  
  const daysUntilNext = nextGame 
    ? differenceInDays(startOfDay(new Date(nextGame.date)), today)
    : null;
  
  const stats = [
    {
      label: 'Season Record',
      value: record.wins + record.losses > 0 
        ? `${record.wins} - ${record.losses}`
        : 'No games yet',
      icon: Trophy,
      color: 'text-yellow-500',
    },
    {
      label: 'Next Game',
      value: daysUntilNext !== null 
        ? daysUntilNext === 0 
          ? 'Today!' 
          : `${daysUntilNext} day${daysUntilNext !== 1 ? 's' : ''}`
        : 'No games scheduled',
      icon: Clock,
      color: 'text-blue-500',
    },
    {
      label: 'Total Games',
      value: filteredGames.length.toString(),
      icon: Calendar,
      color: 'text-green-500',
    },
    {
      label: 'Team Size',
      value: `${filteredPlayers.length} players, ${filteredCoaches.length} coaches`,
      icon: Users,
      color: 'text-purple-500',
    },
  ];
  
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-list">
      {stats.map((stat) => (
        <Card key={stat.label} className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
