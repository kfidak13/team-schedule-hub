import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  ShieldCheck, BarChart2, Users, GraduationCap, LogOut, AlertCircle, Lock, User,
} from 'lucide-react';

type LoginStep = 'pick-role' | 'enter-code' | 'enter-name' | 'signed-in';

const ROLE_CARDS = [
  {
    id: 'admin' as const,
    label: 'Athletic Director',
    description: 'Full management access',
    icon: ShieldCheck,
    color: 'border-gold/50 bg-gold/10 hover:bg-gold/20',
    iconColor: 'text-gold',
    needsCode: true,
  },
  {
    id: 'stats_admin' as const,
    label: 'Stats Admin',
    description: 'Import & manage data',
    icon: BarChart2,
    color: 'border-blue-400/50 bg-blue-400/10 hover:bg-blue-400/20',
    iconColor: 'text-blue-400',
    needsCode: true,
  },
  {
    id: 'coach' as const,
    label: 'Coach',
    description: 'Post announcements, manage your team',
    icon: Users,
    color: 'border-green-400/50 bg-green-400/10 hover:bg-green-400/20',
    iconColor: 'text-green-400',
    needsCode: true,
  },
  {
    id: 'student' as const,
    label: 'Student / Player',
    description: 'View your team, read announcements',
    icon: GraduationCap,
    color: 'border-purple-400/50 bg-purple-400/10 hover:bg-purple-400/20',
    iconColor: 'text-purple-400',
    needsCode: false,
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, loginAsStudent, logout } = useAuth();
  const [step, setStep] = useState<LoginStep>('pick-role');
  const [selectedRole, setSelectedRole] = useState<typeof ROLE_CARDS[0] | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Already signed in
  if (isAuthenticated) {
    const card = ROLE_CARDS.find(r => r.id === user.role);
    const Icon = card?.icon ?? ShieldCheck;
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border bg-card p-8 text-center shadow-sm space-y-5">
          <div className={cn(
            'mx-auto flex h-14 w-14 items-center justify-center rounded-full ring-2',
            card?.color ?? 'bg-gold/10 ring-gold/40',
          )}>
            <Icon className={cn('h-7 w-7', card?.iconColor ?? 'text-gold')} />
          </div>
          <div>
            <h1 className="text-xl font-bold">{user.displayName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{card?.label ?? 'Signed in'}</p>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={() => { logout(); setStep('pick-role'); }}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Step 1 — pick a role
  if (step === 'pick-role') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-gold/40 mb-3">
              <Lock className="h-7 w-7 text-gold" />
            </div>
            <h1 className="text-2xl font-bold">Welcome to Webb Athletics</h1>
            <p className="text-sm text-muted-foreground">Choose your role to continue</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {ROLE_CARDS.map(card => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => {
                    setSelectedRole(card);
                    setError('');
                    setStep(card.needsCode ? 'enter-code' : 'enter-name');
                  }}
                  className={cn(
                    'flex items-center gap-4 rounded-xl border p-4 text-left transition-all',
                    card.color,
                  )}
                >
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background/50')}>
                    <Icon className={cn('h-5 w-5', card.iconColor)} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{card.label}</div>
                    <div className="text-xs text-muted-foreground">{card.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Step 2a — enter access code (AD, Stats, Coach)
  if (step === 'enter-code' && selectedRole) {
    const Icon = selectedRole.icon;
    function handleCodeSubmit(e: React.FormEvent) {
      e.preventDefault();
      const result = login(code);
      if (result) {
        navigate('/dashboard');
      } else {
        setError('Incorrect access code. Please try again.');
        setCode('');
      }
    }
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className={cn('mx-auto flex h-14 w-14 items-center justify-center rounded-full ring-2', selectedRole.color)}>
              <Icon className={cn('h-7 w-7', selectedRole.iconColor)} />
            </div>
            <h1 className="text-xl font-bold">{selectedRole.label}</h1>
            <p className="text-sm text-muted-foreground">Enter your access code to continue</p>
          </div>

          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="code">Access Code</Label>
              <Input
                id="code"
                type="password"
                placeholder="Enter your code…"
                value={code}
                onChange={e => { setCode(e.target.value); setError(''); }}
                autoFocus
                className={error ? 'border-destructive' : ''}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={!code.trim()}>
              Sign In
            </Button>
          </form>

          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setStep('pick-role')}>
            ← Back
          </Button>
        </div>
      </div>
    );
  }

  // Step 2b — enter name only (Student)
  if (step === 'enter-name') {
    function handleNameSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!name.trim()) { setError('Please enter your name.'); return; }
      loginAsStudent(name.trim());
      navigate('/dashboard');
    }
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-purple-400/50 bg-purple-400/10 ring-2 ring-purple-400/30">
              <User className="h-7 w-7 text-purple-400" />
            </div>
            <h1 className="text-xl font-bold">Student / Player</h1>
            <p className="text-sm text-muted-foreground">Enter your name to access your team</p>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="student-name">Your Name</Label>
              <Input
                id="student-name"
                placeholder="First Last"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                autoFocus
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              No password needed. Your name will be visible in team chat.
            </p>
            <Button type="submit" className="w-full" disabled={!name.trim()}>
              <GraduationCap className="mr-2 h-4 w-4" />
              Join as Student
            </Button>
          </form>

          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setStep('pick-role')}>
            ← Back
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
