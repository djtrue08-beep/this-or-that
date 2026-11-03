-- THIS OR THAT?! Dedicated database schema. Apply ONLY to its own Supabase project.
-- Public tables are locked down by default. Use authenticated server endpoints
-- with a room-scoped capability model; never expose the service-role key to clients.
create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(code)=4),
  mode text not null check (mode in ('family','adult','team')),
  team_size integer check (team_size in (2,3,5)),
  status text not null default 'lobby' check(status in ('lobby','intro','round','voting','results','leaderboard','final','winners','paused','ended')),
  round_number integer not null default 0,
  question_index integer not null default 0,
  question_id text,
  phase_ends_at timestamptz,
  created_at timestamptz not null default now(),
  check ((mode='team' and team_size is not null) or (mode<>'team' and team_size is null))
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 26),
  score integer not null default 0,
  streak integer not null default 0,
  chemistry_correct integer not null default 0,
  chemistry_total integer not null default 0,
  created_at timestamptz not null default now(),
  unique(room_id,name),
  unique(room_id,id)
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  team_id uuid,
  name text not null check (char_length(trim(name)) between 1 and 22),
  score integer not null default 0,
  created_at timestamptz not null default now(),
  unique(room_id,name),
  foreign key (room_id,team_id) references public.teams(room_id,id)
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  question_id text not null,
  choice text not null check(choice in ('a','b','c')),
  created_at timestamptz not null default now(),
  unique(player_id,question_id)
);

create index if not exists players_room_team_idx on public.players(room_id,team_id);
create index if not exists votes_room_question_idx on public.votes(room_id,question_id);
create index if not exists teams_room_idx on public.teams(room_id);

alter table public.rooms enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.votes enable row level security;

-- No anonymous table policies. Direct client queries intentionally denied.
-- Secure game actions must be implemented in room-scoped server endpoints.
do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='rooms') then
    alter publication supabase_realtime add table public.rooms;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='teams') then
    alter publication supabase_realtime add table public.teams;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='players') then
    alter publication supabase_realtime add table public.players;
  end if;
end $$;
