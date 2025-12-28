# Home Feed System Design

**Last Updated:** 2025-12-28
**Status:** Active - Fixed post visibility bug

**Recent Fixes (2025-12-28):**
1. Resolved critical bug where posts appeared after creation but disappeared on app restart due to missing `status` and `location` fields in create_post RPC
2. Fixed vote button UI not updating instantly - added `extraData={userVotes}` to FlatList so it re-renders when votes change
3. Fixed "type geography does not exist" error when creating posts - enabled PostGIS extension

## Prerequisites

**PostGIS Extension Required:** This system uses PostGIS for spatial queries. Ensure PostGIS is enabled in your database:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Migration `20251228_enable_postgis.sql` handles this automatically.

## Overview

Location-based social feed with voting, comments, photos, and reposts. Posts load based on user's location radius (default 5km). Uses cursor-based infinite scroll pagination.

---

## Database Schema

### Core Tables

**posts**
- `id` (bigint, PK)
- `user_id` (uuid, FK → users)
- `content` (text)
- `latitude` / `longitude` (double precision)
- `location` (geography) - PostGIS point for spatial queries
- `location_name` (text) - Human-readable location
- `score` (integer) - Auto-calculated from votes
- `comment_count` (integer) - Auto-calculated from comments
- `is_anonymous` (boolean)
- `repost_of` (bigint, FK → posts) - NULL for original posts
- `status` (text) - 'active' | 'deleted' | 'flagged'
- `created_at` (timestamp)

**votes_posts**
- `user_id` (uuid, FK → users)
- `post_id` (bigint, FK → posts)
- `vote_type` (smallint) - `-1` (down), `1` (up)
- UNIQUE constraint: (user_id, post_id)
- Triggers auto-update `posts.score` on INSERT/UPDATE/DELETE

**post_photos**
- `id` (bigint, PK)
- `post_id` (bigint, FK → posts)
- `photo_url` (text) - Supabase Storage public URL
- `photo_order` (integer) - Display order (0-2, max 3 photos)

**comments**
- Triggers auto-update `posts.comment_count` on INSERT/UPDATE/DELETE

---

## Database Functions (RPCs)

### `get_feed_v2()`
**Main feed query** - Returns posts within radius, sorted by new/popular

**Parameters:**
```sql
user_lat DOUBLE PRECISION
user_lon DOUBLE PRECISION
radius_meters INTEGER        -- -1 for global feed
sort_by TEXT                 -- 'new' | 'popular'
time_filter TEXT             -- 'day' | 'week' | 'month' (for popular)
limit_count INTEGER          -- 20 per page
cursor_post_id BIGINT        -- Last post ID from previous page
cursor_value DOUBLE PRECISION -- Last score/timestamp for cursor
```

**Returns:** Array of posts with:
- All post fields
- `author_nickname`, `is_anonymous` (from users join)
- `photos[]` (from post_photos join, ordered by photo_order)
- `reposted_post_*` fields if repost_of is set
- `distance_meters` (calculated from user location)

**Sorting:**
- **New:** `created_at DESC, id DESC` (cursor: timestamp)
- **Popular:** `score DESC, created_at DESC, id DESC` (cursor: score)

**Spatial Query:** Uses PostGIS `ST_DWithin()` on `location` geography column for meter-based radius filtering.

### `handle_post_vote()`
**Vote on a post**

**Parameters:**
```sql
p_post_id BIGINT
p_user_id UUID
p_vote_value INTEGER  -- -1 (downvote), 0 (remove), 1 (upvote)
```

**Logic:**
- `p_vote_value = 0`: DELETE from votes_posts
- `p_vote_value = ±1`: UPSERT into votes_posts
- Automatically recalculates `posts.score` via trigger

### `create_post()`
**Create a new post** (with rate limiting)

**Parameters:**
```sql
p_content TEXT
p_latitude / p_longitude DOUBLE PRECISION
p_location_name TEXT
p_repost_of BIGINT (optional)
p_is_anonymous BOOLEAN
```

**Returns:** Newly created post object

---

## Frontend Architecture

### File Structure

```
src/
├── app/(tabs)/home.jsx            # Main feed UI
├── app/compose.jsx                # Post creation screen
├── services/posts/
│   ├── usePosts.js                # Feed queries
│   ├── useCreatePost.js           # Post creation mutation
│   └── usePostActions.js          # Vote/delete mutations
└── ui/components/
    ├── PhotoGrid.jsx              # Photo display
    └── PostActionSheet.jsx        # Post options menu
```

### Key React Hooks

**`usePostsQuery(lat, lon, radius, sortBy, timeFilter)`**
- Uses React Query `useInfiniteQuery`
- Calls `get_feed_v2` RPC
- Returns paginated posts with `fetchNextPage()` for infinite scroll
- Cache: 5min stale, 30min gc
- Query key: `["posts", lat, lon, radius, sortBy, timeFilter]`

**`useUserVotesQuery(userId)`**
- Fetches all user's votes as a map: `{ [postId]: 'up' | 'down' }`
- Cache: 10min stale, 30min gc
- Used to highlight voted posts in UI

**`useVotePostMutation()`**
- Calls `handle_post_vote` RPC
- Optimistic updates: instantly updates UI before server response
- Rollback on error

**`useCreatePostMutation()`**
- Step 1: Call `create_post` RPC
- Step 2: Insert photos into `post_photos` table
- **Rollback:** If photo insert fails, delete the post
- Optimistic update: Shows temp post immediately in feed

### Location Strategy

**On app startup:**
1. Load cached location from AsyncStorage (instant feed load)
2. Request fresh location in background
3. Update feed with fresh location when available

**Location state:** `{ latitude, longitude }`

---

## Data Flow

### Feed Loading
```
User Opens App
  → Load cached location (instant)
  → Request fresh location (background)
  → usePostsQuery enabled when location exists
    → get_feed_v2 RPC with spatial filter
    → Returns 20 posts per page
  → Infinite scroll: fetchNextPage() with cursor
```

### Voting
```
User Taps Vote Button
  → Optimistic UI update (instant feedback)
  → useVotePostMutation
    → handle_post_vote RPC
      → UPSERT/DELETE votes_posts
      → Trigger recalculates posts.score
  → Success: Keep UI | Error: Rollback UI
```

### Post Creation
```
User Writes Post + Adds Photos
  → Photo compression (max 1MB per photo)
  → Upload photos to Supabase Storage
  → useCreatePostMutation
    → create_post RPC (returns post.id)
    → Insert photos into post_photos
    → On failure: Delete post + show error
  → Optimistic update: Add temp post to feed
  → On success: Replace temp with real post
```

---

## Key Optimizations

### Performance
- **Indexes:** Composite indexes for score/created_at sorting + spatial GIST index
- **Cursor pagination:** Efficient for deep scrolling (vs offset)
- **Geography type:** Native PostGIS meter-based queries (faster than haversine in app)
- **React Query caching:** Reduces redundant API calls

### Cost Reduction
- **No real-time subscriptions:** Removed to save 70-80% on database connections
- **Manual refresh only:** Pull-to-refresh or app restart
- **Cached location:** Reduces permission prompts

### User Experience
- **Optimistic updates:** Instant feedback for votes/posts
- **Cached first load:** Shows stale data immediately while fetching fresh
- **Photo compression:** 1MB max per photo before upload

---

## Important Notes

### Vote System
- **0 = remove vote** (not stored in DB, just deletes row)
- **±1 = up/down** (stored as smallint)
- Triggers handle score recalculation automatically

### Photos
- Max 3 photos per post
- Stored in Supabase Storage (public bucket)
- URLs stored in `post_photos.photo_url`
- `photo_order` maintains display order (0, 1, 2)

### Anonymous Posts
- `posts.is_anonymous` determines if author shown
- User ID still stored (for moderation)
- UI shows "Anonymous" instead of nickname

### Reposts
- `posts.repost_of` links to original post
- Feed query joins to get `reposted_post_*` fields
- If original deleted, shows "Post deleted" placeholder

### Location
- Required for creating posts
- User can set radius in profile (default 5km)
- Global feed: `radius = -1` (no spatial filter)

---

## Common Issues & Fixes

**Posts not loading (FIXED 2025-12-28)**
- ✅ **Root Cause:** create_post RPC wasn't setting `status='active'` and `location` geography fields
- ✅ **Fix:** Updated RPC to include both fields in INSERT statement
- ✅ **Backfill:** Applied migration to fix existing posts with NULL values
- Check location permission granted
- Verify location state has { latitude, longitude }
- Check query error in React Query devtools

**Photos not appearing**
- Ensure photos inserted AFTER post creation
- Check photo_order is sequential (0, 1, 2)
- Verify photo URLs are public Supabase URLs

**Votes not working (FIXED 2025-12-28)**
- ✅ **Root Cause:** FlatList wasn't re-rendering when userVotes changed (missing extraData prop)
- ✅ **Fix:** Added `extraData={userVotes}` to FlatList component
- Ensure user is authenticated
- Check handle_post_vote accepts 0 for removal
- Verify trigger is firing on votes_posts changes
- **Note:** Vote mutation already had proper optimistic updates, issue was purely FlatList rendering

**Feed not updating after post creation**
- Check optimistic update in useCreatePostMutation
- Verify post added to first page of infinite query
- Confirm temp post replaced with real post on success
