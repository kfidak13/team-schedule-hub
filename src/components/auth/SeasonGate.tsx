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

    // Auto-set program for members who picked a sport — only if unambiguous.
    // For sports with both boys AND girls varsity (e.g. track_field), we don't know
    // which one the user belongs to, so leave currentProgram unset and let them
    // pick explicitly from the sidebar / program switcher.
    if (profile.type === 'member' && profile.sport && profile.sport !== 'other') {
      const group = sportGroups.find(g => g.sport === (profile.sport as Sport));
      if (group) {
        if (group.hasMultipleGenders && profile.gender) {
          // Multi-gender sport with known gender — pick that gender's varsity
          const program =
            group.programs.find(p => p.level === 'varsity' && p.gender === profile.gender) ??
            group.programs.find(p => p.gender === profile.gender);
          if (program) setCurrentProgram(program);
        } else if (!group.hasMultipleGenders) {
          const varsity = group.programs.filter(p => p.level === 'varsity');
          if (varsity.length === 1) {
            setCurrentProgram(varsity[0]);
          } else if (varsity.length === 0 && group.programs.length === 1) {
            setCurrentProgram(group.programs[0]);
          }
        }
        // Multi-gender without gender in profile: leave unset so user can pick.
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
