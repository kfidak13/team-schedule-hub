import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChat } from '@/context/ChatContext';
import { getSportGroups } from '@/lib/programUtils';
import { toast } from 'sonner';
import type { Program } from '@/types/team';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultProgram?: Program | null;
}

const sportGroups = getSportGroups();

export function AnnouncementComposer({ open, onClose, defaultProgram }: Props) {
  const { postAnnouncement } = useChat();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sport, setSport] = useState(defaultProgram?.sport ?? 'all');
  const [gender, setGender] = useState(defaultProgram?.gender ?? 'all');
  const [level, setLevel] = useState(defaultProgram?.level ?? 'all');
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handlePost() {
    if (!title.trim() || !body.trim()) { toast.error('Title and body required'); return; }
    setLoading(true);
    try {
      await postAnnouncement({
        sport,
        gender,
        level,
        authorName: 'Athletic Director',
        title: title.trim(),
        body: body.trim(),
        pinned,
      });
      toast.success('Announcement posted');
      setTitle(''); setBody(''); setPinned(false);
      onClose();
    } catch {
      toast.error('Failed to post announcement');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Announcement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-2">
            {/* Sport */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Sport</Label>
              <Select value={sport} onValueChange={setSport}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {sportGroups.map(g => (
                    <SelectItem key={g.sport} value={g.sport}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="boys">Boys</SelectItem>
                  <SelectItem value="girls">Girls</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Level */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="varsity">Varsity</SelectItem>
                  <SelectItem value="jv">JV</SelectItem>
                  <SelectItem value="frosh">Frosh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ann-title">Title</Label>
            <Input
              id="ann-title"
              placeholder="Announcement title…"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ann-body">Message</Label>
            <Textarea
              id="ann-body"
              placeholder="Write your announcement…"
              rows={5}
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="pin-toggle" checked={pinned} onCheckedChange={setPinned} />
            <Label htmlFor="pin-toggle" className="text-sm cursor-pointer">Pin to top</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handlePost} disabled={loading}>
            {loading ? 'Posting…' : 'Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
