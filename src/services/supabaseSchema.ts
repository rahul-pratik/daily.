/**
 * Supabase SQL DDL Schema Script
 * This script is provided for users to paste directly into the Supabase SQL Editor
 * to provision all tables, unique username index, RLS policies, and triggers.
 */

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- DAILY APP - SUPABASE DATABASE TABLES & RLS POLICIES SETUP
-- Instructions:
-- 1. Open your Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Select your project -> Click "SQL Editor" in the left sidebar
-- 3. Click "New query", paste this entire script, and click "Run" (Ctrl+Enter)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the PROFILES table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  avatar TEXT,
  bio TEXT DEFAULT '',
  email TEXT,
  current_streak INTEGER DEFAULT 1,
  longest_streak INTEGER DEFAULT 1,
  total_posts INTEGER DEFAULT 0,
  interests TEXT[] DEFAULT '{}',
  habits TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enforce strictly UNIQUE lowercase usernames across all accounts
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx 
  ON public.profiles (lower(trim(username)));

-- 4. Enable Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Profiles RLS Policies
-- Allow anyone to view public profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow anon key upserts for app onboarding sync
DROP POLICY IF EXISTS "Allow anon upsert during onboarding" ON public.profiles;
CREATE POLICY "Allow anon upsert during onboarding"
  ON public.profiles FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 6. Create POSTS table for daily streaks and proof logs
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT,
  author_username TEXT,
  author_avatar TEXT,
  image_url TEXT,
  caption TEXT,
  habit_tag TEXT,
  day_number INTEGER DEFAULT 1,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage their posts" ON public.posts;
CREATE POLICY "Users can manage their posts"
  ON public.posts FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. Automatic trigger to create a Profile whenever someone signs up via Google OAuth or Email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  raw_username TEXT;
  clean_username TEXT;
  counter INT := 0;
BEGIN
  raw_username := COALESCE(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  clean_username := lower(regexp_replace(raw_username, '[^a-zA-Z0-9_]', '', 'g'));
  IF clean_username = '' THEN
    clean_username := 'creator';
  END IF;

  -- Ensure unique username if collision occurs
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = clean_username AND id != new.id) LOOP
    counter := counter + 1;
    clean_username := lower(regexp_replace(raw_username, '[^a-zA-Z0-9_]', '', 'g')) || '_' || counter;
  END LOOP;

  INSERT INTO public.profiles (
    id,
    username,
    name,
    full_name,
    avatar_url,
    avatar,
    email,
    current_streak,
    longest_streak
  )
  VALUES (
    new.id,
    clean_username,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'),
    new.email,
    1,
    1
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Create optional view for 'users' so queries to either 'profiles' or 'users' work
CREATE OR REPLACE VIEW public.users AS SELECT * FROM public.profiles;
`;
