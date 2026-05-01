import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // Supabase processes the verification token automatically via the URL hash.
    // We just need to wait briefly for the session to be established.
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setStatus(data.session ? 'success' : 'error');
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm space-y-5 text-center">
        {status === 'loading' && (
          <>
            <h1 className="text-xl font-bold">Verifying…</h1>
            <p className="text-sm text-muted-foreground">Confirming your email address.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 ring-2 ring-green-500/40">
              <CheckCircle2 className="h-7 w-7 text-green-500" />
            </div>
            <h1 className="text-xl font-bold">Email Verified!</h1>
            <p className="text-sm text-muted-foreground">
              Your account is ready. Welcome to Webb Athletics.
            </p>
            <Button className="w-full" onClick={() => navigate('/dashboard')}>
              Continue to Dashboard
            </Button>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/40">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="text-xl font-bold">Verification Failed</h1>
            <p className="text-sm text-muted-foreground">
              The link may be invalid or expired. Try signing in or request a new link.
            </p>
            <Button className="w-full" onClick={() => navigate('/login')}>
              Go to Sign In
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
