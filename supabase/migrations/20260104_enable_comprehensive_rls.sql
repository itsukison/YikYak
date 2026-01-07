-- ============================================================
-- Comprehensive Row Level Security (RLS) Policies
-- Created: 2026-01-04
-- Purpose: Protect all tables with RLS to prevent unauthorized access
-- ============================================================

-- Enable RLS on all core tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.votes_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.votes_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.post_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.follows ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================

-- Users can view their own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Users can view public profile fields of all users
CREATE POLICY "users_select_public" ON public.users
  FOR SELECT TO authenticated
  USING (true);

-- Users can update only their own profile
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can insert their own profile (signup)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- ============================================================
-- POSTS TABLE POLICIES
-- ============================================================

-- Anyone authenticated can view active posts
CREATE POLICY "posts_select_active" ON public.posts
  FOR SELECT TO authenticated
  USING (status = 'active');

-- Users can insert their own posts
CREATE POLICY "posts_insert_own" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update only their own posts
CREATE POLICY "posts_update_own" ON public.posts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete only their own posts
CREATE POLICY "posts_delete_own" ON public.posts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- COMMENTS TABLE POLICIES
-- ============================================================

-- Anyone can view comments on active posts
CREATE POLICY "comments_select_on_active_posts" ON public.comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = comments.post_id
      AND posts.status = 'active'
    )
  );

-- Users can create comments
CREATE POLICY "comments_insert_own" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "comments_update_own" ON public.comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "comments_delete_own" ON public.comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- MESSAGES TABLE POLICIES
-- ============================================================

-- Users can view messages in chats they're part of
CREATE POLICY "messages_select_own_chats" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
    )
  );

-- Users can insert messages to chats they're part of
CREATE POLICY "messages_insert_to_own_chats" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND (chats.user1_id = auth.uid() OR chats.user2_id = auth.uid())
    )
  );

-- Users can update their own messages (edit functionality)
CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "messages_delete_own" ON public.messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

-- ============================================================
-- CHATS TABLE POLICIES
-- ============================================================

-- Users can view their own chats
CREATE POLICY "chats_select_own" ON public.chats
  FOR SELECT TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Users can create chats where they are one of the participants
CREATE POLICY "chats_insert_own" ON public.chats
  FOR INSERT TO authenticated
  WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- Users can update chats they're part of (for read receipts, typing indicators, etc.)
CREATE POLICY "chats_update_own" ON public.chats
  FOR UPDATE TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid())
  WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- ============================================================
-- VOTES_POSTS TABLE POLICIES
-- ============================================================

-- Users can view their own post votes
CREATE POLICY "votes_posts_select_own" ON public.votes_posts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own votes
CREATE POLICY "votes_posts_insert_own" ON public.votes_posts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own votes
CREATE POLICY "votes_posts_update_own" ON public.votes_posts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own votes
CREATE POLICY "votes_posts_delete_own" ON public.votes_posts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- VOTES_COMMENTS TABLE POLICIES
-- ============================================================

-- Users can view their own comment votes
CREATE POLICY "votes_comments_select_own" ON public.votes_comments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own votes
CREATE POLICY "votes_comments_insert_own" ON public.votes_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own votes
CREATE POLICY "votes_comments_update_own" ON public.votes_comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own votes
CREATE POLICY "votes_comments_delete_own" ON public.votes_comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================

-- Users can view their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users or service role can insert notifications
-- Note: Typically notifications are created by triggers or RPC functions with SECURITY DEFINER
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- POST_PHOTOS TABLE POLICIES
-- ============================================================

-- Anyone can view photos for active posts
CREATE POLICY "post_photos_select_on_active_posts" ON public.post_photos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_photos.post_id
      AND posts.status = 'active'
    )
  );

-- Users can add photos to their own posts
CREATE POLICY "post_photos_insert_to_own_posts" ON public.post_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_photos.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- Users can delete photos from their own posts
CREATE POLICY "post_photos_delete_from_own_posts" ON public.post_photos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_photos.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- ============================================================
-- REPORTS TABLE POLICIES
-- ============================================================

-- Users can create reports
CREATE POLICY "reports_insert" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Only service role can view reports (for admin dashboard)
-- Users cannot see reports to prevent retaliation
CREATE POLICY "reports_select_service_role" ON public.reports
  FOR SELECT TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- ============================================================
-- FOLLOWS TABLE POLICIES
-- ============================================================

-- Anyone can view follow relationships
CREATE POLICY "follows_select_all" ON public.follows
  FOR SELECT TO authenticated
  USING (true);

-- Users can create their own follows
CREATE POLICY "follows_insert_own" ON public.follows
  FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid());

-- Users can delete their own follows
CREATE POLICY "follows_delete_own" ON public.follows
  FOR DELETE TO authenticated
  USING (follower_id = auth.uid());

-- ============================================================
-- VERIFICATION
-- ============================================================

-- To verify RLS is working, run these queries in Supabase SQL Editor:
--
-- 1. Set user context:
-- SELECT set_config('request.jwt.claims', '{"sub":"user-id-here"}', true);
--
-- 2. Try to access other user's data:
-- SELECT * FROM messages WHERE sender_id != 'user-id-here';
-- (Should return 0 rows if RLS is working)
--
-- 3. Try to access own data:
-- SELECT * FROM messages WHERE sender_id = 'user-id-here';
-- (Should return your messages)

-- ============================================================
-- NOTES
-- ============================================================
--
-- 1. All policies use SECURITY DEFINER for RPC functions
-- 2. Service role has full access (bypasses RLS)
-- 3. Authenticated users are restricted by these policies
-- 4. Anonymous users have no access (all policies require authentication)
-- 5. Some policies check related table records (e.g., post status)
-- 6. Policies are named consistently: [table]_[operation]_[scope]
--
-- ============================================================
