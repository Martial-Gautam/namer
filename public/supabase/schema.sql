create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  selected_name text not null,
  selected_part text not null default 'First name',
  name_key text not null,
  avatar_url text,
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name_key text not null,
  display_name text not null,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.messages (
  id bigserial primary key,
  room_id uuid not null references public.rooms(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists profiles_name_key_idx on public.profiles(name_key);
create index if not exists rooms_name_status_idx on public.rooms(name_key, status, created_at);
create index if not exists room_members_user_idx on public.room_members(user_id);
create index if not exists messages_room_created_idx on public.messages(room_id, created_at);

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles upsert own" on public.profiles;
create policy "profiles upsert own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "rooms readable to authenticated" on public.rooms;
create policy "rooms readable to authenticated"
on public.rooms for select
to authenticated
using (true);

drop policy if exists "rooms insert authenticated" on public.rooms;
create policy "rooms insert authenticated"
on public.rooms for insert
to authenticated
with check (true);

drop policy if exists "rooms update members" on public.rooms;
create policy "rooms update members"
on public.rooms for update
to authenticated
using (
  exists (
    select 1 from public.room_members
    where room_members.room_id = rooms.id
    and room_members.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.room_members
    where room_members.room_id = rooms.id
    and room_members.user_id = auth.uid()
  )
);

drop policy if exists "room members readable to members" on public.room_members;
create policy "room members readable to members"
on public.room_members for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.room_members own_membership
    where own_membership.room_id = room_members.room_id
    and own_membership.user_id = auth.uid()
  )
);

drop policy if exists "room members insert own" on public.room_members;
create policy "room members insert own"
on public.room_members for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "messages readable to room members" on public.messages;
create policy "messages readable to room members"
on public.messages for select
to authenticated
using (
  exists (
    select 1 from public.room_members
    where room_members.room_id = messages.room_id
    and room_members.user_id = auth.uid()
  )
);

drop policy if exists "messages insert by room members" on public.messages;
create policy "messages insert by room members"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.room_members
    where room_members.room_id = messages.room_id
    and room_members.user_id = auth.uid()
  )
);

alter publication supabase_realtime add table public.messages;
