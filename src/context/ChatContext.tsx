import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { programKey } from '@/lib/programUtils';
import type { Program } from '@/types/team';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  sport: string;
  gender: string;
  level: string;
  authorName: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  programKey: string;
  senderName: string;
  isAdmin: boolean;
  body: string;
  createdAt: string;
}

interface ChatContextValue {
  announcements: Announcement[];
  chatMessages: ChatMessage[];
  acks: Record<string, string[]>;          // announcementId → viewerKey[]
  loadMessagesForProgram: (p: Program) => void;
  postAnnouncement: (a: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  togglePin: (id: string, pinned: boolean) => Promise<void>;
  sendMessage: (programKey: string, senderName: string, isAdmin: boolean, body: string) => Promise<void>;
  acknowledgeAnnouncement: (announcementId: string, viewerKey: string) => Promise<void>;
  clearProgramChat: (programKey: string) => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────────

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

// ── Row mappers ────────────────────────────────────────────────────────────────

function rowToAnnouncement(r: Record<string, unknown>): Announcement {
  return {
    id: r.id as string,
    sport: r.sport as string,
    gender: r.gender as string,
    level: r.level as string,
    authorName: r.author_name as string,
    title: r.title as string,
    body: r.body as string,
    pinned: r.pinned as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function rowToMessage(r: Record<string, unknown>): ChatMessage {
  return {
    id: r.id as string,
    programKey: r.program_key as string,
    senderName: r.sender_name as string,
    isAdmin: r.is_admin as boolean,
    body: r.body as string,
    createdAt: r.created_at as string,
  };
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [acks, setAcks] = useState<Record<string, string[]>>({});
  const [activeProgramKey, setActiveProgramKey] = useState<string | null>(null);

  // ── Load announcements (all — scoped in UI) ──
  useEffect(() => {
    loadAnnouncements();
    const sub = supabase
      .channel('announcements-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, loadAnnouncements)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  // ── Load acks ──
  useEffect(() => {
    loadAcks();
    const sub = supabase
      .channel('acks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcement_acks' }, loadAcks)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  async function loadAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setAnnouncements(data.map(rowToAnnouncement));
  }

  async function loadAcks() {
    const { data } = await supabase.from('announcement_acks').select('announcement_id, viewer_key');
    if (data) {
      const map: Record<string, string[]> = {};
      data.forEach((r: { announcement_id: string; viewer_key: string }) => {
        if (!map[r.announcement_id]) map[r.announcement_id] = [];
        map[r.announcement_id].push(r.viewer_key);
      });
      setAcks(map);
    }
  }

  // ── Subscribe to messages for a specific program ──
  const loadMessagesForProgram = useCallback((p: Program) => {
    const key = programKey(p);
    if (key === activeProgramKey) return;
    setActiveProgramKey(key);
    setChatMessages([]);

    // Load recent history (last 100)
    supabase
      .from('chat_messages')
      .select('*')
      .eq('program_key', key)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setChatMessages(data.map(rowToMessage));
      });
  }, [activeProgramKey]);

  // Realtime subscription for active program's messages
  useEffect(() => {
    if (!activeProgramKey) return;
    const sub = supabase
      .channel(`chat-${activeProgramKey}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `program_key=eq.${activeProgramKey}` },
        (payload) => {
          setChatMessages(prev => [...prev, rowToMessage(payload.new as Record<string, unknown>)]);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [activeProgramKey]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const postAnnouncement = async (a: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => {
    await supabase.from('announcements').insert({
      sport: a.sport,
      gender: a.gender,
      level: a.level,
      author_name: a.authorName,
      title: a.title,
      body: a.body,
      pinned: a.pinned,
    });
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const togglePin = async (id: string, pinned: boolean) => {
    await supabase.from('announcements').update({ pinned, updated_at: new Date().toISOString() }).eq('id', id);
  };

  const sendMessage = async (key: string, senderName: string, isAdmin: boolean, body: string) => {
    await supabase.from('chat_messages').insert({
      program_key: key,
      sender_name: senderName,
      is_admin: isAdmin,
      body,
    });
  };

  const acknowledgeAnnouncement = async (announcementId: string, viewerKey: string) => {
    await supabase.from('announcement_acks').upsert({
      announcement_id: announcementId,
      viewer_key: viewerKey,
      acknowledged_at: new Date().toISOString(),
    });
  };

  // Admin: delete all messages for a program (nuke button)
  const clearProgramChat = async (key: string) => {
    await supabase.from('chat_messages').delete().eq('program_key', key);
    setChatMessages(prev => prev.filter(m => m.programKey !== key));
  };

  return (
    <ChatContext.Provider value={{
      announcements,
      chatMessages,
      acks,
      loadMessagesForProgram,
      postAnnouncement,
      deleteAnnouncement,
      togglePin,
      sendMessage,
      acknowledgeAnnouncement,
      clearProgramChat,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}

// ── Viewer key (persisted identity for non-admin users) ───────────────────────
// Returns a stable key for this browser session, prompts for name if not set.
export function getViewerKey(): string {
  let key = localStorage.getItem('viewer_key');
  if (!key) {
    key = `viewer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('viewer_key', key);
  }
  return key;
}

export function getViewerName(): string {
  return localStorage.getItem('viewer_name') || '';
}

export function setViewerName(name: string) {
  localStorage.setItem('viewer_name', name);
}
