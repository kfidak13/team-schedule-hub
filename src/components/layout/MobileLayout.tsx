import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTeam } from '@/context/TeamContext';
import { useAuth } from '@/context/AuthContext';
import { getSportGroups, levelLabel, programLabel } from '@/lib/programUtils';
import type { Program, Sport } from '@/types/team';
import { PageTransition } from './PageTransition';
import { Footer } from './Footer';
import { cn } from '@/lib/utils';
import {
  Home, LayoutDashboard, Calendar, Users, BarChart3,
  ChevronDown, ChevronRight, X, ShieldCheck, Layers, MessageSquare, Globe,
} from 'lucide-react';
import type { ElementType } from 'react';

const sportGroups = getSportGroups();

const tabs: { path: string; label: string; icon: ElementType; match?: string[] }[] = [
  { path: '/',           label: 'Home',     icon: Home,          match: ['/'] },
  { path: '/get-started', label: 'Sports',  icon: Layers,        match: ['/get-started', '/dashboard'] },
  { path: '/schedule',   label: 'Schedule', icon: Calendar,      match: ['/schedule'] },
  { path: '/chat',       label: 'Chat',     icon: MessageSquare, match: ['/chat'] },
  { path: '/roster/players', label: 'Roster', icon: Users,       match: ['/roster'] },
  { path: '/stats/team', label: 'Stats',    icon: BarChart3,     match: ['/stats'] },
];

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentProgram, setCurrentProgram } = useTeam();
  const { isAdmin } = useAuth();
  const [sportsOpen, setSportsOpen] = useState(false);
  const [expandedSport, setExpandedSport] = useState<Sport | null>(null);

  function selectProgram(program: Program) {
    setCurrentProgram(program);
    setSportsOpen(false);
    setExpandedSport(null);
    navigate('/dashboard');
  }

  function isTabActive(tab: typeof tabs[0]) {
    if (tab.path === '/') return location.pathname === '/';
    return tab.match?.some((m) => location.pathname.startsWith(m)) ?? false;
  }

  function handleTabPress(tab: typeof tabs[0]) {
    if (tab.label === 'Sports') {
      setSportsOpen(true);
    } else {
      navigate(tab.path);
    }
  }

  const isHome = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-[100svh] bg-background">
      {/* Top header — compact */}
      <header
        className="sticky top-0 z-40 bg-[#002855] shadow-md flex items-center justify-between px-4 h-14"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/icons/icon-192.png"
            alt="Webb"
            className="h-8 w-8 rounded-md object-cover"
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white tracking-tight">Webb Sports Hub</div>
            {currentProgram ? (
              <div className="text-xs text-[#D4AF37] font-medium truncate max-w-[160px]">
                {programLabel(currentProgram)}
              </div>
            ) : (
              <div className="text-xs text-white/50">Athletics</div>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin-login"
              className="flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-medium text-white"
            >
              <ShieldCheck className="h-3 w-3" />
              Admin
            </Link>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className={cn(
        'flex-1 overflow-x-hidden',
        isHome ? '' : 'px-4 py-4 pb-24'
      )}>
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {location.pathname !== '/' && <Footer />}

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 bg-[#001428] border-t border-white/10 flex items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {tabs.map((tab) => {
          const active = isTabActive(tab);
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => handleTabPress(tab)}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
                active ? 'text-[#D4AF37]' : 'text-white/50'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]')} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Sports Sheet Overlay */}
      {sportsOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => { setSportsOpen(false); setExpandedSport(null); }}
          />

          {/* Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85svh] rounded-t-2xl bg-[#001428] border-t border-white/10 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            {/* Handle + header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10 shrink-0">
              <div>
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
                <h2 className="text-base font-bold text-white">Select a Sport</h2>
                {currentProgram && (
                  <p className="text-xs text-[#D4AF37] mt-0.5">{programLabel(currentProgram)}</p>
                )}
              </div>
              <button
                onClick={() => { setSportsOpen(false); setExpandedSport(null); }}
                className="rounded-full bg-white/10 p-2"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Scrollable sport list */}
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-1">
              {sportGroups.map((group) => {
                const isExpanded = expandedSport === group.sport;
                return (
                  <div key={group.sport}>
                    <button
                      onClick={() => setExpandedSport(isExpanded ? null : group.sport)}
                      className={cn(
                        'w-full flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-medium transition-colors',
                        isExpanded
                          ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                          : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                      )}
                    >
                      {group.name}
                      <ChevronDown className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        isExpanded ? 'rotate-180 text-[#D4AF37]' : 'text-white/40'
                      )} />
                    </button>

                    {isExpanded && (
                      <div className="mt-1 ml-3 space-y-1 pb-1 fade-in">
                        {group.hasMultipleGenders ? (
                          <>
                            <p className="px-3 pt-2 pb-1 text-xs uppercase tracking-wider text-white/40 font-semibold">Boys</p>
                            {group.programs.filter((p) => p.gender === 'boys').map((p) => (
                              <button
                                key={p.label}
                                onClick={() => selectProgram(p)}
                                className={cn(
                                  'w-full flex items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors',
                                  currentProgram?.sport === p.sport && currentProgram?.gender === p.gender && currentProgram?.level === p.level
                                    ? 'bg-[#D4AF37] text-[#002855] font-bold'
                                    : 'bg-white/5 text-white/80 hover:bg-white/10'
                                )}
                              >
                                {levelLabel(p.level)}
                                <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                              </button>
                            ))}
                            <p className="px-3 pt-2 pb-1 text-xs uppercase tracking-wider text-white/40 font-semibold">Girls</p>
                            {group.programs.filter((p) => p.gender === 'girls').map((p) => (
                              <button
                                key={p.label}
                                onClick={() => selectProgram(p)}
                                className={cn(
                                  'w-full flex items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors',
                                  currentProgram?.sport === p.sport && currentProgram?.gender === p.gender && currentProgram?.level === p.level
                                    ? 'bg-[#D4AF37] text-[#002855] font-bold'
                                    : 'bg-white/5 text-white/80 hover:bg-white/10'
                                )}
                              >
                                {levelLabel(p.level)}
                                <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                              </button>
                            ))}
                          </>
                        ) : (
                          group.programs.map((p) => (
                            <button
                              key={p.label}
                              onClick={() => selectProgram(p)}
                              className={cn(
                                'w-full flex items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors',
                                currentProgram?.sport === p.sport && currentProgram?.gender === p.gender && currentProgram?.level === p.level
                                  ? 'bg-[#D4AF37] text-[#002855] font-bold'
                                  : 'bg-white/5 text-white/80 hover:bg-white/10'
                              )}
                            >
                              {levelLabel(p.level)}
                              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
