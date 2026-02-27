import { Sport, Program, Gender, Level } from '@/types/team';

export type ProgramOption = Program & { label: string };

export type SportGroup = {
  sport: Sport;
  name: string;
  hasMultipleGenders: boolean;
  programs: ProgramOption[];
};

const SPORT_NAMES: Partial<Record<Sport, string>> = {
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
  swim_dive: 'Swim & Dive',
  basketball: 'Basketball',
  other: 'Other',
};

export function sportDisplayName(sport: Sport): string {
  return SPORT_NAMES[sport] || sport;
}

export function programKey(p: Program): string {
  return `${p.sport}_${p.gender}_${p.level}`;
}

export function programLabel(program: Program): string {
  const gender = program.gender === 'girls' ? 'Girls' : 'Boys';
  const sport = sportDisplayName(program.sport);
  const level = program.level === 'varsity' ? 'Varsity' : program.level.toUpperCase();
  return `${gender} ${sport} · ${level}`;
}

export function levelLabel(level: Level): string {
  return level === 'varsity' ? 'Varsity' : level.toUpperCase();
}

export function buildProgramOptions(): ProgramOption[] {
  const sports: Sport[] = [
    'soccer', 'baseball', 'tennis', 'football', 'badminton', 'swim',
    'cross_country', 'volleyball', 'water_polo', 'golf', 'wrestling',
    'swim_dive', 'basketball',
  ];

  const noGirls = new Set<Sport>(['football']);
  const noJV = new Set<Sport>(['baseball', 'football', 'swim', 'swim_dive']);
  const froshOnly = new Set<Sport>(['volleyball', 'basketball']);
  const noJVOrFrosh = new Set<Sport>(['wrestling', 'swim_dive']);

  const res: ProgramOption[] = [];

  for (const sport of sports) {
    const genders: Gender[] = noGirls.has(sport) ? ['boys'] : ['boys', 'girls'];
    let levels: Level[] = ['varsity'];
    if (!noJVOrFrosh.has(sport) && !noJV.has(sport)) levels = [...levels, 'jv'];
    if (!noJVOrFrosh.has(sport) && froshOnly.has(sport)) levels = [...levels, 'frosh'];

    for (const gender of genders) {
      for (const level of levels) {
        const genderLabel = gender === 'girls' ? 'Girls' : 'Boys';
        const lvl = levelLabel(level);
        res.push({
          sport, gender, level,
          label: `${genderLabel} ${sportDisplayName(sport)} (${lvl})`,
        });
      }
    }
  }

  return res;
}

export function getSportGroups(): SportGroup[] {
  const options = buildProgramOptions();
  const groups: SportGroup[] = [];
  const seen = new Set<Sport>();

  for (const opt of options) {
    if (!seen.has(opt.sport)) {
      seen.add(opt.sport);
      const sportPrograms = options.filter((o) => o.sport === opt.sport);
      const genders = new Set(sportPrograms.map((o) => o.gender));
      groups.push({
        sport: opt.sport,
        name: sportDisplayName(opt.sport),
        hasMultipleGenders: genders.size > 1,
        programs: sportPrograms,
      });
    }
  }

  return groups;
}
