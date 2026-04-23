import { createContext, useContext, useState, ReactNode } from 'react';
import type { Program } from '@/types/team';

// ── Role credentials — change PINs here ──────────────────────────────────────
const CREDENTIALS: Record<string, AppRole> = {
  'gauls2026':  'admin',        // Athletic Director
  'statswebb':  'stats_admin',  // Stats Admin (you)
  'COACHWEBB':  'coach',        // Shared coach access code
};
// Students have no code — they self-identify with a name
// ─────────────────────────────────────────────────────────────────────────────

export type AppRole = 'admin' | 'stats_admin' | 'coach' | 'student' | 'viewer';

export interface AuthUser {
  role: AppRole;
  displayName: string;   // "Athletic Director", coach's name, student's name
  sport?: string;        // coaches & students: which sport they selected
}

interface AuthContextType {
  user: AuthUser;
  isAdmin: boolean;        // AD only
  isStatsAdmin: boolean;
  isCoach: boolean;
  isStudent: boolean;
  isAuthenticated: boolean; // any role except viewer
  primaryProgram: Program | null;
  setPrimaryProgram: (p: Program) => void;
  login: (pin: string) => AppRole | false;
  loginAsStudent: (name: string) => void;
  logout: () => void;
}

const DEFAULT_USER: AuthUser = { role: 'viewer', displayName: 'Guest' };

const AuthContext = createContext<AuthContextType | null>(null);

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

function loadUser(): AuthUser {
  if (isLocalhost) return { role: 'admin', displayName: 'Athletic Director' };
  try {
    const s = localStorage.getItem('auth_user');
    return s ? JSON.parse(s) : DEFAULT_USER;
  } catch { return DEFAULT_USER; }
}

function saveUser(u: AuthUser) {
  localStorage.setItem('auth_user', JSON.stringify(u));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(loadUser);

  const [primaryProgram, setPrimaryProgramState] = useState<Program | null>(() => {
    const saved = localStorage.getItem('primary_program');
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });

  const setPrimaryProgram = (p: Program) => {
    setPrimaryProgramState(p);
    localStorage.setItem('primary_program', JSON.stringify(p));
  };

  // Pin/code login — returns the role on success, false on bad pin
  const login = (pin: string): AppRole | false => {
    const role = CREDENTIALS[pin.trim()];
    if (!role) return false;
    const displayName =
      role === 'admin'       ? 'Athletic Director' :
      role === 'stats_admin' ? 'Stats Admin' :
      role === 'coach'       ? 'Coach' : 'Guest';
    const u: AuthUser = { role, displayName };
    setUser(u);
    saveUser(u);
    return role;
  };

  // Students just enter a name — no PIN required
  const loginAsStudent = (name: string) => {
    const u: AuthUser = { role: 'student', displayName: name.trim() };
    setUser(u);
    saveUser(u);
  };

  const logout = () => {
    setUser(DEFAULT_USER);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin:        user.role === 'admin',
      isStatsAdmin:   user.role === 'stats_admin',
      isCoach:        user.role === 'coach',
      isStudent:      user.role === 'student',
      isAuthenticated: user.role !== 'viewer',
      primaryProgram,
      setPrimaryProgram,
      login,
      loginAsStudent,
      logout,
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
