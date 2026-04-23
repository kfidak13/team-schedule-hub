import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Eye, GraduationCap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentSeason, SEASON_SPORTS, GRADES } from '@/lib/season';
import { sportDisplayName } from '@/lib/programUtils';
import type { Sport } from '@/types/team';

export interface SeasonProfile {
  type: 'member' | 'viewer';
  name?: string;
  email?: string;
  grade?: string;
  sport?: string;
  seasonKey: string;
}

interface Props {
  open: boolean;
  onComplete: (profile: SeasonProfile) => void;
}

type Step = 'choose' | 'member-form' | 'viewer-confirm';

export function SeasonLoginModal({ open, onComplete }: Props) {
  const season = getCurrentSeason();
  const [step, setStep] = useState<Step>('choose');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [grade, setGrade] = useState('');
  const [sport, setSport] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const seasonSports = SEASON_SPORTS[season.name] as Sport[];

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!email.trim()) {
      e.email = 'Email is required.';
    } else if (!email.trim().toLowerCase().endsWith('@webb.org')) {
      e.email = 'Email must end in @webb.org.';
    }
    if (!grade) e.grade = 'Select your grade.';
    if (!sport) e.sport = 'Select your sport.';
    return e;
  }

  function handleMemberSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onComplete({
      type: 'member',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      grade,
      sport,
      seasonKey: season.key,
    });
  }

  function handleViewerConfirm() {
    onComplete({ type: 'viewer', seasonKey: season.key });
  }

  return (
    <Dialog open={open} modal>
      {/* No DialogTitle visible but required for a11y — hidden */}
      <DialogContent
        className="max-w-md w-full p-0 overflow-hidden gap-0 [&>button:last-child]:hidden"
        // Prevent closing by clicking outside or pressing Escape — login is required
        onInteractOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        {/* Header banner */}
        <div className="bg-[#002855] px-6 pt-6 pb-5 text-center">
          <img
            src="/icons/icon-192.png"
            alt="Webb"
            className="mx-auto h-12 w-12 rounded-lg object-cover mb-3"
          />
          <h2 className="text-lg font-bold text-white leading-tight">Webb Sports Hub</h2>
          <p className="text-sm text-[#D4AF37] font-medium mt-0.5">{season.label}</p>
        </div>

        <div className="px-6 py-5">
          {/* Step 1 — choose path */}
          {step === 'choose' && (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Welcome! How would you like to continue this season?
              </p>

              <button
                onClick={() => setStep('member-form')}
                className="w-full flex items-center gap-4 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-4 text-left hover:bg-[#D4AF37]/20 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#002855]/20">
                  <GraduationCap className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Webb Student or Staff</div>
                  <div className="text-xs text-muted-foreground">
                    Sign in with your @webb.org email and sport
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground shrink-0" />
              </button>

              <button
                onClick={() => setStep('viewer-confirm')}
                className="w-full flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4 text-left hover:bg-muted/60 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Season Viewer</div>
                  <div className="text-xs text-muted-foreground">
                    Browse schedules and results without an account
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground shrink-0" />
              </button>
            </div>
          )}

          {/* Step 2a — member form */}
          {step === 'member-form' && (
            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => { setStep('choose'); setErrors({}); }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
              >
                ← Back
              </button>

              <h3 className="font-semibold text-sm">Webb Student / Staff Sign In</h3>

              {/* Name */}
              <div className="space-y-1">
                <Label htmlFor="sl-name" className="text-xs">Full Name</Label>
                <Input
                  id="sl-name"
                  placeholder="First Last"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
                  className={cn(errors.name && 'border-destructive')}
                  autoFocus
                />
                {errors.name && <p className="text-xs text-destructive flex gap-1"><AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="sl-email" className="text-xs">School Email</Label>
                <Input
                  id="sl-email"
                  type="email"
                  placeholder="you@webb.org"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                  className={cn(errors.email && 'border-destructive')}
                />
                {errors.email && <p className="text-xs text-destructive flex gap-1"><AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />{errors.email}</p>}
              </div>

              {/* Grade */}
              <div className="space-y-1">
                <Label className="text-xs">Grade</Label>
                <Select value={grade} onValueChange={v => { setGrade(v); setErrors(p => ({ ...p, grade: '' })); }}>
                  <SelectTrigger className={cn(errors.grade && 'border-destructive')}>
                    <SelectValue placeholder="Select grade…" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map(g => (
                      <SelectItem key={g} value={g}>{g === 'Faculty/Staff' ? 'Faculty / Staff' : `Grade ${g}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.grade && <p className="text-xs text-destructive flex gap-1"><AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />{errors.grade}</p>}
              </div>

              {/* Sport — filtered to current season */}
              <div className="space-y-1">
                <Label className="text-xs">Primary Sport <span className="text-muted-foreground">({season.label})</span></Label>
                <Select value={sport} onValueChange={v => { setSport(v); setErrors(p => ({ ...p, sport: '' })); }}>
                  <SelectTrigger className={cn(errors.sport && 'border-destructive')}>
                    <SelectValue placeholder="Select sport…" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasonSports.map(s => (
                      <SelectItem key={s} value={s}>{sportDisplayName(s)}</SelectItem>
                    ))}
                    <SelectItem value="other">Other / Multiple</SelectItem>
                  </SelectContent>
                </Select>
                {errors.sport && <p className="text-xs text-destructive flex gap-1"><AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />{errors.sport}</p>}
              </div>

              <Button type="submit" className="w-full mt-2">
                Enter Webb Sports Hub
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}

          {/* Step 2b — viewer confirm */}
          {step === 'viewer-confirm' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('choose')}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
              >
                ← Back
              </button>

              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-2">
                <p>As a <strong className="text-foreground">Season Viewer</strong> you can browse schedules, rosters, and results.</p>
                <p>You won't have access to team chat or announcements.</p>
                <p className="text-xs">Your session is valid for the <strong className="text-foreground">{season.label}</strong> season and will reset when the next season begins.</p>
              </div>

              <Button className="w-full" onClick={handleViewerConfirm}>
                Continue as Viewer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
