import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ElementType } from 'react';
import { useTeam } from '@/context/TeamContext';
import { useAuth } from '@/context/AuthContext';
import { getSportGroups } from '@/lib/programUtils';
import { levelLabel } from '@/lib/programUtils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CircleDot, Trophy, Volleyball, Dumbbell, Waves, Wind,
  PersonStanding, Zap, Target, ChevronRight, X,
} from 'lucide-react';
import type { Program, Sport } from '@/types/team';

const sportIcons: Partial<Record<Sport, ElementType>> = {
  soccer:        CircleDot,
  baseball:      Trophy,
  tennis:        Target,
  football:      Zap,
  badminton:     Wind,
  swim:          Waves,
  cross_country: PersonStanding,
  volleyball:    Volleyball,
  water_polo:    Waves,
  golf:          Target,
  wrestling:     Dumbbell,
  swim_dive:     Waves,
  basketball:    CircleDot,
};

const sportGroups = getSportGroups();

export default function GetStarted() {
  const navigate = useNavigate();
  const { setCurrentProgram } = useTeam();
  const { setPrimaryProgram } = useAuth();
  const [expandedSport, setExpandedSport] = useState<Sport | null>(null);

  function selectProgram(program: Program) {
    setCurrentProgram(program);
    setPrimaryProgram(program);
    navigate('/dashboard');
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-gold/40 p-2">
          <img src="/images/webb-logo.png" alt="Webb" className="h-full w-full object-contain" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Choose Your Sport</h1>
        <p className="mt-2 text-muted-foreground">Select a program to view its schedule, roster, and stats.</p>
      </div>

      {/* Sport card grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {sportGroups.map((group) => {
          const Icon = sportIcons[group.sport] || Trophy;
          const isExpanded = expandedSport === group.sport;

          return (
            <button
              key={group.sport}
              onClick={() => setExpandedSport(isExpanded ? null : group.sport)}
              className={cn(
                'flex flex-col items-center gap-3 rounded-xl border p-5 text-center transition-all duration-200',
                isExpanded
                  ? 'border-gold/60 bg-gold/10 text-gold shadow-md shadow-gold/10'
                  : 'border-border bg-card hover:border-gold/40 hover:bg-gold/5 hover:shadow-sm'
              )}
            >
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                isExpanded ? 'bg-gold/20' : 'bg-muted'
              )}>
                <Icon className={cn('h-6 w-6', isExpanded ? 'text-gold' : 'text-muted-foreground')} />
              </div>
              <span className="text-sm font-semibold leading-tight">{group.name}</span>
              <ChevronRight className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isExpanded ? 'rotate-90 text-gold' : 'text-muted-foreground'
              )} />
            </button>
          );
        })}
      </div>

      {/* Level picker panel — full width, shown below the grid */}
      {expandedSport && (() => {
        const group = sportGroups.find((g) => g.sport === expandedSport);
        if (!group) return null;
        return (
          <div className="rounded-xl border border-gold/30 bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{group.name} — Select Level</h3>
              <button
                onClick={() => setExpandedSport(null)}
                className="rounded-md p-1.5 hover:bg-accent"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {group.hasMultipleGenders ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {(['boys', 'girls'] as const).map((gender) => {
                  const genderPrograms = group.programs.filter((p) => p.gender === gender);
                  if (!genderPrograms.length) return null;
                  return (
                    <div key={gender}>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {gender === 'boys' ? 'Boys' : 'Girls'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {genderPrograms.map((p) => (
                          <Button
                            key={p.label}
                            variant="outline"
                            size="sm"
                            onClick={() => selectProgram(p)}
                            className="border-gold/30 hover:border-gold/70 hover:bg-gold/10 hover:text-gold"
                          >
                            {levelLabel(p.level)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {group.programs.map((p) => (
                  <Button
                    key={p.label}
                    variant="outline"
                    size="sm"
                    onClick={() => selectProgram(p)}
                    className="border-gold/30 hover:border-gold/70 hover:bg-gold/10 hover:text-gold"
                  >
                    {levelLabel(p.level)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
