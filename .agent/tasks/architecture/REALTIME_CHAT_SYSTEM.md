# Real-time Chat System Implementation

**Status**: ✅ COMPLETED  
**Date**: October 24, 2025

## Overview

Fixed the real-time chat functionality by addressing RLS policies, database constraints, and query issues. Added follower/following list screens with proper navigation from both own profile and other users' profiles.

## Issues Identified & Fixed

### 1. Chat Creation Fails (406, 400, and 23514 Errors) ✅

**Root Causes:**

- **406 Error**: `useCreateChatMutation` used `.single()` which threw 406 when no chat existed
- **400 Error**: Missing RLS INSERT policy on `chats` table prevented creation
- **23514 Error**: Database CHECK constraint `CHECK ((user1_id < user2_id))` requires user1_id to always be smaller than user2_id (UUID comparison), but code didn't sort UUIDs before insert

**Fixes Applied:**

- Updated query to use `.maybeSingle()` instead of `.single()`
- Added comprehensive RLS policies for `chats` and `messages` tables
- Added UUID sorting before insert: `const sortedIds = [user1Id, user2Id].sort()` to satisfy CHECK constraint

### 2. Notifications Display Behavior ✅

- **Investigation**: Notifications query fetches all notifications (both read and unread) for history
- **Current Behavior**: Visual distinction already present (border color, background opacity, bold text for unread)
- **Status**: Working as intended - notifications show history with clear visual indicators

### 3. Missing Follower/Following List Screens ✅

- **Need**: New screens to show lists of followers and following with navigation from profile
- **Status**: ✅ Implemented at `/user/followers/[id].jsx` and `/user/following/[id].jsx`

### 4. Own Profile Followers/Following Not Accessible ✅

- **Root Cause**: Follower/Following counts only made tappable on `/user/[id].jsx` (for viewing OTHER users), but not on the Profile tab for viewing own followers/following
- **Fix**: Made follower/following counts tappable on Profile tab (`/app/(tabs)/profile.jsx`)

## Implementation Details

### Phase 1: Database - RLS Policies ✅

**Migration**: `add_chat_rls_policies`

Created comprehensive RLS policies for `chats` and `messages` tables:

**Chats Table Policies:**

- `Users can view their own chats` - SELECT policy for chats where user is participant
- `Users can create chats` - INSERT policy allowing chat creation
- `Users can update their own chats` - UPDATE policy for timestamp updates

**Messages Table Policies:**

- `Users can view messages in their chats` - SELECT policy with chat membership check
- `Users can insert messages in their chats` - INSERT policy ensuring sender is participant
- `Users can update messages in their chats` - UPDATE policy for marking as read

### Phase 2: Frontend - Chat Query Fix ✅

**File**: `src/utils/queries/chats.js`

Updated `useCreateChatMutation`:

- Changed `.single()` to `.maybeSingle()` in existing chat check
- Added proper error handling for check query
- **Added UUID sorting to respect CHECK constraint**
- Maintains proper cache invalidation

**Critical Fix for CHECK Constraint:**

```javascript
// Ensure user1_id < user2_id to satisfy CHECK constraint
const sortedIds = [user1Id, user2Id].sort();
const [smallerId, largerId] = sortedIds;

const { data, error } = await supabase
  .from("chats")
  .insert({
    user1_id: smallerId,
    user2_id: largerId,
  })
  .select()
  .single();
```

This ensures the UUIDs are always inserted in ascending order, satisfying the database constraint `user1_id < user2_id`.

### Phase 3: Notification System Verification ✅

**File**: `src/app/(tabs)/notification.jsx`

**Current Behavior (Correct):**

- Fetches all notifications (read and unread) for history
- Visual distinction for unread items:
  - Left border color (primary color for unread, transparent for read)
  - Background opacity (lighter for unread)
  - Bold text for unread notifications
  - Dot indicator for unread status
- Cache invalidation working correctly

### Phase 4: Follower/Following Queries ✅

**File**: `src/utils/queries/follows.js`

**Already Existed:**

- `useFollowersQuery(userId)` - Get users following the target user
- `useFollowingQuery(userId)` - Get users the target user follows
- Both queries include full user details with proper data transformation

### Phase 5: Followers List Screen ✅

**File**: `src/app/user/followers/[id].jsx` (NEW)

**Features:**

- Displays list of users following the target user
- Shows user avatars (generated from first letter)
- Displays nickname or "Anonymous" for anonymous users
- Follow/Unfollow buttons for each user (except own profile)
- Real-time follow status updates
- Navigation to user profile on tap
- Empty state when no followers
- Proper loading states
- Optimistic UI updates

### Phase 6: Following List Screen ✅

**File**: `src/app/user/following/[id].jsx` (NEW)

**Features:**

- Displays list of users the target user follows
- Shows user avatars (generated from first letter)
- Displays nickname or "Anonymous" for anonymous users
- Follow/Unfollow buttons for each user (except own profile)
- Real-time follow status updates
- Navigation to user profile on tap
- Empty state when not following anyone
- Proper loading states
- Optimistic UI updates

### Phase 7: Profile Navigation - Other Users ✅

**File**: `src/app/user/[id].jsx`

**Changes:**

- Made "Followers" count tappable → navigates to `/user/followers/[id]`
- Made "Following" count tappable → navigates to `/user/following/[id]`
- Maintains existing styling and layout
- Passes user ID as route parameter

### Phase 8: Profile Navigation - Own Profile ✅

**File**: `src/app/(tabs)/profile.jsx`

**Changes:**

- Made "Followers" count tappable → navigates to `/user/followers/[user.id]`
- Made "Following" count tappable → navigates to `/user/following/[user.id]`
- Maintains existing styling and layout
- Users can now view their own followers/following lists

## File Structure

```
src/
├── app/
│   ├── (tabs)/
│   │   ├── messages.jsx          (existing - chat list)
│   │   ├── notification.jsx      (existing - verified working)
│   │   └── profile.jsx           (MODIFIED - added navigation)
│   ├── chat/
│   │   └── [id].jsx              (existing - chat detail)
│   └── user/
│       ├── [id].jsx              (MODIFIED - added navigation)
│       ├── followers/
│       │   └── [id].jsx          (NEW - followers list)
│       └── following/
│           └── [id].jsx          (NEW - following list)
└── utils/
    └── queries/
        ├── chats.js              (MODIFIED - fixed constraint + .single())
        ├── follows.js            (existing - queries already present)
        └── notifications.js      (existing - verified working)
```

## Database Schema Notes

### Chats Table Constraints

The `chats` table has important constraints that must be respected:

1. **CHECK Constraint**: `CHECK ((user1_id < user2_id))`

   - Ensures `user1_id` is always less than `user2_id` (UUID comparison)
   - Prevents duplicate chats and ensures consistent ordering
   - **Must sort UUIDs before insert**

2. **UNIQUE Constraint**: `UNIQUE (user1_id, user2_id)`

   - Prevents duplicate chat entries
   - Works in conjunction with CHECK constraint

3. **Foreign Keys**: Both `user1_id` and `user2_id` reference `users(id)` with CASCADE DELETE

## Testing Checklist

### Chat Functionality ✅

- ✅ Message button creates chat successfully
- ✅ Message button opens existing chat if present
- ✅ Respects CHECK constraint (user1_id < user2_id)
- ✅ Real-time message sending works
- ✅ Real-time message receiving works
- ✅ Message read status updates
- ✅ Chat list shows unread counts
- ✅ RLS policies prevent unauthorized access

### Notification System ✅

- ✅ Notifications display with read/unread distinction
- ✅ Marking as read updates UI immediately
- ✅ Cache invalidation works correctly
- ✅ Real-time notification updates work
- ✅ "Mark all read" functionality works

### Follower/Following Lists ✅

- ✅ Followers list displays correctly
- ✅ Following list displays correctly
- ✅ Navigation from other user's profile stats works
- ✅ Navigation from own profile tab stats works
- ✅ Follow/unfollow buttons work in lists
- ✅ Navigation to user profiles works
- ✅ Empty states display correctly
- ✅ Loading states work properly
- ✅ Anonymous users display correctly

## Expected User Flow

### Starting a Chat

1. User navigates to another user's profile
2. User clicks message button (MessageCircle icon)
3. System checks for existing chat:
   - If exists → navigates to chat detail screen
   - If not → creates new chat (with sorted UUIDs) → navigates to chat detail screen
4. User can send/receive messages in real-time
5. Messages appear in chat list with unread count

### Viewing Own Followers/Following

1. User is on Profile tab
2. User taps "Followers" or "Following" count
3. System navigates to `/user/followers/[own-id]` or `/user/following/[own-id]`
4. User sees their own followers/following list
5. Can follow/unfollow users from the list
6. Can tap users to view their profiles

### Viewing Others' Followers/Following

1. User navigates to another user's profile (`/user/[id]`)
2. User taps "Followers" or "Following" count
3. System navigates to respective list screen
4. User sees list of that user's followers/following
5. Can follow/unfollow users from the list
6. Can tap users to view their profiles

## Security

All RLS policies ensure:

- Users can only view chats they're part of
- Users can only send messages in their own chats
- Users can only update messages in chats they're part of
- No unauthorized access to chat data
- Proper authentication checks via `auth.uid()`

## Performance Considerations

- Queries use proper indexes (existing foreign keys)
- Real-time subscriptions scoped to specific chats/users
- Query invalidation is targeted (not global)
- List screens use FlatList for efficient rendering
- Lazy loading of follow status per user
- UUID sorting is efficient (native JavaScript sort)

## Known Limitations

None identified. System is fully functional.

## Technical Insights

### Why the CHECK Constraint Exists

The `CHECK ((user1_id < user2_id))` constraint serves multiple purposes:

1. **Prevents Duplicates**: Combined with UNIQUE constraint, ensures only one chat per user pair
2. **Consistent Ordering**: Always know which UUID is in which column
3. **Query Efficiency**: Simplifies lookups - don't need to check both orderings in some queries
4. **Data Integrity**: Enforces a canonical representation

### UUID Comparison in PostgreSQL

PostgreSQL compares UUIDs lexicographically (as strings), so `sort()` in JavaScript produces the same ordering as PostgreSQL's `<` operator.

## Future Enhancements (Optional)

1. **Message Notifications**

   - Push notifications for new messages
   - Badge count on app icon

2. **Chat Features**

   - Message deletion
   - Image/file sharing
   - Typing indicators
   - Read receipts
   - Message search

3. **Follow Features**

   - Mutual followers filter
   - Follow suggestions
   - Follower search
   - Export follower/following list

4. **Notification Features**
   - Filter notifications by type
   - Delete individual notifications
   - Notification settings/preferences

## Conclusion

The real-time chat system is now fully operational with:

- ✅ Working chat creation from profile (respects database constraints)
- ✅ Real-time messaging
- ✅ Proper RLS security policies
- ✅ Notification system with visual indicators
- ✅ Follower/following list screens
- ✅ Complete navigation flow (own profile + other profiles)
- ✅ No linting errors
- ✅ Production-ready code

All components follow the existing codebase patterns and maintain consistency with the app's design system. The database constraint issue has been identified and properly handled in the application logic.
