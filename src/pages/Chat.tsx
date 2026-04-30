import { useState } from 'react';
import { useTeam } from '@/context/TeamContext';
import { useAuth } from '@/context/AuthContext';
import { AnnouncementFeed } from '@/components/chat/AnnouncementFeed';
import { TeamChat } from '@/components/chat/TeamChat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Megaphone, MessageSquare, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { programLabel, getSportGroups } from '@/lib/programUtils';
import { useNavigate } from 'react-router-dom';
import type { Sport } from '@/types/team';

type Tab = 'announcements' | 'team-chat';

const sportGroups = getSportGroups();

export default function Chat() {
  const { currentProgram, setCurrentProgram } = useTeam();
  const { isAdmin, seasonProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('announcements');

  // For non-admins: lock to their season sport (and gender if known)
  const lockedSport = !isAdmin && seasonProfile?.type === 'member' ? seasonProfile.sport : null;
  const lockedGender = !isAdmin && seasonProfile?.type === 'member' ? seasonProfile.gender : undefined;

  // If locked to a sport but currentProgram doesn't match, auto-fix it.
  // For multi-gender sports without a known gender, skip — avoids defaulting to boys.
  if (lockedSport && lockedSport !== 'other' && currentProgram?.sport !== lockedSport) {
    const group = sportGroups.find(g => g.sport === (lockedSport as Sport));
    if (group && (!group.hasMultipleGenders || lockedGender)) {
      const program =
        (lockedGender
          ? (group.programs.find(p => p.level === 'varsity' && p.gender === lockedGender) ??
             group.programs.find(p => p.gender === lockedGender))
          : (group.programs.find(p => p.level === 'varsity') ?? group.programs[0])) ?? group.programs[0];
      if (program) setCurrentProgram(program);
    }
  }

  // No program resolved — prompt
  if (!currentProgram) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <Layers className="h-12 w-12 text-muted-foreground/30" />
        <h2 className="text-lg font-semibold">Select a Program First</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Choose a sport program to view its announcements and team chat.
        </p>
        <Button onClick={() => navigate('/get-started')}>Select a Sport</Button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Megaphone }[] = [
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'team-chat', label: 'Team Chat', icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Chat & Announcements</h1>
          <span className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <Badge variant="outline" className="text-[11px] border-gold/40 text-gold/90 bg-gold/10">
              {programLabel(currentProgram)}
            </Badge>
            {isAdmin && <span className="text-[11px] text-muted-foreground ml-1">Admin view</span>}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={cn(
        'flex-1 min-h-0',
        tab === 'team-chat' && 'flex flex-col',
      )}>
        {tab === 'announcements' && (
          <div className="pb-8">
            <AnnouncementFeed currentProgram={currentProgram} />
          </div>
        )}
        {tab === 'team-chat' && (
          <div className="flex flex-col flex-1 min-h-0 h-[calc(100vh-220px)] rounded-xl border border-border overflow-hidden bg-card">
            <TeamChat program={currentProgram} />
          </div>
        )}
      </div>
    </div>
  );
}
