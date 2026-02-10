import { SportSelector } from '@/components/dashboard/SportSelector';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { UpcomingGames } from '@/components/dashboard/UpcomingGames';
import { useTeam } from '@/context/TeamContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import {
  Upload,
  Users,
  Calendar,
  List,
  BarChart3,
  Trophy,
  ArrowRight,
  Shield,
  Gamepad2,
} from 'lucide-react';

const branches = [
  {
    title: 'Schedule',
    description: 'Manage games and import schedules',
    icon: Calendar,
    color: 'bg-blue-500',
    items: [
      { label: 'View Games', path: '/schedule', icon: List },
      { label: 'Import Schedule', path: '/schedule/import', icon: Upload },
    ],
  },
  {
    title: 'Roster',
    description: 'Players and coaching staff',
    icon: Users,
    color: 'bg-green-500',
    items: [
      { label: 'Players', path: '/roster/players', icon: Users },
      { label: 'Coaches', path: '/roster/coaches', icon: Shield },
    ],
  },
  {
    title: 'Stats',
    description: 'Performance and analytics',
    icon: BarChart3,
    color: 'bg-purple-500',
    items: [
      { label: 'Team Stats', path: '/stats/team', icon: Trophy },
      { label: 'Game History', path: '/stats/games', icon: Gamepad2 },
    ],
  },
];

export default function Dashboard() {
  const { games, players, coaches } = useTeam();
  const isEmpty = games.length === 0 && players.length === 0 && coaches.length === 0;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Hub</h1>
          <p className="text-muted-foreground mt-1">
            Central command for your team's schedule, roster, and stats
          </p>
        </div>
        <SportSelector />
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 py-20">
          <div className="mx-auto max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-semibold">Welcome to Team Hub!</h2>
            <p className="mb-8 text-muted-foreground">
              Get started by choosing a section below to import your schedule or build your roster.
            </p>
          </div>

          {/* Empty State Branches */}
          <div className="grid w-full max-w-4xl gap-4 px-4 sm:grid-cols-3">
            {branches.map((branch) => (
              <Card key={branch.title} className="group transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${branch.color}`}>
                    <branch.icon className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">{branch.title}</CardTitle>
                  <CardDescription>{branch.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {branch.items.map((item) => (
                    <Button key={item.path} variant="ghost" className="w-full justify-between" asChild>
                      <Link to={item.path}>
                        <span className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </span>
                        <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Quick Stats Row */}
          <QuickStats />

          {/* Branch Navigation Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {branches.map((branch) => (
              <Card key={branch.title} className="group overflow-hidden transition-all hover:shadow-md">
                <div className={`h-1 w-full ${branch.color}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${branch.color}`}>
                      <branch.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{branch.title}</CardTitle>
                      <CardDescription className="text-xs">{branch.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                  {branch.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <UpcomingGames />
          </div>
        </>
      )}
    </div>
  );
}
