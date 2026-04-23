import { useAuth } from '@/context/AuthContext';
import { useTeam } from '@/context/TeamContext';
import { SeasonLoginModal, SeasonProfile } from './SeasonLoginModal';
import { getSportGroups } from '@/lib/programUtils';
import type { Sport } from '@/types/team';

// Skip the season gate on localhost (dev) — admin is auto-logged in
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const sportGroups = getSportGroups();

export function SeasonGate() {
  const { needsSeasonLogin, setSeasonProfile } = useAuth();
  const { setCurrentProgram } = useTeam();

  if (isLocalhost) return null;

  function handleComplete(profile: SeasonProfile) {
    setSeasonProfile(profile);

    // Auto-set program for members who picked a sport
    if (profile.type === 'member' && profile.sport && profile.sport !== 'other') {
      const group = sportGroups.find(g => g.sport === (profile.sport as Sport));
      if (group) {
        // Prefer varsity, fall back to first available program
        const program = group.programs.find(p => p.level === 'varsity') ?? group.programs[0];
        if (program) setCurrentProgram(program);
      }
    }
  }

  return (
    <SeasonLoginModal
      open={needsSeasonLogin}
      onComplete={handleComplete}
    />
  );
}
