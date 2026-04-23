-- ── Announcements ──────────────────────────────────────────────────────────────
create table if not exists announcements (
  id          uuid primary key default gen_random_uuid(),
  sport       text not null default 'all',
  gender      text not null default 'all',
  level       text not null default 'all',
  author_name text not null default 'Athletic Director',
  title       text not null,
  body        text not null,
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Track how many viewers acknowledged each announcement
create table if not exists announcement_acks (
  announcement_id uuid references announcements(id) on delete cascade,
  viewer_key      text not null,
  acknowledged_at timestamptz not null default now(),
  primary key (announcement_id, viewer_key)
);

-- ── Team Chat Messages ─────────────────────────────────────────────────────────
-- program_key format: "sport_gender_level" e.g. "track_field_boys_varsity"
create table if not exists chat_messages (
  id          uuid primary key default gen_random_uuid(),
  program_key text not null,
  sender_name text not null,
  is_admin    boolean not null default false,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists chat_messages_program_key_idx on chat_messages (program_key, created_at desc);
create index if not exists announcements_sport_idx on announcements (sport, gender, level, created_at desc);

-- ── Enable Supabase Realtime on new tables ────────────────────────────────────
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table announcements;
alter publication supabase_realtime add table announcement_acks;
