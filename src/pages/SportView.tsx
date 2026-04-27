import { useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useTeam } from '@/context/TeamContext';
import { programKey, programLabel } from '@/lib/programUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameCard } from '@/components/schedule/GameCard';
import { PlayerCard } from '@/components/roster/PlayerCard';
import { CoachCard } from '@/components/roster/CoachCard';
import { SeasonRecords } from '@/components/track/SeasonRecords';
import {
  Trophy, Percent, Calendar, Users as UsersIcon,
  BarChart3, ClipboardList, UserCircle, Shield, ArrowLeft, Lock,
} from 'lucide-react';
import type { Sport, Gender, Level, Program } from '@/types/team';
import { cn } from '@/lib/utils';

type Tab = 'stats' | 'schedule' | 'roster' | 'coaches';

const VALID_SPORTS: Sport[] = [
  'soccer', 'baseball', 'tennis', 'football', 'badminton', 'swim',
  'cross_country', 'volleyball', 'water_polo', 'golf', 'wrestling',
  'swim_dive', 'basketball', 'track_field', 'other',
];
const VALID_GENDERS: Gender[] = ['boys', 'girls'];
const VALID_LEVELS: Level[] = ['varsity', 'jv', 'frosh'];

export default function SportView() {
  const params = useParams<{ sport: string; gender: string; level: string }>();
  const navigate = useNavigate();
  const { games, players, coaches, getRecord } = useTeam();
  const [tab, setTab] = useState<Tab>('stats');

  // Validate URL params
  const sport = params.sport as Sport;
  const gender = params.gender as Gender;
  const level = params.level as Level;
  const valid =
    VALID_SPORTS.includes(sport) &&
    VALID_GENDERS.includes(gender) &&
    VALID_LEVELS.includes(level);

  if (!valid) return <Navigate to="/sports" replace />;

  const program: Program = { sport, gender, level };
  const pKey = programKey(program);

  const filteredGames = useMemo(
    () => games.filter(g => g.sport === sport && g.gender === gender && g.level === level),
    [games, sport, gender, level],
  );
  const filteredPlayers = useMemo(
    () => players.filter(p => p.programKey === pKey),
    [players, pKey],
  );
  const filteredCoaches = useMemo(
    () => coaches.filter(c => c.programKey === pKey),
    [coaches, pKey],
  );

  const record = getRecord(program);
  const completedGames = filteredGames.filter(g => g.result).length;
  const winRate = completedGames > 0 ? Math.round((record.wins / completedGames) * 100) : 0;
  const upcomingGames = filteredGames.filter(g => new Date(g.date) > new Date()).length;
  const sortedGames = [...filteredGames].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const tabs: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'schedule', label: 'Schedule', icon: ClipboardList },
    { id: 'roster', label: 'Roster', icon: UserCircle },
    { id: 'coaches', label: 'Coaches', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/sports')}
          className="self-start gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All Sports
        </Button>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{programLabel(program)}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              View-only · Chat & announcements not available
            </p>
          </div>
          {(record.wins > 0 || record.losses > 0) && (
            <Badge className="text-sm px-3 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]">
              <Trophy className="h-3.5 w-3.5 mr-1.5" />
              {record.wins}-{record.losses}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === t.id
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats tab */}
      {tab === 'stats' && (
        <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Record</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{record.wins} - {record.losses}</div>
              <p className="text-xs text-muted-foreground">
                {completedGames} game{completedGames === 1 ? '' : 's'} played
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Games</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredGames.length}</div>
              <p className="text-xs text-muted-foreground">{upcomingGames} upcoming</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Roster Size</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredPlayers.length}</div>
              <p className="text-xs text-muted-foreground">{filteredCoaches.length} coaches</p>
            </CardContent>
          </Card>
        </div>

        {(sport === 'track_field' || sport === 'cross_country') && (
          <SeasonRecords athletes={filteredPlayers} />
        )}
        </div>
      )}

      {/* Schedule tab */}
      {tab === 'schedule' && (
        <div className="space-y-3">
          {sortedGames.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No games scheduled.
            </div>
          ) : (
            sortedGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))
          )}
        </div>
      )}

      {/* Roster tab */}
      {tab === 'roster' && (
        <div className="space-y-3">
          {filteredPlayers.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No players on the roster.
            </div>
          ) : (
            filteredPlayers.map(p => (
              <PlayerCard key={p.id} player={p} />
            ))
          )}
        </div>
      )}

      {/* Coaches tab */}
      {tab === 'coaches' && (
        <div className="space-y-3">
          {filteredCoaches.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No coaches listed.
            </div>
          ) : (
            filteredCoaches.map(c => (
              <CoachCard key={c.id} coach={c} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
