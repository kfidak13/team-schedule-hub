import { useEffect, useRef, useState } from 'react';
import { useChat, getViewerKey, getViewerName, setViewerName } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { programKey } from '@/lib/programUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Send, MessageSquare, Trash2 } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Program } from '@/types/team';

interface Props {
  program: Program;
}

function dateSeparatorLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMMM d, yyyy');
}

// Rate limit: max 5 messages per 10 seconds per viewer
const MSG_LIMIT = 5;
const MSG_WINDOW_MS = 10_000;
const timestamps: number[] = [];
function isRateLimited(): boolean {
  const now = Date.now();
  while (timestamps.length && now - timestamps[0] > MSG_WINDOW_MS) timestamps.shift();
  if (timestamps.length >= MSG_LIMIT) return true;
  timestamps.push(now);
  return false;
}

export function TeamChat({ program }: Props) {
  const { chatMessages, loadMessagesForProgram, sendMessage, clearProgramChat } = useChat();
  const { isAdmin } = useAuth();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [namePromptOpen, setNamePromptOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nukeConfirmOpen, setNukeConfirmOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const viewerKey = getViewerKey();

  const key = programKey(program);
  const senderName = isAdmin ? 'Athletic Director' : (getViewerName() || '');

  // Load messages whenever program changes
  useEffect(() => {
    loadMessagesForProgram(program);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  // Filter messages for this program, discard those older than 30 days
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const messages = chatMessages.filter(
    m => m.programKey === key && new Date(m.createdAt).getTime() > cutoff
  );

  async function handleSend() {
    const text = input.trim();
    if (!text) return;

    // Non-admins must have a display name
    if (!isAdmin && !senderName) {
      setNamePromptOpen(true);
      return;
    }

    if (!isAdmin && isRateLimited()) {
      toast.error("Slow down! You're sending messages too quickly.");
      return;
    }

    setSending(true);
    try {
      await sendMessage(key, isAdmin ? 'Athletic Director' : senderName, isAdmin, text);
      setInput('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  function handleNameSave() {
    const name = nameInput.trim();
    if (!name) return;
    setViewerName(name);
    setNameInput('');
    setNamePromptOpen(false);
  }

  // Group messages by date for separators
  const grouped: { date: string; messages: typeof messages }[] = [];
  messages.forEach(m => {
    const day = m.createdAt.slice(0, 10);
    if (!grouped.length || grouped[grouped.length - 1].date !== day) {
      grouped.push({ date: day, messages: [m] });
    } else {
      grouped[grouped.length - 1].messages.push(m);
    }
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground text-center py-16">
            <MessageSquare className="h-10 w-10 opacity-20" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}

        {grouped.map(({ date, messages: dayMsgs }) => (
          <div key={date} className="space-y-1">
            {/* Date separator */}
            <div className="flex items-center gap-2 py-2">
              <div className="flex-1 h-px bg-border/40" />
              <span className="text-[11px] text-muted-foreground px-2">{dateSeparatorLabel(date + 'T00:00:00')}</span>
              <div className="flex-1 h-px bg-border/40" />
            </div>

            {dayMsgs.map((m, i) => {
              const isMe = isAdmin ? m.isAdmin : (m.senderName === senderName && !m.isAdmin);
              const prevSame = i > 0 && dayMsgs[i - 1].senderName === m.senderName && dayMsgs[i - 1].isAdmin === m.isAdmin;

              return (
                <div key={m.id} className={cn('flex flex-col', isMe ? 'items-end' : 'items-start', prevSame ? 'mt-0.5' : 'mt-2')}>
                  {!prevSame && (
                    <span className={cn('text-[11px] text-muted-foreground mb-0.5 px-1', isMe && 'text-right')}>
                      {m.isAdmin ? '🛡 ' : ''}{m.senderName}
                    </span>
                  )}
                  <div className={cn(
                    'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-snug break-words',
                    isMe
                      ? 'bg-[#002855] text-white rounded-br-sm'
                      : m.isAdmin
                        ? 'bg-gold/20 text-foreground border border-gold/30 rounded-bl-sm'
                        : 'bg-muted text-foreground rounded-bl-sm',
                  )}>
                    {m.body}
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 mt-0.5 px-1">
                    {format(new Date(m.createdAt), 'h:mm a')}
                  </span>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Admin: Clear Chat */}
      {isAdmin && (
        <div className="flex justify-end px-4 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive gap-1.5 text-xs"
            onClick={() => setNukeConfirmOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Chat
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border/50 px-4 py-3 bg-card/50">
        {!isAdmin && !senderName && (
          <p className="text-xs text-muted-foreground mb-2">
            Set your display name to chat.{' '}
            <button className="underline text-primary" onClick={() => setNamePromptOpen(true)}>Set name</button>
          </p>
        )}
        <div className="flex gap-2">
          <Input
            className="flex-1"
            placeholder={senderName ? 'Message…' : 'Set your name first…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={sending}
          />
          <Button size="icon" onClick={handleSend} disabled={sending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Nuke confirmation dialog */}
      <Dialog open={nukeConfirmOpen} onOpenChange={v => { if (!v) setNukeConfirmOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Clear all messages?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete all chat messages for this program. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNukeConfirmOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await clearProgramChat(key);
                setNukeConfirmOpen(false);
              }}
            >
              Delete All Messages
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Name prompt dialog */}
      <Dialog open={namePromptOpen} onOpenChange={v => { if (!v) setNamePromptOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>What's your name?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This name will be visible to others in the team chat.
          </p>
          <Input
            placeholder="Your name…"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); }}
            autoFocus
          />
          <Button onClick={handleNameSave} disabled={!nameInput.trim()}>
            Save & Continue
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
