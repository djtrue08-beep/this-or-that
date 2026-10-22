-- Development schema. Review security before using with real participants.
create extension if not exists pgcrypto;
create table if not exists public.rooms (id uuid primary key default gen_random_uuid(),code text not null unique,mode text not null check(mode in ('family','adult')),status text not null default 'lobby',question_index integer not null default 0,created_at timestamptz not null default now());
create table if not exists public.players (id uuid primary key default gen_random_uuid(),room_id uuid not null references public.rooms(id) on delete cascade,name text not null,score numeric not null default 0,created_at timestamptz not null default now());
create table if not exists public.votes (id uuid primary key default gen_random_uuid(),room_id uuid not null references public.rooms(id) on delete cascade,player_id uuid not null references public.players(id) on delete cascade,question_id text not null,choice text not null check(choice in ('a','b')),created_at timestamptz not null default now(),unique(player_id,question_id));
-- No public access policies yet: the browser cannot use these tables until secured server-side
-- endpoints and appropriate Row Level Security are implemented.
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.votes enable row level security;
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;
