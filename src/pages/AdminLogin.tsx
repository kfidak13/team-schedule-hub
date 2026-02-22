import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAdmin, loginAdmin, logoutAdmin } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const ok = loginAdmin(pin);
    if (ok) {
      navigate(-1);
    } else {
      setError(true);
      setPin('');
    }
  }

  if (isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-sm rounded-xl border bg-card p-8 text-center shadow-sm space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 ring-2 ring-gold/50">
            <ShieldCheck className="h-7 w-7 text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Admin Mode Active</h1>
            <p className="mt-1 text-sm text-muted-foreground">You have full creator access.</p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => { logoutAdmin(); navigate('/'); }}
          >
            Sign out of Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-gold/40">
            <Lock className="h-7 w-7 text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Creator Access</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your admin PIN to unlock import and editing features.
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="password"
            placeholder="Admin PIN"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            autoFocus
            className={error ? 'border-destructive ring-destructive/20' : ''}
          />
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Incorrect PIN. Try again.
            </div>
          )}
          <Button type="submit" className="w-full border border-gold/40" disabled={!pin}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Sign in as Admin
          </Button>
        </form>

        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
