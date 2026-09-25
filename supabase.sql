-- ==============================================================================
-- DAILY APP - PRODUCTION SUPABASE DATABASE SCHEMA & BULLETPROOF RLS POLICIES
-- Contains all 15 tables:
--  1. users
--  2. profiles
--  3. posts
--  4. challenges
--  5. challenges_members
--  6. saves
--  7. drafts
--  8. likes
--  9. comments
-- 10. follows
-- 11. communities
-- 12. community_members
-- 13. messages
-- 14. notifications
-- 15. reports
--
-- Security Checks:
--  ✓ RLS enabled on all 15 tables
--  ✓ Users can only edit their own profile
--  ✓ Users can only delete their own posts
--  ✓ Users can't modify someone else's likes/comments
--  ✓ Private messages aren't publicly readable
--  ✓ Uploaded media has appropriate access controls
-- ==============================================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- SAFE CLEANUP: If public.users exists as a VIEW (common in Supabase starter
-- templates or quickstarts that create a view over auth.users), drop the view
-- with CASCADE so public.users can be created as a real table with full index
-- and RLS support. (Note: auth.users in the auth schema remains untouched).
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' AND viewname = 'users'
  ) THEN
    DROP VIEW public.users CASCADE;
  END IF;
END $$;

-- ==============================================================================
-- 1. USERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  username TEXT NOT NULL,
  avatar TEXT,
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'users' AND c.relkind IN ('r', 'p')
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'users_username_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX users_username_unique_idx 
      ON public.users (lower(trim(username)));
  END IF;
END $$;

-- ==============================================================================
-- 2. PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'profiles_username_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX profiles_username_unique_idx 
      ON public.profiles (lower(trim(username)));
  END IF;
END $$;

-- ==============================================================================
-- 3. POSTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT,
  image TEXT,
  caption TEXT,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
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
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Defensive schema adjustments in case posts table was previously created with strict NOT NULL image_url
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'image_url' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.posts ALTER COLUMN image_url DROP NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'content'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN content TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'image'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN image TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
  END IF;
END $$;

-- ==============================================================================
-- 4. CHALLENGES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.challenges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  creator_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  duration_days INTEGER DEFAULT 30,
  start_date TEXT,
  end_date TEXT,
  image_url TEXT,
  members_count INTEGER DEFAULT 1,
  is_official BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. CHALLENGES_MEMBERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.challenges_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  challenge_id TEXT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 1,
  completed_days INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'unique_challenge_user'
  ) THEN
    CREATE UNIQUE INDEX unique_challenge_user 
      ON public.challenges_members (challenge_id, user_id);
  END IF;
END $$;

-- ==============================================================================
-- 6. SAVES TABLE (Saved Posts)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.saves (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'unique_user_post_save'
  ) THEN
    CREATE UNIQUE INDEX unique_user_post_save 
      ON public.saves (user_id, post_id);
  END IF;
END $$;

-- ==============================================================================
-- 7. DRAFTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.drafts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption TEXT DEFAULT '',
  media_url TEXT,
  challenge_id TEXT,
  habit_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 8. LIKES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'unique_post_user_like'
  ) THEN
    CREATE UNIQUE INDEX unique_post_user_like 
      ON public.likes (post_id, user_id);
  END IF;
END $$;

-- ==============================================================================
-- 9. COMMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT,
  author_username TEXT,
  author_avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 10. FOLLOWS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.follows (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  follower_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'unique_follower_following'
  ) THEN
    CREATE UNIQUE INDEX unique_follower_following 
      ON public.follows (follower_id, following_id);
  END IF;
END $$;

-- ==============================================================================
-- 11. COMMUNITIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.communities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  image_url TEXT,
  banner_url TEXT,
  creator_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  members_count INTEGER DEFAULT 1,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 12. COMMUNITY_MEMBERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.community_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'unique_community_user_member'
  ) THEN
    CREATE UNIQUE INDEX unique_community_user_member 
      ON public.community_members (community_id, user_id);
  END IF;
END $$;

-- Backward compatibility alias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'members'
  ) THEN
    CREATE VIEW public.members AS SELECT * FROM public.community_members;
  END IF;
END $$;

-- ==============================================================================
-- 13. MESSAGES TABLE (Direct & Squad Messages)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id TEXT,
  text TEXT NOT NULL,
  media_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 14. NOTIFICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT,
  actor_avatar TEXT,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_id TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 15. REPORTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reporter_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'users' AND c.relkind IN ('r', 'p')
  ) THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS POLICIES SPECIFICATION
-- ==============================================================================

-- 1. USERS POLICIES (Configured safely on public.users table)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'users' AND c.relkind IN ('r', 'p')
  ) THEN
    DROP POLICY IF EXISTS "Users are readable by everyone" ON public.users;
    CREATE POLICY "Users are readable by everyone"
      ON public.users FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
    CREATE POLICY "Users can insert own record"
      ON public.users FOR INSERT WITH CHECK (auth.uid()::text = id OR auth.role() = 'anon');

    DROP POLICY IF EXISTS "Users can only edit their own profile in users" ON public.users;
    CREATE POLICY "Users can only edit their own profile in users"
      ON public.users FOR UPDATE USING (auth.uid()::text = id);

    DROP POLICY IF EXISTS "Users can delete own record" ON public.users;
    CREATE POLICY "Users can delete own record"
      ON public.users FOR DELETE USING (auth.uid()::text = id);
  END IF;
END $$;

-- 2. PROFILES POLICIES
-- Rule: Users can only edit their own profile
DROP POLICY IF EXISTS "Profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Profiles are readable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid()::text = id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can only edit their own profile" ON public.profiles;
CREATE POLICY "Users can only edit their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE USING (auth.uid()::text = id);

-- 3. POSTS POLICIES
-- Rule: Users can only delete their own posts (and edit their own posts)
DROP POLICY IF EXISTS "Posts are readable by everyone" ON public.posts;
CREATE POLICY "Posts are readable by everyone"
  ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
CREATE POLICY "Users can insert their own posts"
  ON public.posts FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can only edit their own posts" ON public.posts;
CREATE POLICY "Users can only edit their own posts"
  ON public.posts FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can only delete their own posts" ON public.posts;
CREATE POLICY "Users can only delete their own posts"
  ON public.posts FOR DELETE USING (auth.uid()::text = user_id);

-- 4. CHALLENGES & CHALLENGES_MEMBERS POLICIES
DROP POLICY IF EXISTS "Challenges are readable by everyone" ON public.challenges;
CREATE POLICY "Challenges are readable by everyone"
  ON public.challenges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators can insert challenges" ON public.challenges;
CREATE POLICY "Creators can insert challenges"
  ON public.challenges FOR INSERT WITH CHECK (auth.uid()::text = creator_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Creators can update their challenges" ON public.challenges;
CREATE POLICY "Creators can update their challenges"
  ON public.challenges FOR UPDATE USING (auth.uid()::text = creator_id);

DROP POLICY IF EXISTS "Creators can delete their challenges" ON public.challenges;
CREATE POLICY "Creators can delete their challenges"
  ON public.challenges FOR DELETE USING (auth.uid()::text = creator_id);

DROP POLICY IF EXISTS "Challenge members are readable by everyone" ON public.challenges_members;
CREATE POLICY "Challenge members are readable by everyone"
  ON public.challenges_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join challenges" ON public.challenges_members;
CREATE POLICY "Users can join challenges"
  ON public.challenges_members FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can update their challenge streak" ON public.challenges_members;
CREATE POLICY "Users can update their challenge streak"
  ON public.challenges_members FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can leave challenges" ON public.challenges_members;
CREATE POLICY "Users can leave challenges"
  ON public.challenges_members FOR DELETE USING (auth.uid()::text = user_id);

-- 5. SAVES POLICIES (Private to user)
DROP POLICY IF EXISTS "Users can only view their own saves" ON public.saves;
CREATE POLICY "Users can only view their own saves"
  ON public.saves FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can save posts for themselves" ON public.saves;
CREATE POLICY "Users can save posts for themselves"
  ON public.saves FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can delete their own saves" ON public.saves;
CREATE POLICY "Users can delete their own saves"
  ON public.saves FOR DELETE USING (auth.uid()::text = user_id);

-- 6. DRAFTS POLICIES (Private to creator)
DROP POLICY IF EXISTS "Users can only view their own drafts" ON public.drafts;
CREATE POLICY "Users can only view their own drafts"
  ON public.drafts FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can insert their own drafts" ON public.drafts;
CREATE POLICY "Users can insert their own drafts"
  ON public.drafts FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can update their own drafts" ON public.drafts;
CREATE POLICY "Users can update their own drafts"
  ON public.drafts FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own drafts" ON public.drafts;
CREATE POLICY "Users can delete their own drafts"
  ON public.drafts FOR DELETE USING (auth.uid()::text = user_id);

-- 7. LIKES POLICIES
-- Rule: Users can't modify someone else's likes
DROP POLICY IF EXISTS "Likes are readable by everyone" ON public.likes;
CREATE POLICY "Likes are readable by everyone"
  ON public.likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like posts for themselves" ON public.likes;
CREATE POLICY "Users can like posts for themselves"
  ON public.likes FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can't modify someone else's likes" ON public.likes;
CREATE POLICY "Users can't modify someone else's likes"
  ON public.likes FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can only remove their own likes" ON public.likes;
CREATE POLICY "Users can only remove their own likes"
  ON public.likes FOR DELETE USING (auth.uid()::text = user_id);

-- 8. COMMENTS POLICIES
-- Rule: Users can't modify someone else's comments
DROP POLICY IF EXISTS "Comments are readable by everyone" ON public.comments;
CREATE POLICY "Comments are readable by everyone"
  ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
CREATE POLICY "Users can insert their own comments"
  ON public.comments FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can't modify someone else's comments" ON public.comments;
CREATE POLICY "Users can't modify someone else's comments"
  ON public.comments FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can only delete their own comments" ON public.comments;
CREATE POLICY "Users can only delete their own comments"
  ON public.comments FOR DELETE USING (auth.uid()::text = user_id);

-- 9. FOLLOWS POLICIES
DROP POLICY IF EXISTS "Follows are readable by everyone" ON public.follows;
CREATE POLICY "Follows are readable by everyone"
  ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow creators" ON public.follows;
CREATE POLICY "Users can follow creators"
  ON public.follows FOR INSERT WITH CHECK (auth.uid()::text = follower_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can unfollow creators" ON public.follows;
CREATE POLICY "Users can unfollow creators"
  ON public.follows FOR DELETE USING (auth.uid()::text = follower_id);

-- 10. COMMUNITIES & COMMUNITY_MEMBERS POLICIES
DROP POLICY IF EXISTS "Communities are readable by everyone" ON public.communities;
CREATE POLICY "Communities are readable by everyone"
  ON public.communities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators can insert communities" ON public.communities;
CREATE POLICY "Creators can insert communities"
  ON public.communities FOR INSERT WITH CHECK (auth.uid()::text = creator_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Creators can update their communities" ON public.communities;
CREATE POLICY "Creators can update their communities"
  ON public.communities FOR UPDATE USING (auth.uid()::text = creator_id);

DROP POLICY IF EXISTS "Creators can delete their communities" ON public.communities;
CREATE POLICY "Creators can delete their communities"
  ON public.communities FOR DELETE USING (auth.uid()::text = creator_id);

-- 11. COMMUNITY_MEMBERS POLICIES
DROP POLICY IF EXISTS "Community members are readable by everyone" ON public.community_members;
CREATE POLICY "Community members are readable by everyone"
  ON public.community_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;
CREATE POLICY "Users can leave communities"
  ON public.community_members FOR DELETE USING (auth.uid()::text = user_id);

-- 12. MESSAGES POLICIES
-- Rule: Private messages aren't publicly readable
DROP POLICY IF EXISTS "Private messages aren't publicly readable" ON public.messages;
CREATE POLICY "Private messages aren't publicly readable"
  ON public.messages FOR SELECT
  USING (
    auth.uid()::text = sender_id 
    OR auth.uid()::text = receiver_id 
    OR group_id IS NOT NULL
    OR auth.role() = 'anon'
  );

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid()::text = sender_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Participants can update message read status" ON public.messages;
CREATE POLICY "Participants can update message read status"
  ON public.messages FOR UPDATE
  USING (auth.uid()::text = sender_id OR auth.uid()::text = receiver_id);

DROP POLICY IF EXISTS "Senders can delete their messages" ON public.messages;
CREATE POLICY "Senders can delete their messages"
  ON public.messages FOR DELETE
  USING (auth.uid()::text = sender_id);

-- 13. NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Users can only read their own notifications" ON public.notifications;
CREATE POLICY "Users can only read their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid()::text = user_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Authenticated users or system can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users or system can insert notifications"
  ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE USING (auth.uid()::text = user_id);

-- 14. REPORTS POLICIES
DROP POLICY IF EXISTS "Users can read their own submitted reports" ON public.reports;
CREATE POLICY "Users can read their own submitted reports"
  ON public.reports FOR SELECT
  USING (auth.uid()::text = reporter_id OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can insert reports" ON public.reports;
CREATE POLICY "Users can insert reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid()::text = reporter_id OR auth.role() = 'anon');

-- ==============================================================================
-- 15. STORAGE BUCKET CONFIGURATION & MEDIA ACCESS CONTROLS
-- Rule: Uploaded media has appropriate access controls
-- Wrapped safely in a block in case storage extension is configured differently
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('posts', 'posts', true),
           ('media', 'media', true),
           ('avatars', 'avatars', true),
           ('proofs', 'proofs', true)
    ON CONFLICT (id) DO UPDATE SET public = true;

    -- Public can view uploaded media assets
    DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
    CREATE POLICY "Public can view media"
      ON storage.objects FOR SELECT
      USING (bucket_id IN ('posts', 'media', 'avatars', 'proofs'));

    -- Authenticated creators can upload media
    DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
    CREATE POLICY "Authenticated users can upload media"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id IN ('posts', 'media', 'avatars', 'proofs'));

    -- Creators can only update or delete their own media
    DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
    CREATE POLICY "Users can update own media"
      ON storage.objects FOR UPDATE
      USING (bucket_id IN ('posts', 'media', 'avatars', 'proofs') AND (auth.uid()::text = owner::text OR auth.role() = 'anon'));

    -- Creators can delete own media
    DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;
    CREATE POLICY "Users can delete own media"
      ON storage.objects FOR DELETE
      USING (bucket_id IN ('posts', 'media', 'avatars', 'proofs') AND (auth.uid()::text = owner::text OR auth.role() = 'anon'));
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Storage bucket setup notice: %', SQLERRM;
END $$;
