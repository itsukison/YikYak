🦌 YikYak Japan – Product Requirements Document (PRD)
1️⃣ Overview

Goal:
Build a location-based, semi-anonymous social app for Japanese university students.
Users can:

Post short text updates visible to nearby users (like YikYak).

Upvote/downvote posts (like Reddit).

Comment under posts.

Follow other users and send direct 1-on-1 messages.

Choose between anonymous mode or nickname mode.

Tech Stack (initial MVP):

Frontend: React Native (Expo)

Backend: Supabase (Postgres + Auth + Realtime)

Auth: Supabase Auth (Email or .ac.jp email domain)

Realtime: Supabase Realtime API (for posts, comments, and chats)

Cache: React Query + AsyncStorage

Push notifications: Supabase Edge Functions + Expo Notifications

## Current Implementation Status

### ✅ Completed Features

**UI/UX Foundation** (refs: `src/app/(tabs)/*.jsx`, `src/components/*.jsx`, `src/utils/theme.js`)
- Tab navigation with 4 main screens: Feed, Messages, Notifications, Profile
- Headspace-inspired design system with warm colors and rounded corners
- Dark/light theme support via `useTheme()` hook
- Custom components: `AppBackground`, `EmptyState`, `MenuItem`, `KeyboardAvoidingAnimatedView`

**Feed Screen** (`src/app/(tabs)/home.jsx`)
- Location-based post feed with GPS filtering
- User-configurable radius (2km, 5km, 10km)
- Toggle between "New" and "Popular" sorting
- Post cards with upvote/downvote UI (optimistic updates)
- Distance/location display for each post
- Pull-to-refresh functionality (refreshes location and posts)
- Create post button (routes to `/create-post`)
- Anonymous/nickname display per post
- Comment count display
- Location error handling and status display

**Profile Screen** (`src/app/(tabs)/profile.jsx`)
- User profile with avatar, stats (posts, followers, following)
- Anonymous mode toggle with Switch UI
- Location radius preference (2km/5km/10km) - persisted to database
- Radius changes automatically refresh home feed
- Settings menu structure
- Sign out functionality

**Messages Screen** (`src/app/(tabs)/messages.jsx`)
- Empty state placeholder for DM feature

**Notifications Screen** (`src/app/(tabs)/notification.jsx`)
- Empty state placeholder

**Create Post Screen** (`src/app/create-post.jsx`)
- Post creation interface (implementation pending)

**Authentication System** ✅ (Completed 2025-10-21, Updated 2025-10-23)
- Supabase client initialized (`src/utils/supabase.js`)
- Auth hook with session management (`src/utils/auth/useAuth.js`)
- Login screen (`src/app/login.jsx`) - Headspace styling
- Signup screen (`src/app/signup.jsx`) - Headspace styling
- Onboarding screen (`src/app/onboarding.jsx`) - username/nickname/bio setup with validation
- Username field with uniqueness check (case-insensitive)
- Root layout auth routing (`src/app/_layout.jsx`)
- Auto-create user profile trigger on signup
- Users table with RLS policies and unique username constraint
- Note: Email verification needs to be disabled in Supabase dashboard

### 🚧 Pending Implementation

**Backend Integration** ✅ (Completed 2025-10-21)
- All 8 tables created with RLS policies and indexes
- Helper functions (distance calculation, vote handling, get_posts_within_radius)
- Triggers for auto-updating scores and counts
- Realtime enabled for posts, messages, comments
- Profile screen connected to real auth data
- Ready for frontend integration

**Frontend Integration** ✅ (ALL PHASES COMPLETE 2025-10-21)
- Home screen connected to Supabase (location-based posts, voting, realtime)
- Create post screen saves to database with real user data
- Profile screen shows real stats (post/follower/following counts)
- Messages screen shows chat list with unread counts
- Chat detail screen with real-time messaging
- Post detail screen with comments and voting
- Comment creation and voting functionality
- User profile view screen with follow/unfollow and message buttons
- Clickable author names navigate to user profiles
- Follow/unfollow functionality with status tracking
- Notifications system with unread badge and real-time updates
- React Query hooks for data management
- Realtime subscriptions for posts, messages, and notifications
- Optimistic UI updates for votes, messages, comments, and follows
- Auth routing centralized and working correctly
- No redirect loops or white screens
- Onboarding flow completes successfully

**Core Features** ✅ (ALL COMPLETE)
- ✅ Authentication & Onboarding
- ✅ Location-based Feed
- ✅ Create Posts
- ✅ Vote on Posts
- ✅ Comments System
- ✅ Direct Messaging
- ✅ Follow/Unfollow Users
- ✅ User Profiles
- ✅ Notifications System
- ✅ Real-time Updates
- ✅ Anonymous Mode

**Future Enhancements** 🚀
- Push notifications (Expo Notifications)
- Media uploads (images, videos)
- Group chats
- Trending topics
- AI moderation

**Data Layer** ✅
- React Query setup for caching
- AsyncStorage for session persistence
- Supabase Realtime subscriptions active

---

## 📚 Documentation Structure

### `/SOP/DEVELOPMENT_WORKFLOW.md`
Standard operating procedures for common tasks:
- Starting development and running the app
- Working with Supabase (setup, database changes, queries)
- Creating new screens with Expo Router
- Styling guidelines (Headspace design system)
- React Query patterns (queries, mutations, optimistic updates)
- Common mistakes to avoid
- Testing checklist
- Debugging tips
- Performance optimization
- Deployment process

### `/system/ARCHITECTURE.md`
Complete technical architecture including:
- Project structure and file organization
- Tech stack details and dependencies
- Design system (theme, typography, spacing)
- Data flow diagrams
- Authentication flows (signup, login, logout, onboarding)
- Location-based feed flow
- Supabase configuration
- Performance and security considerations

### `/tasks/SUPABASE_DATABASE_SETUP.md`
Comprehensive backend setup plan including:
- **Authentication System:** Login, Signup, Onboarding screens with Headspace styling
- **Supabase Auth:** Email/password (no verification), auto-profile creation trigger
- **Auth Utilities:** Supabase client, useAuth hook, root layout routing
- **Database Schema:** All 8 tables (users, posts, votes_posts, comments, votes_comments, follows, chats, messages)
- **Row-Level Security (RLS):** Policies for all tables
- **Database Indexes:** Performance optimization for location queries
- **Helper Functions:** Distance calculation (Haversine), vote handling
- **Realtime Configuration:** Live updates for posts, messages, comments
- **Sample Data:** Test data for development
- **6-Phase Implementation Plan:** Dependencies → Auth → Schema → Functions → RLS → Frontend → Realtime

### Current Files Reference
- **Tab Navigation:** `src/app/(tabs)/_layout.jsx`
- **Feed Screen:** `src/app/(tabs)/home.jsx` (location-based posts, voting UI)
- **Profile Screen:** `src/app/(tabs)/profile.jsx` (anonymous toggle, settings)
- **Messages Screen:** `src/app/(tabs)/messages.jsx` (placeholder)
- **Theme System:** `src/utils/theme.js` (light/dark mode, color palette)
- **Components:** `src/components/*.jsx` (AppBackground, EmptyState, MenuItem)
- **Environment:** `.env` (Supabase URL and anon key configured)
- **Design Guidelines:** `.agent/styling.md` (Headspace-inspired design system)

2️⃣ Core User Stories
🧍 User Accounts

Users sign up with email (preferably university .ac.jp for authenticity).

Users can set a nickname or stay anonymous.

Users can follow/unfollow other users.

Anonymous users have no visible username but still have internal user IDs.

📍 Feed (Main Page)

Shows posts based on user’s current location (radius filter: e.g., 2km, 5km, 10km).

Toggle tabs on top:

Popular (sorted by upvotes, weighted by recency)

New (sorted by creation time)

Each post shows:

Text content

Distance or university name (not exact location)

Upvote/downvote buttons

Number of comments

Time since posted

Users can:

Create a new post (text only for MVP).

Upvote/downvote posts (like Reddit).

Tap to open post details and comment.

💬 Comments

Each post has a comment thread.

Users can comment and upvote/downvote comments too.

Comments show:

Text, time, and vote count

Anonymous / nickname label

✉️ Chat

Users can message anyone they follow (no group chats yet).

Chat is real-time, 1-on-1 only.

Features:

Message list (recent chats with last message preview).

Chat screen with message bubbles.

“Typing…” indicator optional (v2).

Offline support with local caching (React Query + AsyncStorage).

Message flow:

Insert into Supabase messages table.

Realtime subscription pushes updates to recipient.

If offline, send push notification via Edge Function.

🙋 Profile

Profile has:

Nickname / Anonymous toggle

Bio (optional)

Follow/follower count

Posts made

Settings:

Switch anonymous mode

Sign out

Distance radius preferences

3️⃣ Database Design (Supabase)
Tables

users

column	type	note
id	uuid	PK
email	text	unique
nickname	text	nullable
is_anonymous	boolean	default true
created_at	timestamp	

posts

column	type	note
id	bigserial	PK
user_id	uuid	FK → users
content	text	
latitude	float	
longitude	float	
created_at	timestamp	
score	int	cached upvote total

votes_posts

column	type	note
id	bigserial	PK
user_id	uuid	
post_id	bigint	
vote_type	int	+1 / -1

comments

column	type	note
id	bigserial	PK
post_id	bigint	FK → posts
user_id	uuid	FK → users
content	text	
created_at	timestamp	

votes_comments
| id | bigserial | PK |
| user_id | uuid | |
| comment_id | bigint | |
| vote_type | int | +1 / -1 |

follows
| follower_id | uuid | |
| following_id | uuid | |
| created_at | timestamp | |

chats
| id | bigserial | PK |
| user1_id | uuid | |
| user2_id | uuid | |
| created_at | timestamp | |

messages
| id | bigserial | PK |
| chat_id | bigint | FK → chats |
| sender_id | uuid | FK → users |
| content | text | |
| created_at | timestamp | |

4️⃣ Realtime System Design
Feed

Realtime updates on posts table for new posts within user’s radius.

Upvote/downvote recalculates score.

Feed cache updated automatically using React Query + Supabase subscription.

Chat

Each chat subscribes to a messages channel:
supabase.channel('chat:1234').on('INSERT', ...)

Caching:

Messages cached locally in AsyncStorage for offline reading.

When user reconnects, sync missing messages.

Push Notifications

When new message inserted:

Supabase Edge Function triggers Expo push to recipient if offline.

5️⃣ Caching Strategy
Feature	Cache Type	Notes
Feed	React Query cache + AsyncStorage	Fast reload
Chats	AsyncStorage (last 50 msgs per chat)	Offline support
Profiles	Cached 24h	Faster loading
Votes	Instant UI update; sync in background	Optimistic UI
6️⃣ Security / Permissions (RLS)

Only authors can edit/delete their posts or comments.

Only chat participants can read/write messages.

Anonymous posts hide user_id in frontend display, but backend still tracks it.

Supabase Row-Level Security (RLS) for all user-specific data.

7️⃣ Metrics / Success Criteria

DAU / MAU ratio (daily active users)

Average posts per user per week

Average chat messages per user

Retention (7-day, 30-day)

Average upvotes per post

8️⃣ Future Enhancements (v2 Ideas)

University-only feed (verified .ac.jp users).

Mutual interest “confession” feature.

Media uploads (images, short clips).

Group chats.

AI moderation for toxicity.

In-app events / trending topics.