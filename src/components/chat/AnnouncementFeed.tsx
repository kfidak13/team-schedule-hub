import { useState } from 'react';
import { useChat, getViewerKey } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pin, Trash2, CheckCircle2, Circle, Plus, Megaphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnnouncementComposer } from './AnnouncementComposer';
import type { Program } from '@/types/team';
import { sportDisplayName } from '@/lib/programUtils';

interface Props {
  currentProgram: Program | null;
}

export function AnnouncementFeed({ currentProgram }: Props) {
  const { announcements, acks, deleteAnnouncement, togglePin, acknowledgeAnnouncement } = useChat();
  const { isAdmin } = useAuth();
  const [composerOpen, setComposerOpen] = useState(false);
  const viewerKey = getViewerKey();

  // Filter: show announcements targeting this program or 'all'
  const visible = announcements.filter(a => {
    if (a.sport !== 'all' && currentProgram && a.sport !== currentProgram.sport) return false;
    if (a.gender !== 'all' && currentProgram && a.gender !== currentProgram.gender) return false;
    if (a.level !== 'all' && currentProgram && a.level !== currentProgram.level) return false;
    return true;
  });

  const pinned = visible.filter(a => a.pinned);
  const rest = visible.filter(a => !a.pinned);

  function announcementLabel(a: { sport: string; gender: string; level: string }) {
    if (a.sport === 'all') return 'All Programs';
    const parts = [
      a.gender !== 'all' ? (a.gender === 'boys' ? 'Boys' : 'Girls') : '',
      sportDisplayName(a.sport as Parameters<typeof sportDisplayName>[0]),
      a.level !== 'all' ? a.level.toUpperCase() : '',
    ].filter(Boolean);
    return parts.join(' ');
  }

  function AnnCard({ a }: { a: typeof announcements[0] }) {
    const ackList = acks[a.id] ?? [];
    const alreadyAcked = ackList.includes(viewerKey);

    return (
      <div className={cn(
        'rounded-xl border bg-card p-4 space-y-2 transition-all',
        a.pinned && 'border-gold/50 bg-gold/5',
      )}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {a.pinned && <Pin className="h-3.5 w-3.5 text-gold shrink-0" />}
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary/80">
              {announcementLabel(a)}
            </Badge>
            <span className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
            </span>
          </div>

          {isAdmin && (
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title={a.pinned ? 'Unpin' : 'Pin'}
                onClick={() => togglePin(a.id, !a.pinned)}
              >
                <Pin className={cn('h-3.5 w-3.5', a.pinned ? 'text-gold' : 'text-muted-foreground')} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => deleteAnnouncement(a.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Title + body */}
        <div>
          <h3 className="font-semibold text-sm leading-snug">{a.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.body}</p>
        </div>

        {/* Footer: author + ack */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">— {a.authorName}</span>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <span className="text-[11px] text-muted-foreground">{ackList.length} acknowledged</span>
            )}
            {!isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 gap-1.5 text-xs px-2',
                  alreadyAcked ? 'text-green-500' : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => !alreadyAcked && acknowledgeAnnouncement(a.id, viewerKey)}
                disabled={alreadyAcked}
              >
                {alreadyAcked
                  ? <><CheckCircle2 className="h-3.5 w-3.5" /> Acknowledged</>
                  : <><Circle className="h-3.5 w-3.5" /> Acknowledge</>
                }
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Admin post button */}
      {isAdmin && (
        <div className="flex justify-end">
          <Button size="sm" className="gap-2" onClick={() => setComposerOpen(true)}>
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        </div>
      )}

      {visible.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground">
          <Megaphone className="h-10 w-10 opacity-20" />
          <p className="text-sm">No announcements yet for this program.</p>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={() => setComposerOpen(true)}>
              Post the first one
            </Button>
          )}
        </div>
      )}

      {/* Pinned */}
      {pinned.map(a => <AnnCard key={a.id} a={a} />)}

      {/* Regular */}
      {rest.map(a => <AnnCard key={a.id} a={a} />)}

      <AnnouncementComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        defaultProgram={currentProgram}
      />
    </div>
  );
}
