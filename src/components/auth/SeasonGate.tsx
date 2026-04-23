import { useAuth } from '@/context/AuthContext';
import { SeasonLoginModal } from './SeasonLoginModal';

// Skip the season gate on localhost (dev) — admin is auto-logged in
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export function SeasonGate() {
  const { needsSeasonLogin, setSeasonProfile } = useAuth();

  if (isLocalhost) return null;

  return (
    <SeasonLoginModal
      open={needsSeasonLogin}
      onComplete={setSeasonProfile}
    />
  );
}
