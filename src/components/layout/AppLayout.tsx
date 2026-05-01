import { ReactNode, useMemo, useState } from 'react';
import type { ElementType } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTeam } from '@/context/TeamContext';
import { useAuth } from '@/context/AuthContext';
import { programLabel, getSportGroups, levelLabel } from '@/lib/programUtils';
import type { Program } from '@/types/team';
import { Footer } from './Footer';
import { PageTransition } from './PageTransition';
import { MobileLayout } from './MobileLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar, Users, LayoutDashboard, BarChart3, Trophy, Upload, List, UserCircle, Shield, Gamepad2, Menu, ChevronDown, Layers, ShieldCheck, Home, MessageSquare, Globe } from 'lucide-react';
import { isDev } from '@/lib/env';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppLayoutProps {
  children: ReactNode;
}

type NavSection = {
  label: string;
  icon: ElementType;
  path?: string;
  children?: { path: string; label: string; icon: ElementType }[];
};

const navSections: NavSection[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Schedule',
    icon: Calendar,
    children: [
      { path: '/schedule', label: 'Games', icon: List },
      { path: '/schedule/import', label: 'Import', icon: Upload },
    ],
  },
  {
    label: 'Roster',
    icon: Users,
    children: [
      { path: '/roster/players', label: 'Players', icon: UserCircle },
      { path: '/roster/coaches', label: 'Coaches', icon: Shield },
    ],
  },
  {
    label: 'Stats',
    icon: BarChart3,
    children: [
      { path: '/stats/team', label: 'Team Stats', icon: Trophy },
      { path: '/stats/games', label: 'Game History', icon: Gamepad2 },
    ],
  },
];

const sportGroups = getSportGroups();

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentProgram, setCurrentProgram } = useTeam();
  const { isAdmin, isStatsAdmin, isAuthenticated, signOut, user } = useAuth();
  const isDevRole = isAdmin || isStatsAdmin;
  const homePath = isDevRole ? '/' : '/dashboard';
  const isMobile = useIsMobile();

  function selectProgram(program: Program) {
    setCurrentProgram(program);
    navigate('/schedule');
  }

  const activeSectionLabel = useMemo(() => {
    const found = navSections.find((s) => {
      if (s.path) return location.pathname === s.path;
      return s.children?.some((c) => location.pathname === c.path || location.pathname.startsWith(c.path));
    });
    return found?.label;
  }, [location.pathname]);

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-[#002855] shadow-md" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-3">
            <Link to={homePath} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden">
                <img src="/images/webb-logo.png" alt="Webb" className="h-7 w-7 object-contain brightness-0 invert" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight text-white">Webb Sports Hub</div>
                <div className="text-xs text-white/60">Athletics</div>
              </div>
            </Link>

            {/* Program switcher — admins only */}
            {isDevRole ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hidden h-9 items-center gap-1.5 px-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 md:flex"
                  >
                    <Layers className="h-4 w-4" />
                    <span className="max-w-[180px] truncate">
                      {currentProgram ? programLabel(currentProgram) : 'Select Program'}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 bg-[#002855] border-border">
                  <DropdownMenuLabel className="text-white">Switch Program</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <MobileSportsList
                    sportGroups={sportGroups}
                    selectProgram={selectProgram}
                    currentProgram={currentProgram}
                  />
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild>
                    <Link to="/sports" className="flex items-center gap-2 text-white hover:bg-white/10">
                      <Globe className="h-4 w-4" />
                      Browse all sports
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : currentProgram ? (
              <span className="hidden md:flex items-center gap-1.5 px-3 text-sm font-medium text-white/70">
                <Layers className="h-4 w-4" />
                {programLabel(currentProgram)}
              </span>
            ) : null}
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            {isAdmin && (
              <Link
                to="/admin/users"
                className="flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-xs font-medium text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors"
              >
                <ShieldCheck className="h-3 w-3" />
                Admin
              </Link>
            )}
            {isAuthenticated ? (
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20 transition-colors"
                title={user.email ?? user.displayName}
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {isDevRole && (
              <Link
                to="/"
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-all duration-300',
                  location.pathname === '/' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-white/70 hover:text-white'
                )}
              >
                <Home className="inline h-4 w-4 mr-1 -mt-0.5" />
                Home
              </Link>
            )}
            <Link
              to="/dashboard"
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-all duration-300',
                location.pathname === '/dashboard' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-white/70 hover:text-white'
              )}
            >
              Dashboard
            </Link>
            <Link
              to="/chat"
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 flex items-center gap-1.5',
                location.pathname.startsWith('/chat') ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-white/70 hover:text-white'
              )}
            >
              <MessageSquare className="inline h-4 w-4" />
              Chat
            </Link>
            {navSections
              .filter((s) => s.children)
              .map((section) => (
                <DropdownMenu key={section.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'h-9 gap-2 px-3 text-sm font-medium transition-all duration-300 hover:bg-white/10',
                        activeSectionLabel === section.label ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-white/70 hover:text-white'
                      )}
                    >
                      <section.icon className="h-4 w-4" />
                      {section.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white border-border">
                    <DropdownMenuLabel className="text-[#002855]">{section.label}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {section.children
                      ?.filter((c) => c.path !== '/schedule/import' || isDev)
                      .map((child) => (
                        <DropdownMenuItem key={child.path} asChild className="text-[#002855] hover:border-l-2 hover:border-l-[#D4AF37] focus:border-l-2 focus:border-l-[#D4AF37]">
                          <Link to={child.path} className="flex items-center gap-2">
                            <child.icon className="h-4 w-4" />
                            {child.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
          </nav>

          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-[#002855]">
                {isDevRole && (
                  <DropdownMenuItem asChild>
                    <Link to="/" className="flex items-center gap-2 text-white hover:bg-white/10">
                      <Home className="h-4 w-4" />
                      Home
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2 text-white hover:bg-white/10">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/chat" className="flex items-center gap-2 text-white hover:bg-white/10">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin/users" className="flex items-center gap-2 text-[#D4AF37] hover:bg-white/10">
                      <ShieldCheck className="h-4 w-4" />
                      User Management
                    </Link>
                  </DropdownMenuItem>
                )}
                {isAuthenticated ? (
                  <DropdownMenuItem onSelect={() => signOut()} className="text-white hover:bg-white/10">
                    Sign Out
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/login" className="flex items-center gap-2 text-white hover:bg-white/10">
                      Sign In
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuLabel className="flex items-center gap-2 text-white">
                  <Layers className="h-4 w-4" />
                  Sports
                </DropdownMenuLabel>
                {isDevRole && <MobileSportsList sportGroups={sportGroups} selectProgram={selectProgram} currentProgram={currentProgram} />}
                {!isDevRole && currentProgram && (
                  <DropdownMenuItem disabled className="text-sm text-white/60 pl-6">
                    {programLabel(currentProgram)}
                  </DropdownMenuItem>
                )}

                {navSections
                  .filter((s) => s.children)
                  .map((section) => {
                    const visibleChildren = (section.children ?? []).filter(
                      (c) => c.path !== '/schedule/import' || (isAdmin && isDev)
                    );
                    if (!visibleChildren.length) return null;
                    return (
                      <div key={section.label}>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuLabel className="flex items-center gap-2 text-white">
                          <section.icon className="h-4 w-4" />
                          {section.label}
                        </DropdownMenuLabel>
                        {visibleChildren.map((child) => (
                          <DropdownMenuItem key={child.path} asChild>
                            <Link to={child.path} className="flex items-center gap-2 text-white hover:bg-white/10">
                              <child.icon className="h-4 w-4" />
                              {child.label}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-3 py-4 sm:px-6 sm:py-8 md:py-12">
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {location.pathname !== '/' && <Footer />}
    </div>
  );
}

type SportGroup = ReturnType<typeof getSportGroups>[number];

function MobileSportsList({
  sportGroups,
  selectProgram,
  currentProgram,
}: {
  sportGroups: SportGroup[];
  selectProgram: (p: Program) => void;
  currentProgram?: Program;
}) {
  const [openSport, setOpenSport] = useState<string | null>(null);

  return (
    <>
      {sportGroups.map((group) => (
        <div key={group.sport}>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setOpenSport(openSport === group.sport ? null : group.sport);
            }}
            className="flex items-center justify-between pl-6 text-sm text-white hover:bg-white/10"
          >
            {group.name}
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200 text-white/70',
                openSport === group.sport && 'rotate-180'
              )}
            />
          </DropdownMenuItem>
          {openSport === group.sport && (
            <div className="pl-10 pb-1">
              {group.hasMultipleGenders ? (
                <>
                  <p className="px-2 py-1 text-xs uppercase tracking-wider text-white/60">Boys</p>
                  {group.programs.filter((p) => p.gender === 'boys').map((p) => (
                    <DropdownMenuItem
                      key={p.label}
                      onSelect={() => selectProgram(p)}
                      className={cn(
                        'text-sm text-white hover:bg-white/10',
                        currentProgram?.sport === p.sport && currentProgram?.gender === p.gender && currentProgram?.level === p.level
                          ? 'text-[#D4AF37] font-medium'
                          : ''
                      )}
                    >
                      {levelLabel(p.level)}
                    </DropdownMenuItem>
                  ))}
                  <p className="px-2 py-1 text-xs uppercase tracking-wider text-white/60">Girls</p>
                  {group.programs.filter((p) => p.gender === 'girls').map((p) => (
                    <DropdownMenuItem
                      key={p.label}
                      onSelect={() => selectProgram(p)}
                      className={cn(
                        'text-sm text-white hover:bg-white/10',
                        currentProgram?.sport === p.sport && currentProgram?.gender === p.gender && currentProgram?.level === p.level
                          ? 'text-[#D4AF37] font-medium'
                          : ''
                      )}
                    >
                      {levelLabel(p.level)}
                    </DropdownMenuItem>
                  ))}
                </>
              ) : (
                group.programs.map((p) => (
                  <DropdownMenuItem
                    key={p.label}
                    onSelect={() => selectProgram(p)}
                    className={cn(
                      'text-sm text-white hover:bg-white/10',
                      currentProgram?.sport === p.sport && currentProgram?.gender === p.gender && currentProgram?.level === p.level
                        ? 'text-[#D4AF37] font-medium'
                        : ''
                    )}
                  >
                    {levelLabel(p.level)}
                  </DropdownMenuItem>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
