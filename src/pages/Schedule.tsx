import { HtmlImporter } from '@/components/schedule/HtmlImporter';
import { ScheduleList } from '@/components/schedule/ScheduleList';
import { SportSelector } from '@/components/dashboard/SportSelector';

export default function Schedule() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">
            View and manage your team's games and events
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <HtmlImporter />
        </div>
      </div>
      
      <SportSelector />
      
      <ScheduleList />
    </div>
  );
}
