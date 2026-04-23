import { useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { useAuth } from '@/context/AuthContext';
import { getSportGroups, sportDisplayName } from '@/lib/programUtils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Trophy, Calendar, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import type { Sport } from '@/types/team';

const sportGroups = getSportGroups();

export default function OtherSports() {
  const { games, getRecord } = useTeam();
  const { seasonProfile } = useAuth();
  const [expandedSport, setExpandedSport] = useState<Sport | null>(null);

  // The user's own sport — we still show it but mark it
  const mySport = seasonProfile?.type === 'member' ? seasonProfile.sport : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4 py-2">
      <div className="mb-2">
        <h1 className="text-xl font-bold">All Sports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Scores and schedules across Webb Athletics.
          <span className="ml-1 text-xs">Chat and announcements are only available for your own sport.</span>
        </p>
      </div>

      {sportGroups.map(group => {
        const isOwn = group.sport === mySport;
        const isExpanded = expandedSport === group.sport;

        // Collect all games for this sport (all programs)
        const sportGames = games
          .filter(g => g.sport === group.sport)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Quick W-L from the varsity-boys or first program available
        const repProgram = group.programs.find(p => p.level === 'varsity') ?? group.programs[0];
        const record = getRecord(repProgram);
        const hasRecord = record.wins > 0 || record.losses > 0;

        return (
          <div
            key={group.sport}
            className={cn(
              'rounded-xl border transition-all overflow-hidden',
              isExpanded ? 'border-[#D4AF37]/40' : 'border-border',
            )}
          >
            {/* Sport header row */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
              onClick={() => setExpandedSport(isExpanded ? null : group.sport)}
            >
              <div className="flex-1 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{group.name}</span>
                {isOwn && (
                  <Badge className="text-[10px] h-4 px-1.5 bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40">
                    Your Sport
                  </Badge>
                )}
                {hasRecord && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {record.wins}–{record.losses}
                  </span>
                )}
                {sportGames.length > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {sportGames.length} games
                  </span>
                )}
              </div>

              {isExpanded
                ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              }
            </button>

            {/* Expanded games list */}
            {isExpanded && (
              <div className="border-t border-border/50 divide-y divide-border/30">
                {sportGames.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground text-center">
                    No games scheduled yet.
                  </p>
                ) : (
                  sportGames.map(game => {
                    const dateStr = game.date instanceof Date
                      ? format(game.date, 'MMM d')
                      : format(new Date(game.date), 'MMM d');
                    const hasResult = !!game.result;
                    const isWin = hasResult && game.result!.won;

                    return (
                      <div key={game.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <span className="text-muted-foreground w-12 shrink-0 text-xs">{dateStr}</span>
                        <span className="flex-1 truncate">
                          {game.isLeague ? '⚑ ' : ''}{game.opponent}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {sportDisplayName(game.sport as Sport)} · {game.gender === 'boys' ? 'B' : 'G'} {game.level.toUpperCase()}
                        </span>
                        {hasResult ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] shrink-0',
                              isWin ? 'border-green-500/40 text-green-500' : 'border-destructive/40 text-destructive',
                            )}
                          >
                            {game.title ?? (isWin ? 'W' : 'L')}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground shrink-0">{game.time ?? 'TBD'}</span>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Chat locked notice for non-own sports */}
                {!isOwn && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted/20 text-xs text-muted-foreground">
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                    Chat and announcements for {group.name} are only visible to {group.name} team members.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
