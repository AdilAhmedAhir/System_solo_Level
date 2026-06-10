-- ════════════════════════════════════════════════════════════
-- THE SYSTEM — Solo Leveling Life OS
-- Supabase Database Schema for Multiplayer Guilds & Raids
-- ════════════════════════════════════════════════════════════

-- ── 1. HUNTERS (Users) ──────────────────────────────────────
CREATE TABLE public.hunters (
  id uuid references auth.users not null primary key,
  designation text not null,
  rank text default 'E',
  total_xp integer default 0,
  stats jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Secure hunters table
ALTER TABLE public.hunters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.hunters FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.hunters FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.hunters FOR UPDATE USING (auth.uid() = id);

-- Trigger to create a hunter profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.hunters (id, designation)
  VALUES (new.id, split_part(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ── 2. GUILDS (Teams) ───────────────────────────────────────
CREATE TABLE public.guilds (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  created_by uuid references public.hunters(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guilds are viewable by everyone" ON public.guilds FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create guilds" ON public.guilds FOR INSERT WITH CHECK (auth.uid() = created_by);


-- ── 3. GUILD MEMBERS ────────────────────────────────────────
CREATE TABLE public.guild_members (
  guild_id uuid references public.guilds(id) on delete cascade not null,
  hunter_id uuid references public.hunters(id) on delete cascade not null,
  role text default 'member' check (role in ('master', 'officer', 'member')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  PRIMARY KEY (guild_id, hunter_id)
);

ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guild members viewable by everyone" ON public.guild_members FOR SELECT USING (true);
CREATE POLICY "Users can join guilds" ON public.guild_members FOR INSERT WITH CHECK (auth.uid() = hunter_id);


-- ── 4. RAIDS (Projects) ─────────────────────────────────────
CREATE TABLE public.raids (
  id uuid default uuid_generate_v4() primary key,
  guild_id uuid references public.guilds(id) on delete cascade,
  name text not null,
  description text,
  deadline timestamp with time zone,
  status text default 'active' check (status in ('active', 'cleared', 'failed')),
  created_by uuid references public.hunters(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.raids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Raids are viewable by everyone" ON public.raids FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create raids" ON public.raids FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Raid creators can update" ON public.raids FOR UPDATE USING (auth.uid() = created_by);


-- ── 5. QUESTS (Tasks) ───────────────────────────────────────
CREATE TABLE public.quests (
  id uuid default uuid_generate_v4() primary key,
  raid_id uuid references public.raids(id) on delete cascade,
  hunter_id uuid references public.hunters(id), -- assigned to
  name text not null,
  stat_type text not null, -- str, int, etc.
  xp_reward integer not null default 25,
  is_done boolean default false,
  created_by uuid references public.hunters(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quests are viewable by everyone" ON public.quests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create quests" ON public.quests FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Assigned hunters can update quests" ON public.quests FOR UPDATE USING (auth.uid() = hunter_id OR auth.uid() = created_by);

-- ── 6. AI SETTINGS ──────────────────────────────────────────
-- Store encrypted API keys per guild or globally (for MVP, we use a simple table)
CREATE TABLE public.system_config (
  key text primary key,
  value text not null
);
-- Only allow anon read if needed, or secure entirely. 
-- Note: for a true SaaS, API keys should be handled server-side securely. 
-- For this MVP, we will rely on users entering their own keys in the client localStorage to avoid exposing them entirely in DB.
