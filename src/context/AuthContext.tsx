import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getCurrentSeason } from '@/lib/season';
import type { SeasonProfile } from '@/components/auth/SeasonLoginModal';
import type { Program } from '@/types/team';

// ─────────────────────────────────────────────────────────────────────────────
// Roles
// ─────────────────────────────────────────────────────────────────────────────
export type AppRole = 'admin' | 'stats_admin' | 'coach' | 'student' | 'viewer';

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  role: AppRole;
  sport?: string | null;
  gender?: 'boys' | 'girls' | null;
  level?: string | null;
  createdAt: string;
}

export interface AuthUser {
  role: AppRole;
  displayName: string;
  email?: string;
  sport?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
interface AuthContextType {
  user: AuthUser;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;

  isAdmin: boolean;
  isStatsAdmin: boolean;
  isCoach: boolean;
  isStudent: boolean;
  isAuthenticated: boolean;

  primaryProgram: Program | null;
  setPrimaryProgram: (p: Program) => void;

  // Auth actions
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;

  // Admin actions
  updateUserRole: (userId: string, role: AppRole) => Promise<{ error?: string }>;
  fetchAllProfiles: () => Promise<Profile[]>;
  deleteProfile: (userId: string) => Promise<{ error?: string }>;

  // Season gate (still used to capture sport+gender for unauthenticated viewers)
  seasonProfile: SeasonProfile | null;
  setSeasonProfile: (p: SeasonProfile) => void;
  needsSeasonLogin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Localhost dev mode — auto-admin so you don't have to log in while building
// ─────────────────────────────────────────────────────────────────────────────
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const DEFAULT_USER: AuthUser = { role: 'viewer', displayName: 'Guest' };
const DEV_USER: AuthUser = { role: 'admin', displayName: 'Athletic Director (dev)' };

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    email: row.email as string,
    displayName: (row.display_name as string) ?? '',
    role: row.role as AppRole,
    sport: (row.sport as string) ?? null,
    gender: (row.gender as 'boys' | 'girls' | null) ?? null,
    level: (row.level as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function loadSeasonProfile(): SeasonProfile | null {
  try {
    const s = localStorage.getItem('season_profile');
    if (!s) return null;
    const p: SeasonProfile = JSON.parse(s);
    if (p.seasonKey !== getCurrentSeason().key) return null;
    return p;
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [seasonProfile, setSeasonProfileState] = useState<SeasonProfile | null>(loadSeasonProfile);

  const [primaryProgram, setPrimaryProgramState] = useState<Program | null>(() => {
    const saved = localStorage.getItem('primary_program');
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });

  const setPrimaryProgram = (p: Program) => {
    setPrimaryProgramState(p);
    localStorage.setItem('primary_program', JSON.stringify(p));
  };

  // ── Subscribe to auth state changes
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) {
      setProfile(null);
      return;
    }
    setProfile(rowToProfile(data));
  }

  async function refreshProfile() {
    if (session?.user.id) await loadProfile(session.user.id);
  }

  // ── Auth actions
  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return {};
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return {};
  };

  // ── Admin actions
  const updateUserRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    if (error) return { error: error.message };
    return {};
  };

  const fetchAllProfiles = async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(rowToProfile);
  };

  const deleteProfile = async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) return { error: error.message };
    return {};
  };

  // ── Season profile
  const setSeasonProfile = (p: SeasonProfile) => {
    setSeasonProfileState(p);
    localStorage.setItem('season_profile', JSON.stringify(p));
  };

  // ── Derived user
  const devOverride = isLocalhost && !session;
  const user: AuthUser = devOverride
    ? DEV_USER
    : profile
    ? {
        role: profile.role,
        displayName: profile.displayName || profile.email.split('@')[0],
        email: profile.email,
        sport: profile.sport ?? undefined,
      }
    : DEFAULT_USER;

  // Authenticated viewers don't need the season-gate modal (they have a profile)
  const needsSeasonLogin = !session && !devOverride && seasonProfile === null;

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      isAdmin:        user.role === 'admin',
      isStatsAdmin:   user.role === 'stats_admin',
      isCoach:        user.role === 'coach',
      isStudent:      user.role === 'student',
      isAuthenticated: !!session || devOverride,
      primaryProgram,
      setPrimaryProgram,
      signUp,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
      refreshProfile,
      updateUserRole,
      fetchAllProfiles,
      deleteProfile,
      seasonProfile,
      setSeasonProfile,
      needsSeasonLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
