import { ReactNode, useState } from 'react';
import type { ElementType } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  Users,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Trophy,
  BarChart3,
  Upload,
  List,
  UserCircle,
  Shield,
  Gamepad2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

function NavItem({
  section,
  location,
  isMobile,
  onNavigate,
}: {
  section: NavSection;
  location: ReturnType<typeof useLocation>;
  isMobile?: boolean;
  onNavigate?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(() => {
    if (!section.children) return false;
    return section.children.some((child) => location.pathname === child.path || location.pathname.startsWith(child.path));
  });

  const isActive = section.path
    ? location.pathname === section.path
    : section.children?.some((child) => location.pathname === child.path || location.pathname.startsWith(child.path));

  if (!section.children) {
    return (
      <Link
        to={section.path!}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <section.icon className="h-4 w-4" />
        {section.label}
      </Link>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <div className="flex items-center gap-3">
            <section.icon className="h-4 w-4" />
            {section.label}
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 space-y-1 border-l-2 border-border pl-4">
          {section.children.map((child) => (
            <Link
              key={child.path}
              to={child.path}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                location.pathname === child.path
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <child.icon className="h-4 w-4" />
              {child.label}
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Team Hub</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <nav
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-72 transform bg-card shadow-lg transition-transform duration-200 md:hidden',
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <span className="font-semibold">Menu</span>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-1 p-4">
          {navSections.map((section) => (
            <NavItem key={section.label} section={section} location={location} isMobile onNavigate={() => setMobileMenuOpen(false)} />
          ))}
        </div>
      </nav>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
          <div className="sticky top-0 h-screen overflow-y-auto p-6">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                <Trophy className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Team Hub</h1>
                <p className="text-xs text-muted-foreground">Schedule Manager</p>
              </div>
            </div>
            <nav className="space-y-1">
              {navSections.map((section) => (
                <NavItem key={section.label} section={section} location={location} />
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
