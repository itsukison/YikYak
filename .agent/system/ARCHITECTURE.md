# System Architecture

## Project Structure

```
apps/mobile/
├── .agent/                    # Agent documentation
│   ├── README.md             # Product requirements & status
│   ├── rule.md               # Agent workflow rules
│   ├── styling.md            # Design system guidelines
│   ├── system/               # Technical architecture docs
│   │   └── ARCHITECTURE.md   # This file
│   └── tasks/                # Feature implementation tracking
│       └── SUPABASE_DATABASE_SETUP.md
│
├── src/
│   ├── app/                  # Expo Router screens
│   │   ├── (tabs)/          # Tab navigation screens (authenticated)
│   │   │   ├── _layout.jsx  # Tab bar configuration
│   │   │   ├── home.jsx     # Feed screen
│   │   │   ├── messages.jsx # DM screen
│   │   │   ├── notification.jsx
│   │   │   └── profile.jsx  # User profile
│   │   ├── _layout.jsx      # Root layout (auth routing)
│   │   ├── index.jsx        # Entry point
│   │   ├── login.jsx        # Login screen (pending)
│   │   ├── signup.jsx       # Signup screen (pending)
│   │   ├── onboarding.jsx   # Profile setup (pending)
│   │   └── create-post.jsx  # Post creation
│   │
│   ├── components/          # Reusable UI components
│   │   ├── AppBackground.jsx
│   │   ├── EmptyState.jsx
│   │   ├── MenuItem.jsx
│   │   └── KeyboardAvoidingAnimatedView.jsx
│   │
│   └── utils/               # Utilities & hooks
│       ├── theme.js         # Theme system (colors, dark mode)
│       ├── supabase.js      # Supabase client (pending)
│       ├── auth/            # Auth utilities (pending)
│       │   └── useAuth.js   # Auth hook (pending)
│       └── *.js             # Custom hooks
│
├── assets/                  # Images, fonts, icons
├── polyfills/              # Web polyfills
├── .env                    # Supabase credentials
├── app.json                # Expo configuration
└── package.json            # Dependencies
```

---

## Tech Stack

### Frontend
- **Framework:** React Native 0.79.3 with React 19.0.0
- **Navigation:** Expo Router 5.1.0 (file-based routing)
- **UI Library:** Custom components with Lucide icons
- **Styling:** Inline styles with theme system
- **Fonts:** Poppins (Google Fonts via @expo-google-fonts)
- **State Management:** Zustand 5.0.3 (not yet implemented)
- **Data Fetching:** @tanstack/react-query 5.72.2 (not yet implemented)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Realtime:** Supabase Realtime subscriptions
- **Storage:** Supabase Storage (future: image uploads)

### Platform Support
- **iOS:** Native support via Expo
- **Android:** Native support via Expo
- **Web:** React Native Web 0.20.0

### Key Dependencies
- **Location:** expo-location 18.1.4
- **Maps:** react-native-maps 1.20.1
- **Notifications:** expo-notifications 0.31.3
- **Local Storage:** @react-native-async-storage/async-storage 2.1.2
- **Animations:** moti 0.30.0, react-native-reanimated 3.17.4
- **Toast:** sonner-native 0.21.0

---

## Design System

### Theme Structure (`src/utils/theme.js`)

```javascript
const lightTheme = {
  background: '#FFF9F3',      // Soft beige/cream
  surface: '#FFFFFF',         // Card backgrounds
  primary: '#FFCC00',         // Bright yellow (CTA)
  primarySubtle: '#FFF4CC',   // Light yellow
  accent: '#FF9B42',          // Orange
  text: '#1C1C1E',           // Primary text
  textSecondary: '#8E8E93',  // Secondary text
  textTertiary: '#AEAEB2',   // Tertiary text
  border: '#F2F2F7',         // Dividers
  inputBackground: '#F2F2F7',
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#F2F2F7',
  tabBarActive: '#FFCC00',
  tabBarInactive: '#8E8E93',
  error: '#FF3B30',
  shadow: '#000000'
};
```

### Typography
- **Headings:** Poppins_600SemiBold (22-28px)
- **Body:** Poppins_400Regular (14-16px)
- **Labels:** Poppins_500Medium (12-14px)

### Spacing
- **Card padding:** 16-24px
- **Screen margins:** 16px
- **Border radius:** 20px (cards), 22px (buttons)

### Components
- **Cards:** Rounded (20px), subtle shadow, white background
- **Buttons:** Rounded (20-22px), primary color, 44px height
- **Icons:** Lucide React Native, 16-24px, strokeWidth 1.5-2

---

## Data Flow

### Current (Mock Data)
```
UI Component → Local State → Render
```

### Target (Supabase Integration)
```
UI Component → React Query → Supabase Client → PostgreSQL
                    ↓
              AsyncStorage (offline cache)
                    ↓
              Realtime Subscription (live updates)
```

---

## Authentication Flow

### Initial App Launch
```
1. User opens app
   ↓
2. Root layout (_layout.jsx) checks for Supabase session
   ↓
3. useAuth() hook retrieves session from AsyncStorage
   ↓
4. If session exists → Navigate to /(tabs)/home
   ↓
5. If no session → Navigate to /login
```

### Signup Flow
```
1. User on /login taps "Sign Up"
   ↓
2. Navigate to /signup
   ↓
3. User enters email + password (+ confirm password)
   ↓
4. Call supabase.auth.signUp({ email, password })
   ↓
5. Supabase creates auth.users record
   ↓
6. Trigger auto-creates public.users profile (onboarding_completed: false)
   ↓
7. Session stored in AsyncStorage
   ↓
8. Navigate to /onboarding
   ↓
9. User sets nickname, bio, anonymous mode
   ↓
10. Update public.users (onboarding_completed: true)
   ↓
11. Navigate to /(tabs)/home
```

### Login Flow
```
1. User on /login enters email + password
   ↓
2. Call supabase.auth.signInWithPassword({ email, password })
   ↓
3. Supabase validates credentials
   ↓
4. Session stored in AsyncStorage
   ↓
5. Check if onboarding_completed
   ↓
6. If false → Navigate to /onboarding
   ↓
7. If true → Navigate to /(tabs)/home
```

### Logout Flow
```
1. User taps "Sign Out" in profile
   ↓
2. Call supabase.auth.signOut()
   ↓
3. Clear session from AsyncStorage
   ↓
4. Navigate to /login
```

---

## Location-Based Feed Flow

```
1. User opens Feed screen
   ↓
2. Request location permission
   ↓
3. Get current coordinates (lat, lon)
   ↓
4. Call Supabase function: get_posts_within_radius(lat, lon, radius)
   ↓
5. Supabase calculates distances using Haversine formula
   ↓
6. Returns posts within radius, sorted by "new" or "popular"
   ↓
7. React Query caches results
   ↓
8. UI renders posts with distance display
   ↓
9. Subscribe to realtime updates for new posts
```

---

## Vote System Flow

```
1. User taps upvote/downvote
   ↓
2. Optimistic UI update (instant feedback)
   ↓
3. Call Supabase function: handle_post_vote(user_id, post_id, vote_type)
   ↓
4. Function upserts vote in votes_posts table
   ↓
5. Trigger recalculates post.score
   ↓
6. If success → Keep optimistic update
   ↓
7. If error → Revert optimistic update
```

---

## Chat System Flow (Planned)

```
1. User follows another user
   ↓
2. User taps "Message" on profile
   ↓
3. Check if chat exists between user1_id and user2_id
   ↓
4. If not, create chat record
   ↓
5. Navigate to chat screen
   ↓
6. Subscribe to realtime messages for chat_id
   ↓
7. User types message → Insert into messages table
   ↓
8. Realtime subscription pushes to recipient
   ↓
9. If recipient offline → Send push notification
```

---

## Supabase Configuration

### Environment Variables (`.env`)
```
SUPABASE_URL=https://chdbatqskxvlieipnfsl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Auth Configuration
**Provider:** Email/Password (no email verification)
**Session Storage:** AsyncStorage (React Native)
**Auto-refresh:** Enabled
**Persist Session:** Enabled

### Client Initialization (Pending)
```javascript
// src/utils/supabase.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Auth Hook (Pending)
```javascript
// src/utils/auth/useAuth.js
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading, signUp, signIn, signOut };
}
```

### Auth Screens (Pending - Headspace Styling)
- **Login:** `/login.jsx` - Email/password inputs, "Sign In" button, "Sign Up" link
- **Signup:** `/signup.jsx` - Email/password/confirm inputs, "Create Account" button
- **Onboarding:** `/onboarding.jsx` - Nickname/bio inputs, anonymous toggle, "Get Started" button

---

## Performance Considerations

### Database Indexes
- Location queries: GIST index on (latitude, longitude)
- Feed sorting: B-tree indexes on created_at, score
- User lookups: Unique indexes on email, nickname

### Caching Strategy
- **Feed posts:** Cache for 5 minutes, invalidate on new post
- **User profiles:** Cache for 24 hours
- **Messages:** Cache last 50 messages per chat
- **Votes:** Optimistic updates, sync in background

### Realtime Subscriptions
- Subscribe only to visible data (current feed radius)
- Unsubscribe when screen unmounts
- Throttle updates to prevent UI jank

---

## Security

### Row-Level Security (RLS)
- All tables have RLS enabled
- Users can only modify their own data
- Chat messages only visible to participants
- Anonymous mode hides user_id in frontend queries

### Input Validation
- Post content: Max 500 characters
- Comment content: Max 300 characters
- Message content: Max 1000 characters
- Email validation: .ac.jp domain check (optional)

### API Security
- All requests authenticated via Supabase JWT
- Rate limiting via Supabase (built-in)
- SQL injection prevented by parameterized queries

---

## Future Enhancements

### Phase 2 Features
- Image/video uploads (Supabase Storage)
- Push notifications (Expo Notifications + Supabase Edge Functions)
- University verification (.ac.jp email validation)
- Trending topics/hashtags
- User blocking/reporting
- AI moderation (toxic content detection)

### Phase 3 Features
- Group chats
- Events/meetups
- Polls
- University-specific feeds
- Gamification (karma points, badges)

---

## Development Workflow

### Local Development
1. Install dependencies: `npm install`
2. Start Expo dev server: `npx expo start`
3. Run on iOS: Press `i` in terminal
4. Run on Android: Press `a` in terminal
5. Run on Web: Press `w` in terminal

### Database Changes
1. Update schema in Supabase dashboard or via SQL
2. Test queries in Supabase SQL editor
3. Update TypeScript types (future)
4. Update React Query hooks
5. Test with sample data

### Deployment
- **Mobile:** EAS Build (Expo Application Services)
- **Web:** Static export via Expo Router
- **Backend:** Supabase (managed hosting)

---

## Monitoring & Analytics (Future)

- **Error Tracking:** Sentry
- **Analytics:** Supabase Analytics + Custom events
- **Performance:** React Native Performance Monitor
- **Logs:** Supabase Logs + CloudWatch

---

## References

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [React Native Docs](https://reactnative.dev/)
