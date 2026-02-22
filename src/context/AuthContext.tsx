import { createContext, useContext, useState, ReactNode } from 'react';
import type { Program } from '@/types/team';

// ── Change this to your preferred admin PIN ──────────────────────────────────
const ADMIN_PIN = 'gauls2026';
// ─────────────────────────────────────────────────────────────────────────────

type Role = 'admin' | 'viewer';

interface AuthContextType {
  role: Role;
  isAdmin: boolean;
  primaryProgram: Program | null;
  setPrimaryProgram: (p: Program) => void;
  loginAdmin: (pin: string) => boolean;
  logoutAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(() => {
    return (localStorage.getItem('auth_role') as Role) || 'viewer';
  });

  const [primaryProgram, setPrimaryProgramState] = useState<Program | null>(() => {
    const saved = localStorage.getItem('primary_program');
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });

  const isAdmin = role === 'admin';

  const setPrimaryProgram = (p: Program) => {
    setPrimaryProgramState(p);
    localStorage.setItem('primary_program', JSON.stringify(p));
  };

  const loginAdmin = (pin: string): boolean => {
    if (pin === ADMIN_PIN) {
      setRole('admin');
      localStorage.setItem('auth_role', 'admin');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setRole('viewer');
    localStorage.removeItem('auth_role');
  };

  return (
    <AuthContext.Provider value={{ role, isAdmin, primaryProgram, setPrimaryProgram, loginAdmin, logoutAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
