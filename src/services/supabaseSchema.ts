/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Supabase SQL DDL Schema Script
 * This script is provided for users to paste directly into the Supabase SQL Editor
 * to provision all 8 tables, unique username index, RLS policies, and triggers:
 * 1. profiles (with unique username constraint)
 * 2. posts
 * 3. comments
 * 4. likes
 * 5. follows
 * 6. communities
 * 7. members
 * 8. collections
 */

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- DAILY APP - COMPREHENSIVE SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Instructions:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard)
-- 2. Click "SQL Editor" in the left navigation sidebar
-- 3. Click "New query", paste this entire script, and click "Run" (or Ctrl+Enter)
-- ==============================================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES TABLE (App Creators & Users)
-- ==============================================================================
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
  highest_streak INTEGER DEFAULT 1,
  longest_streak INTEGER DEFAULT 1,
  level INTEGER DEFAULT 1,
  rank TEXT DEFAULT 'Bronze',
  total_proofs INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  streak_freezes_left INTEGER DEFAULT 2,
  interests TEXT[] DEFAULT '{}',
  habits TEXT[] DEFAULT '{}',
  auth_provider TEXT DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Strictly unique lowercase usernames across all accounts (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx 
  ON public.profiles (lower(trim(username)));

-- ==============================================================================
-- 2. POSTS TABLE (Daily Streaks & Proof Logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  challenge_title TEXT,
  category TEXT DEFAULT 'General',
  habit_tag TEXT,
  streak_day INTEGER DEFAULT 1,
  day_number INTEGER DEFAULT 1,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT true,
  author_name TEXT,
  author_username TEXT,
  author_avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. COMMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT,
  author_username TEXT,
  author_avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. LIKES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_post_user_like UNIQUE (post_id, user_id)
);

-- ==============================================================================
-- 5. FOLLOWS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.follows (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_follower_following UNIQUE (follower_id, following_id)
);

-- ==============================================================================
-- 6. COMMUNITIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.communities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  image_url TEXT,
  banner_url TEXT,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  members_count INTEGER DEFAULT 1,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 7. MEMBERS TABLE (Community Memberships)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_community_user_member UNIQUE (community_id, user_id)
);

-- ==============================================================================
-- 8. COLLECTIONS TABLE (Proof Bookmarks & Lists)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  post_ids TEXT[] DEFAULT '{}',
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Profiles are readable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON public.profiles;
CREATE POLICY "Authenticated users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;
CREATE POLICY "Authenticated users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can delete own profile" ON public.profiles;
CREATE POLICY "Authenticated users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- POSTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Posts are readable by everyone" ON public.posts;
CREATE POLICY "Posts are readable by everyone"
  ON public.posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert their own posts" ON public.posts;
CREATE POLICY "Authenticated users can insert their own posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- COMMENTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Comments are readable by everyone" ON public.comments;
CREATE POLICY "Comments are readable by everyone"
  ON public.comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can write comments" ON public.comments;
CREATE POLICY "Authenticated users can write comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- LIKES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Likes are readable by everyone" ON public.likes;
CREATE POLICY "Likes are readable by everyone"
  ON public.likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can like posts" ON public.likes;
CREATE POLICY "Authenticated users can like posts"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own likes" ON public.likes;
CREATE POLICY "Users can remove their own likes"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- FOLLOWS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Follows are readable by everyone" ON public.follows;
CREATE POLICY "Follows are readable by everyone"
  ON public.follows FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can follow creators" ON public.follows;
CREATE POLICY "Authenticated users can follow creators"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ------------------------------------------------------------------------------
-- COMMUNITIES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Communities are readable by everyone" ON public.communities;
CREATE POLICY "Communities are readable by everyone"
  ON public.communities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create communities" ON public.communities;
CREATE POLICY "Authenticated users can create communities"
  ON public.communities FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can update their communities" ON public.communities;
CREATE POLICY "Creators can update their communities"
  ON public.communities FOR UPDATE
  USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can delete their communities" ON public.communities;
CREATE POLICY "Creators can delete their communities"
  ON public.communities FOR DELETE
  USING (auth.uid() = creator_id);

-- ------------------------------------------------------------------------------
-- MEMBERS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Community members are readable by everyone" ON public.members;
CREATE POLICY "Community members are readable by everyone"
  ON public.members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can join communities" ON public.members;
CREATE POLICY "Authenticated users can join communities"
  ON public.members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave communities" ON public.members;
CREATE POLICY "Users can leave communities"
  ON public.members FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- COLLECTIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public collections are readable, private by owner" ON public.collections;
CREATE POLICY "Public collections are readable, private by owner"
  ON public.collections FOR SELECT
  USING (is_private = false OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create collections" ON public.collections;
CREATE POLICY "Authenticated users can create collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their collections" ON public.collections;
CREATE POLICY "Users can update their collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their collections" ON public.collections;
CREATE POLICY "Users can delete their collections"
  ON public.collections FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC TRIGGER: Sync Auth Users to Profiles
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  raw_username TEXT;
  clean_username TEXT;
  counter INT := 0;
BEGIN
  raw_username := COALESCE(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'preferred_username',
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
    longest_streak,
    auth_provider
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
    1,
    COALESCE(new.raw_app_meta_data->>'provider', 'email')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    avatar = COALESCE(EXCLUDED.avatar, public.profiles.avatar),
    updated_at = now();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- View for backwards compatibility
CREATE OR REPLACE VIEW public.users AS SELECT * FROM public.profiles;
`;
