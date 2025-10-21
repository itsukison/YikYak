# Development Workflow - Standard Operating Procedures

## Common Development Tasks

### Starting Development

1. **Install Dependencies**
   ```bash
   cd apps/mobile
   npm install
   ```

2. **Start Expo Dev Server**
   ```bash
   npx expo start
   ```

3. **Run on Platform**
   - iOS: Press `i` in terminal (requires Xcode)
   - Android: Press `a` in terminal (requires Android Studio)
   - Web: Press `w` in terminal

---

## Working with Supabase

### Initial Setup

1. **Install Supabase Client**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Configure Environment Variables**
   - Update `.env` with Supabase credentials
   - Use `EXPO_PUBLIC_` prefix for client-side access
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Access in Code**
   ```javascript
   const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
   const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
   ```

### Database Changes

1. **Via Supabase Dashboard**
   - Navigate to SQL Editor
   - Write SQL migration
   - Execute and test
   - Save migration for version control

2. **Via Supabase CLI** (Advanced)
   ```bash
   supabase migration new migration_name
   # Edit migration file
   supabase db push
   ```

3. **Testing Queries**
   - Use Supabase SQL Editor
   - Test with sample data
   - Verify RLS policies work correctly

---

## Creating New Screens

### File-Based Routing (Expo Router)

1. **Create Screen File**
   ```bash
   # For tab screen
   touch src/app/(tabs)/new-screen.jsx
   
   # For modal/standalone screen
   touch src/app/new-screen.jsx
   ```

2. **Basic Screen Template**
   ```javascript
   import React from 'react';
   import { View, Text } from 'react-native';
   import { useSafeAreaInsets } from 'react-native-safe-area-context';
   import { StatusBar } from 'expo-status-bar';
   import { useTheme } from '../../utils/theme';
   import AppBackground from '../../components/AppBackground';
   
   export default function NewScreen() {
     const insets = useSafeAreaInsets();
     const { colors, isDark } = useTheme();
     
     return (
       <AppBackground>
         <StatusBar style={isDark ? 'light' : 'dark'} />
         <View style={{ flex: 1, paddingTop: insets.top }}>
           <Text style={{ color: colors.text }}>New Screen</Text>
         </View>
       </AppBackground>
     );
   }
   ```

3. **Add to Tab Navigation** (if needed)
   - Edit `src/app/(tabs)/_layout.jsx`
   - Add new `<Tabs.Screen>` component

---

## Styling Guidelines

### Follow Headspace Design System

**Colors** (from `src/utils/theme.js`)
```javascript
primary: '#FFCC00'      // Bright yellow for CTAs
accent: '#FF9B42'       // Orange for highlights
background: '#FFF9F3'   // Soft beige/cream
surface: '#FFFFFF'      // Card backgrounds
text: '#1C1C1E'         // Primary text
textSecondary: '#8E8E93' // Secondary text
```

**Typography**
- Headings: `Poppins_600SemiBold`, 22-28px
- Body: `Poppins_400Regular`, 14-16px
- Labels: `Poppins_500Medium`, 12-14px

**Spacing & Borders**
- Card padding: 16-24px
- Screen margins: 16px
- Border radius: 20px (cards), 22px (buttons)
- Icon size: 16-24px

**Component Patterns**
```javascript
// Card
<View style={{
  backgroundColor: colors.surface,
  borderRadius: 20,
  padding: 16,
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
}}>
  {/* Content */}
</View>

// Button
<TouchableOpacity style={{
  backgroundColor: colors.primary,
  borderRadius: 22,
  paddingVertical: 12,
  paddingHorizontal: 24,
  alignItems: 'center',
}}>
  <Text style={{
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  }}>
    Button Text
  </Text>
</TouchableOpacity>
```

---

## Working with React Query

### Setup (Pending Implementation)

1. **Install Dependencies**
   ```bash
   npm install @tanstack/react-query
   ```

2. **Create Query Client**
   ```javascript
   // src/utils/queryClient.js
   import { QueryClient } from '@tanstack/react-query';
   
   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 minutes
         cacheTime: 10 * 60 * 1000, // 10 minutes
       },
     },
   });
   ```

3. **Wrap App with Provider**
   ```javascript
   // src/app/_layout.jsx
   import { QueryClientProvider } from '@tanstack/react-query';
   import { queryClient } from '../utils/queryClient';
   
   export default function RootLayout() {
     return (
       <QueryClientProvider client={queryClient}>
         {/* App content */}
       </QueryClientProvider>
     );
   }
   ```

### Common Query Patterns

**Fetch Posts**
```javascript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';

function usePosts(latitude, longitude, radius) {
  return useQuery({
    queryKey: ['posts', latitude, longitude, radius],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_posts_within_radius', {
          user_lat: latitude,
          user_lon: longitude,
          radius_meters: radius,
        });
      
      if (error) throw error;
      return data;
    },
  });
}
```

**Optimistic Updates (Voting)**
```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useVote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, voteType }) => {
      const { error } = await supabase
        .rpc('handle_post_vote', {
          p_post_id: postId,
          p_vote_type: voteType,
        });
      
      if (error) throw error;
    },
    onMutate: async ({ postId, voteType }) => {
      // Optimistic update
      await queryClient.cancelQueries(['posts']);
      
      const previousPosts = queryClient.getQueryData(['posts']);
      
      queryClient.setQueryData(['posts'], (old) =>
        old.map((post) =>
          post.id === postId
            ? { ...post, score: post.score + voteType }
            : post
        )
      );
      
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // Revert on error
      queryClient.setQueryData(['posts'], context.previousPosts);
    },
  });
}
```

---

## Common Mistakes to Avoid

### 1. Environment Variables
❌ **Wrong:** `process.env.SUPABASE_URL`
✅ **Correct:** `process.env.EXPO_PUBLIC_SUPABASE_URL`

Expo requires `EXPO_PUBLIC_` prefix for client-side access.

### 2. Auth Session Check
❌ **Wrong:** Checking session on every screen
✅ **Correct:** Check once in root layout, use context/hook

### 3. RLS Policies
❌ **Wrong:** Forgetting to enable RLS on tables
✅ **Correct:** Always enable RLS and test with different users

### 4. Location Permissions
❌ **Wrong:** Assuming permission is granted
✅ **Correct:** Always request and handle denial gracefully

### 5. Realtime Subscriptions
❌ **Wrong:** Not unsubscribing on unmount
✅ **Correct:** Always clean up subscriptions in useEffect

```javascript
useEffect(() => {
  const subscription = supabase
    .channel('posts')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, handleNewPost)
    .subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### 6. Optimistic Updates
❌ **Wrong:** Not reverting on error
✅ **Correct:** Always implement error rollback

### 7. Anonymous Mode
❌ **Wrong:** Hiding user_id in database queries
✅ **Correct:** Hide in frontend display only, track in backend

---

## Testing Checklist

### Before Committing

- [ ] Code runs without errors
- [ ] No console warnings
- [ ] Tested on iOS (if available)
- [ ] Tested on Android (if available)
- [ ] Tested on Web
- [ ] Dark mode works correctly
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Offline behavior considered

### Auth Testing

- [ ] Signup flow works
- [ ] Login flow works
- [ ] Logout flow works
- [ ] Session persists on app restart
- [ ] Onboarding skippable/completable
- [ ] Invalid credentials show error

### Database Testing

- [ ] RLS policies prevent unauthorized access
- [ ] Queries return expected data
- [ ] Mutations update correctly
- [ ] Triggers fire as expected
- [ ] Indexes improve query performance

---

## Debugging Tips

### Supabase Issues

1. **Check Supabase Logs**
   - Dashboard → Logs → API Logs
   - Look for 401/403 errors (RLS issues)

2. **Test RLS Policies**
   ```sql
   -- In Supabase SQL Editor
   SET LOCAL ROLE authenticated;
   SET LOCAL request.jwt.claims.sub TO 'user-uuid';
   SELECT * FROM posts; -- Test as specific user
   ```

3. **Verify Environment Variables**
   ```javascript
   console.log('URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
   console.log('Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10));
   ```

### React Native Issues

1. **Clear Cache**
   ```bash
   npx expo start -c
   ```

2. **Reinstall Dependencies**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Check Metro Bundler**
   - Look for red error screens
   - Check terminal for bundler errors

---

## Performance Optimization

### Database

1. **Use Indexes**
   - Location queries: GIST index
   - Sorting: B-tree indexes
   - Foreign keys: Automatic indexes

2. **Limit Query Results**
   ```javascript
   .limit(20) // Pagination
   ```

3. **Use RPC Functions**
   - Complex queries in database
   - Reduce network round trips

### Frontend

1. **Memoize Components**
   ```javascript
   const PostCard = React.memo(({ post }) => {
     // Component code
   });
   ```

2. **Virtualize Long Lists**
   ```javascript
   import { FlashList } from '@shopify/flash-list';
   ```

3. **Optimize Images**
   ```javascript
   import { Image } from 'expo-image';
   // Uses native caching
   ```

---

## Deployment

### Mobile (EAS Build)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**
   ```bash
   eas build:configure
   ```

3. **Build for iOS**
   ```bash
   eas build --platform ios
   ```

4. **Build for Android**
   ```bash
   eas build --platform android
   ```

### Web

1. **Export Static Site**
   ```bash
   npx expo export:web
   ```

2. **Deploy to Vercel/Netlify**
   - Connect GitHub repo
   - Set build command: `npx expo export:web`
   - Set output directory: `web-build`

---

## Resources

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [React Native Docs](https://reactnative.dev/)
- [Expo Location Docs](https://docs.expo.dev/versions/latest/sdk/location/)
