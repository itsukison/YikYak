# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HearSay is a location-based social media mobile application built with React Native and Expo. It's a Hearsay app that allows users to create anonymous posts and chat with people nearby. The backend uses Supabase for database, authentication, realtime subscriptions, and edge functions.

## Development Commands

### Running the App
```bash
# Start Expo development server
npx expo start

# Run on specific platforms
npx expo run:ios
npx expo run:android
npx expo run:web

# Run with tunnel (useful for testing on physical devices)
npm run tunnel
npm run tunnel:web
```

### Supabase
```bash
# Apply database migrations
supabase db push

# Generate TypeScript types from database schema
supabase gen types typescript --local > src/types/supabase.ts

# View Supabase dashboard
supabase status
```

### EAS Build & Deploy
```bash
# Development build
eas build --profile development --platform ios

# Preview build (internal distribution)
eas build --profile preview --platform ios

# Production build
eas build --profile production --platform ios

# Push OTA update to a channel
eas update --channel preview --message "Your update message"
eas update --channel production --message "Your update message"
```

### Package Management
```bash
# Install dependencies (runs patch-package automatically via postinstall)
npm install

# Install Expo-compatible package version
npx expo install <package-name>
```

## Architecture

### Tech Stack
- **Frontend**: React Native 0.81.5, React 19.1.0, Expo ~54
- **Navigation**: Expo Router (file-based routing with typed routes)
- **State Management**: Zustand (auth state) + React Query (server state)
- **Backend**: Supabase (PostgreSQL + Realtime + Auth + Edge Functions)
- **Data Fetching**: TanStack Query v5 with AsyncStorage persistence
- **Styling**: GlueStack UI + custom theme system
- **Location**: Geohash-based proximity searches (precision 6)

### App Structure

```
src/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (tabs)/            # Tab navigation group
│   │   ├── home.jsx       # Main feed
│   │   ├── messages.jsx   # Chat list
│   │   ├── notification.jsx
│   │   └── profile.jsx
│   ├── chat/[id].jsx      # Chat detail screen
│   ├── post/[id].jsx      # Post detail screen
│   ├── user/[id].jsx      # User profile screen
│   ├── compose.jsx        # Create post
│   ├── login.jsx
│   ├── signup.jsx
│   ├── onboarding.jsx
│   └── _layout.jsx        # Root layout with auth routing
│
├── services/              # Business logic & data layer
│   ├── auth/             # Authentication (Zustand store + hooks)
│   ├── posts/            # Post queries & mutations
│   ├── chat/             # Chat with offline-first architecture
│   ├── comments/         # Comment queries & mutations
│   ├── user/             # User profile & follows
│   ├── notifications/    # Push notifications & in-app
│   ├── presence/         # User online/offline status
│   ├── storage/          # AsyncStorage abstraction
│   ├── moderation/       # Content filtering & image moderation
│   ├── location/         # Location & geohash utilities
│   └── realtime.js       # Supabase realtime subscriptions
│
├── ui/
│   ├── components/       # Reusable UI components
│   │   └── ui/          # Base UI components (Button, Card, etc.)
│   └── hooks/           # UI-specific hooks
│
├── adapters/
│   └── supabaseClient.js # Supabase client singleton
│
├── config/
│   ├── reactQuery.js    # React Query configuration
│   └── theme.js         # App theme & colors
│
└── hooks/               # Cross-cutting hooks
    ├── useSmartLocation.js
    └── useNetworkStatus.js
```

### Key Architectural Patterns

#### 1. **Authentication & Authorization**
- Zustand store (`src/services/auth/store.js`) manages auth state globally
- `useAuth()` hook provides auth methods and subscribes to auth changes
- Protected routes handled in `_layout.jsx` with automatic redirects:
  - Unauthenticated → `/login`
  - Authenticated but incomplete onboarding → `/onboarding`
  - Fully authenticated → `/(tabs)/home`
- Row Level Security (RLS) enforced at database level for all tables

#### 2. **Data Fetching Strategy**
- React Query for all server state with AsyncStorage persistence
- Query keys follow pattern: `[resource, ...identifiers, ...filters]`
  - Example: `["posts", latitude, longitude, radius, sortBy, timeFilter]`
- Infinite scroll implemented with `useInfiniteQuery` + cursor-based pagination
- Optimistic updates for likes, votes, and user interactions
- Offline-first for chat messages (local AsyncStorage → background sync)

#### 3. **Location-Based Features**
- Posts use PostGIS geography column + geohash for proximity search
- Geohash precision 6 (~1.2km x 0.6km cells)
- Realtime subscriptions use geohash to reduce channel count:
  - Center cell + 4 cardinal neighbors (5 channels total)
  - Client-side distance filtering with Haversine formula
- Feed uses optimized RPC: `get_feed_v2(user_lat, user_lon, radius_meters, sort_by, time_filter, limit_count, cursor_post_id, cursor_value)`

#### 4. **Chat System**
- **Local-first architecture** for instant message display:
  1. Messages load immediately from AsyncStorage
  2. Background fetch from Supabase (last 30 days only)
  3. Merge and deduplicate by message ID
- **Offline queue** for pending messages (`src/services/chat/offlineQueue.js`)
  - Temporary IDs for optimistic rendering
  - Automatic retry with exponential backoff
  - Sync on network reconnection
- **Realtime sync** via `subscribeToMessages()` for new messages
- **Message routing** (`messageRouter.js`) handles incoming messages from different sources

#### 5. **Performance Optimizations**
- React Query cache persisted to AsyncStorage (survives app restarts)
- Image compression before upload (`src/services/storage/imageCompression.js`)
- Uploadcare for CDN-backed image hosting
- Lazy loading for images with `expo-image`
- Metrics tracking (`src/services/monitoring/`) for database costs and latency
- Geohash-based spatial indexing reduces database load

#### 6. **Realtime Features**
- Supabase Realtime channels for:
  - New posts (geohash-based, 5 channels per user location)
  - Chat messages (per chat ID)
  - Notifications (per user ID)
- Connection state tracking with automatic reconnection
- Exponential backoff for failed subscriptions

#### 7. **Content Moderation**
- Bad words filter (`bad-words` package) for posts and messages
- Image moderation placeholders (`src/services/moderation/imageModeration.js`)
- Report system with database triggers

### Database Schema Key Points

Main tables:
- `users` - User profiles with location_radius, school affiliation, onboarding status
- `posts` - Posts with geography column, geohash_6 index, score (vote count), comment_count
- `comments` - Nested comments on posts
- `votes_posts`, `votes_comments` - Voting system (upvote/downvote)
- `post_photos` - Multiple photos per post
- `chats`, `messages` - Private messaging
- `notifications` - In-app notifications
- `follows` - User following relationships
- `blocks` - User blocking system
- `reports` - Content reporting

Key RPC functions:
- `get_feed_v2()` - Optimized feed with distance filtering, voting, and pagination
- `handle_post_vote()` - Atomic vote upsert/delete with score recalculation
- `get_block_status()` - Check if users have blocked each other
- `unblock_user()` - Remove block relationship

Database triggers:
- Auto-update `score` on `votes_posts` insert/delete
- Auto-update `comment_count` on `comments` insert/delete
- Auto-update `updated_at` timestamps

### Environment Variables

Required in `.env`:
```bash
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

## Common Development Patterns

### Creating a New Feature with Data
1. Add database migration in `supabase/migrations/`
2. Create service hook in `src/services/<feature>/`
   - Use React Query for queries: `useQuery`, `useInfiniteQuery`
   - Use mutations with optimistic updates: `useMutation`
3. Create UI component in `src/ui/components/`
4. Add screen in `src/app/` (file becomes route automatically)
5. Update types if using TypeScript

### Adding a New Screen
1. Create file in `src/app/` - filename determines route
   - `foo.jsx` → `/foo`
   - `foo/[id].jsx` → `/foo/:id` (dynamic param)
   - `(group)/foo.jsx` → `/foo` (grouped, no route segment)
2. Use `useLocalSearchParams()` to access route params
3. Use `router.push()`, `router.replace()`, or `<Link>` for navigation

### Working with Realtime
1. Use existing subscriptions in `src/services/realtime.js`:
   - `subscribeToNewPosts(lat, lon, radius, callback)`
   - `subscribeToMessages(chatId, callback)`
   - `subscribeToNotifications(userId, callback)`
2. Always return cleanup function to unsubscribe
3. Use React Query invalidation to update cache on realtime events

### Optimistic Updates Pattern
```javascript
const mutation = useMutation({
  mutationFn: async (data) => { /* ... */ },
  onMutate: async (newData) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['resource'] })

    // Snapshot previous value
    const previous = queryClient.getQueryData(['resource'])

    // Optimistically update
    queryClient.setQueryData(['resource'], (old) => {
      // Update logic
    })

    return { previous }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['resource'], context.previous)
  },
  onSettled: () => {
    // Refetch to ensure sync
    queryClient.invalidateQueries({ queryKey: ['resource'] })
  }
})
```

### Database Migrations
- Migrations in `supabase/migrations/` use timestamp prefix: `YYYYMMDD_description.sql`
- Always include RLS policies for new tables
- Add indexes for geography/geohash columns and foreign keys
- Use `SECURITY DEFINER` for RPC functions that need elevated permissions
- Test migrations locally before deploying: `supabase db reset`

## Important Notes

- **Expo Router** uses file-based routing - file structure in `src/app/` determines routes
- **Typed routes** enabled - TypeScript knows about all routes
- **New Architecture** enabled (`newArchEnabled: true`) for better performance
- **Patch Package** used for npm package patches - run automatically on `npm install`
- **iOS uses static frameworks** (`useFrameworks: "static"`) - required for some dependencies
- **AsyncStorage** used for cache persistence and local-first chat
- **Deep linking** configured with scheme `HearSay://` for email verification callbacks
- All timestamps use ISO 8601 format from Supabase
- Distance calculations use Haversine formula (Earth radius = 6,371,000 meters)
- User avatars stored in Supabase Storage bucket: `avatars/`
- Post photos stored in Uploadcare CDN

## Testing Locally

1. Ensure Supabase is running or using remote instance
2. Check `.env` has correct `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Run `npm start` and scan QR code with Expo Go, or
4. Run `npm run ios` / `npm run android` for native builds
5. For location testing, use iOS Simulator's location simulation or Android emulator location settings

## Deployment

- Use EAS (Expo Application Services) for builds
- Channels: `development`, `preview`, `production`
- OTA updates pushed via `eas update --channel <channel>`
- iOS bundle identifier: `com.itsukison.HearSayjapan`
- Android package: `xyz.create.CreateExpoEnvironment`
