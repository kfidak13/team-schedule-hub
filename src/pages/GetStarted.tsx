import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ElementType } from 'react';
import { useTeam } from '@/context/TeamContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Trophy, Volleyball, CircleDot, Dumbbell, CalendarDays } from 'lucide-react';
import type { Gender, Level, Program, Sport } from '@/types/team';

const sportIcons: Partial<Record<Sport, ElementType>> = {
  soccer: CircleDot,
  baseball: Trophy,
  tennis: CircleDot,
  football: CalendarDays,
  badminton: CircleDot,
  swim: Trophy,
  cross_country: Trophy,
  volleyball: Volleyball,
  water_polo: Trophy,
  golf: Trophy,
  wrestling: Dumbbell,
  swim_dive: Trophy,
  basketball: Dumbbell,
  other: Trophy,
};

const sportDisplayNames: Partial<Record<Sport, string>> = {
  soccer: 'Soccer',
  baseball: 'Baseball',
  tennis: 'Tennis',
  football: 'Football',
  badminton: 'Badminton',
  swim: 'Swim',
  cross_country: 'Cross Country',
  volleyball: 'Volleyball',
  water_polo: 'Water Polo',
  golf: 'Golf',
  wrestling: 'Wrestling',
  swim_dive: 'Swim and Dive',
  basketball: 'Basketball',
};

type ProgramOption = Program & { label: string };

function buildProgramOptions(): ProgramOption[] {
  const sports: Sport[] = [
    'soccer',
    'baseball',
    'tennis',
    'football',
    'badminton',
    'swim',
    'cross_country',
    'volleyball',
    'water_polo',
    'golf',
    'wrestling',
    'swim_dive',
    'basketball',
  ];

  const noGirls = new Set<Sport>(['football']);
  const noJV = new Set<Sport>(['baseball', 'football', 'swim', 'swim_dive']);
  const froshOnly = new Set<Sport>(['volleyball', 'basketball']);
  const noJVOrFrosh = new Set<Sport>(['wrestling', 'swim_dive']);

  const res: ProgramOption[] = [];

  for (const sport of sports) {
    const genders: Gender[] = noGirls.has(sport) ? ['boys'] : ['boys', 'girls'];

    let levels: Level[] = ['varsity'];
    if (!noJVOrFrosh.has(sport) && !noJV.has(sport)) {
      levels = [...levels, 'jv'];
    }
    if (!noJVOrFrosh.has(sport) && froshOnly.has(sport)) {
      levels = [...levels, 'frosh'];
    }

    for (const gender of genders) {
      for (const level of levels) {
        const baseName = sportDisplayNames[sport] || 'Sport';
        const genderLabel = gender === 'girls' ? 'Girls' : 'Boys';
        const levelLabel = level === 'varsity' ? 'Varsity' : level.toUpperCase();
        res.push({
          sport,
          gender,
          level,
          label: `${genderLabel} ${baseName} (${levelLabel})`,
        });
      }
    }
  }

  return res;
}

export default function GetStarted() {
  const navigate = useNavigate();
  const { setCurrentProgram } = useTeam();
  const [selected, setSelected] = useState<string>('');

  const programOptions = useMemo(() => buildProgramOptions(), []);

  const onContinue = () => {
    const option = programOptions.find((p) => p.label === selected);
    if (!option) return;
    const program: Program = { sport: option.sport, gender: option.gender, level: option.level };
    setCurrentProgram(program);
    navigate('/schedule');
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-xl rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-border">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Choose your program</h1>
            <p className="text-sm text-muted-foreground">Pick a sport, team, and level to view the schedule.</p>
          </div>
        </div>

        <div className="space-y-3">
          <Select value={selected} onValueChange={(v) => setSelected(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent>
              {programOptions.map((p) => {
                const Icon = sportIcons[p.sport] || Trophy;
                return (
                  <SelectItem key={p.label} value={p.label}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {p.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Button className="w-full justify-between" onClick={onContinue} disabled={!selected}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
