import { SportSelector } from '@/components/dashboard/SportSelector';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { UpcomingGames } from '@/components/dashboard/UpcomingGames';
import { useTeam } from '@/context/TeamContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Upload, Users } from 'lucide-react';

export default function Dashboard() {
  const { games, players, coaches } = useTeam();
  const isEmpty = games.length === 0 && players.length === 0 && coaches.length === 0;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your team's schedule and stats
          </p>
        </div>
        <SportSelector />
      </div>
      
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <div className="mx-auto max-w-md text-center">
            <h2 className="mb-2 text-xl font-semibold">Welcome to Team Manager!</h2>
            <p className="mb-6 text-muted-foreground">
              Get started by importing your schedule or adding team members.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/schedule" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import Schedule
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/roster" className="gap-2">
                  <Users className="h-4 w-4" />
                  Add Team Members
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <QuickStats />
          <div className="grid gap-6 lg:grid-cols-2">
            <UpcomingGames />
          </div>
        </>
      )}
    </div>
  );
}
