import { ReactNode, useMemo } from 'react';
import type { ElementType } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, LayoutDashboard, BarChart3, Trophy, Upload, List, UserCircle, Shield, Gamepad2, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
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

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  const activeSectionLabel = useMemo(() => {
    const found = navSections.find((s) => {
      if (s.path) return location.pathname === s.path;
      return s.children?.some((c) => location.pathname === c.path || location.pathname.startsWith(c.path));
    });
    return found?.label;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 ring-1 ring-border">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Webb Sports Hub</div>
              <div className="text-xs text-muted-foreground">Schedule Manager</div>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              to="/"
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                location.pathname === '/' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              Dashboard
            </Link>

            {navSections
              .filter((s) => s.children)
              .map((section) => (
                <DropdownMenu key={section.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'h-9 gap-2 px-3 text-sm font-medium',
                        activeSectionLabel === section.label && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <section.icon className="h-4 w-4" />
                      {section.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{section.label}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {section.children?.map((child) => (
                      <DropdownMenuItem key={child.path} asChild>
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
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {navSections
                  .filter((s) => s.children)
                  .map((section) => (
                    <div key={section.label}>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="flex items-center gap-2">
                        <section.icon className="h-4 w-4" />
                        {section.label}
                      </DropdownMenuLabel>
                      {section.children?.map((child) => (
                        <DropdownMenuItem key={child.path} asChild>
                          <Link to={child.path} className="flex items-center gap-2">
                            <child.icon className="h-4 w-4" />
                            {child.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        {children}
      </main>
    </div>
  );
}
