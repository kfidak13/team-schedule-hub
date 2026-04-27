import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '@/context/TeamContext';
import { useAuth } from '@/context/AuthContext';
import { getSportGroups, levelLabel } from '@/lib/programUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trophy, Calendar, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import type { Sport, Program } from '@/types/team';

const sportGroups = getSportGroups();

export default function OtherSports() {
  const navigate = useNavigate();
  const { games, getRecord } = useTeam();
  const { seasonProfile } = useAuth();
  const [expandedSport, setExpandedSport] = useState<Sport | null>(null);

  // The user's own sport — we still show it but mark it
  const mySport = seasonProfile?.type === 'member' ? seasonProfile.sport : null;

  function openProgram(p: Program) {
    navigate(`/sports/${p.sport}/${p.gender}/${p.level}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3 py-2">
      <div className="mb-2">
        <h1 className="text-xl font-bold">All Sports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Browse other Webb teams. Tap a sport to see stats, schedule, roster, and coaches.
        </p>
      </div>

      {sportGroups.map(group => {
        const isOwn = group.sport === mySport;
        const isExpanded = expandedSport === group.sport;

        // Quick W-L from varsity (preferred) or first program
        const repProgram = group.programs.find(p => p.level === 'varsity') ?? group.programs[0];
        const record = getRecord(repProgram);
        const hasRecord = record.wins > 0 || record.losses > 0;
        const totalGames = games.filter(g => g.sport === group.sport).length;

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
                {totalGames > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {totalGames} games
                  </span>
                )}
              </div>

              {isExpanded
                ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              }
            </button>

            {/* Expanded program picker */}
            {isExpanded && (
              <div className="border-t border-border/50 p-4 space-y-3 bg-muted/10">
                {group.hasMultipleGenders ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(['boys', 'girls'] as const).map(gender => {
                      const progs = group.programs.filter(p => p.gender === gender);
                      if (!progs.length) return null;
                      return (
                        <div key={gender}>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {gender === 'boys' ? 'Boys' : 'Girls'}
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {progs.map(p => (
                              <Button
                                key={`${p.gender}-${p.level}`}
                                variant="outline"
                                size="sm"
                                onClick={() => openProgram(p)}
                                className="justify-between border-white/15 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/10"
                              >
                                <span>{levelLabel(p.level)}</span>
                                <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {group.programs.map(p => (
                      <Button
                        key={`${p.gender}-${p.level}`}
                        variant="outline"
                        size="sm"
                        onClick={() => openProgram(p)}
                        className="border-white/15 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/10"
                      >
                        {levelLabel(p.level)}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 opacity-60" />
                      </Button>
                    ))}
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
