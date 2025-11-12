# UI Layout Improvements - Requirements Document

## Introduction

This document outlines UI/layout improvements to enhance the user experience by reducing redundancy and creating more streamlined list views. The changes focus on two main areas: simplifying the own-profile posts view and converting card-based lists to borderless list layouts.

## Glossary

- **Own Profile View**: The screen displayed when a user views their own profile and posts (accessed via `/user/${currentUserId}`)
- **Profile Header**: The section containing avatar, name, bio, stats, and action buttons
- **Card Layout**: UI pattern with individual containers that have padding/margins around them
- **List Layout**: UI pattern where items are displayed in a continuous list with divider borders
- **Messages Screen**: The main messages tab showing all chat conversations
- **Followers/Following Screens**: Screens showing lists of users who follow or are followed by a user

## Requirements

### Requirement 1: Simplified Own Profile Posts View

**User Story:** As a user viewing my own posts, I want to see only my posts without redundant profile information, so that I can focus on my content history.

#### Acceptance Criteria

1. WHEN the System detects that the current user ID matches the target profile user ID, THE System SHALL hide the profile header section (avatar, name, bio, stats, action buttons)

2. WHEN displaying the own profile posts view, THE System SHALL show only the page title "My Posts" and the list of posts

3. WHEN a user navigates to their own profile via the profile tab stats, THE System SHALL display the simplified posts-only view

4. WHEN a user navigates to another user's profile, THE System SHALL display the full profile header with all information and action buttons

5. WHEN the posts list is empty on own profile, THE System SHALL display an appropriate empty state message

### Requirement 2: List-Style Layout for Messages Screen

**User Story:** As a user browsing my messages, I want to see conversations in a continuous list format, so that I can scan through them more efficiently.

#### Acceptance Criteria

1. WHEN displaying the messages list, THE System SHALL remove horizontal margins between chat items

2. WHEN rendering chat items, THE System SHALL replace Card components with plain View components that have border separators

3. WHEN a user scrolls through messages, THE System SHALL display a 1-pixel border between each chat item using the theme border color

4. WHEN displaying the last message in the list, THE System SHALL not show a bottom border

5. WHEN a chat item is pressed, THE System SHALL provide visual feedback (background color change) without card elevation effects

### Requirement 3: List-Style Layout for Followers Screen

**User Story:** As a user viewing followers, I want to see them in a continuous list format, so that I can browse through followers more easily.

#### Acceptance Criteria

1. WHEN displaying the followers list, THE System SHALL remove horizontal margins between follower items

2. WHEN rendering follower items, THE System SHALL replace Card components with plain View components that have border separators

3. WHEN a user scrolls through followers, THE System SHALL display a 1-pixel border between each follower item using the theme border color

4. WHEN displaying the last follower in the list, THE System SHALL not show a bottom border

5. WHEN a follower item is pressed, THE System SHALL provide visual feedback (background color change) without card elevation effects

### Requirement 4: List-Style Layout for Following Screen

**User Story:** As a user viewing who I follow, I want to see them in a continuous list format, so that I can browse through the list more easily.

#### Acceptance Criteria

1. WHEN displaying the following list, THE System SHALL remove horizontal margins between following items

2. WHEN rendering following items, THE System SHALL replace Card components with plain View components that have border separators

3. WHEN a user scrolls through following, THE System SHALL display a 1-pixel border between each following item using the theme border color

4. WHEN displaying the last following item in the list, THE System SHALL not show a bottom border

5. WHEN a following item is pressed, THE System SHALL provide visual feedback (background color change) without card elevation effects

## Technical Notes

### Files to Modify

1. **YikYak/src/app/user/[id].jsx**
   - Add conditional rendering based on `isOwnProfile`
   - Hide profile header when viewing own profile
   - Update page title to "My Posts" for own profile

2. **YikYak/src/app/(tabs)/messages.jsx**
   - Replace Card component with View + border styling
   - Remove horizontal margins (marginHorizontal)
   - Add border separators between items
   - Implement press feedback with TouchableOpacity

3. **YikYak/src/app/user/followers/[id].jsx**
   - Replace Card component in FollowerItem with View + border styling
   - Remove horizontal margins
   - Add border separators between items
   - Implement press feedback with TouchableOpacity

4. **YikYak/src/app/user/following/[id].jsx**
   - Replace Card component in FollowingItem with View + border styling
   - Remove horizontal margins
   - Add border separators between items
   - Implement press feedback with TouchableOpacity

### Design Considerations

- **Border Color**: Use `colors.border` from theme for consistency
- **Press Feedback**: Use subtle background color change (e.g., `colors.inputBackground`) on press
- **Padding**: Maintain internal padding (16-20px) for list items
- **Empty States**: Keep existing empty state components unchanged
- **Accessibility**: Ensure touch targets remain at least 44x44 points

### Visual Comparison

**Before (Card Layout):**
```
┌─────────────────────┐
│  [Card with margin] │
└─────────────────────┘
  
┌─────────────────────┐
│  [Card with margin] │
└─────────────────────┘
```

**After (List Layout):**
```
┌─────────────────────┐
│  [List item]        │
├─────────────────────┤
│  [List item]        │
├─────────────────────┤
│  [List item]        │
└─────────────────────┘
```

## Success Criteria

1. Own profile view shows only posts without redundant header information
2. Messages, followers, and following screens display as continuous lists with border separators
3. No horizontal spacing around list items
4. Visual feedback on press maintains good UX
5. All changes maintain theme consistency (light/dark mode)
6. No regression in existing functionality (navigation, data loading, etc.)

## Implementation Priority

1. **High Priority**: Own profile posts view simplification (Requirement 1)
2. **High Priority**: Messages screen list layout (Requirement 2)
3. **Medium Priority**: Followers screen list layout (Requirement 3)
4. **Medium Priority**: Following screen list layout (Requirement 4)

## Status

- **Created**: 2025-10-30
- **Status**: ✅ COMPLETED
- **Completed**: 2025-10-30

## Implementation Summary

All UI layout improvements have been successfully implemented:

### 1. Own Profile Posts View (✅ Completed)
- **File**: `YikYak/src/app/user/[id].jsx`
- **Changes**:
  - Added conditional rendering based on `isOwnProfile` flag
  - Profile header (avatar, stats, bio, buttons) now hidden when viewing own profile
  - Page title changes to "My Posts" for own profile
  - "Posts" section heading removed for own profile view
  - Added top margin for posts section when viewing own profile

### 2. Messages Screen List Layout (✅ Completed)
- **File**: `YikYak/src/app/(tabs)/messages.jsx`
- **Changes**:
  - Replaced Card component with TouchableOpacity + View
  - Removed horizontal margins (marginHorizontal: 20)
  - Added border separators between items using `borderBottomWidth`
  - Last item has no bottom border
  - Added press feedback with `activeOpacity={0.7}`
  - Maintained internal padding (paddingHorizontal: 20, paddingVertical: 16)

### 3. Followers Screen List Layout (✅ Completed)
- **File**: `YikYak/src/app/user/followers/[id].jsx`
- **Changes**:
  - Replaced Card component with TouchableOpacity + View in FollowerItem
  - Removed horizontal margins and bottom margins
  - Added border separators between items
  - Added `isLastItem` prop to conditionally hide last border
  - Updated renderFollower to pass index and calculate isLastItem
  - Removed contentContainerStyle padding from FlatList

### 4. Following Screen List Layout (✅ Completed)
- **File**: `YikYak/src/app/user/following/[id].jsx`
- **Changes**:
  - Replaced Card component with TouchableOpacity + View in FollowingItem
  - Removed horizontal margins and bottom margins
  - Added border separators between items
  - Added `isLastItem` prop to conditionally hide last border
  - Updated renderFollowing to pass index and calculate isLastItem
  - Removed contentContainerStyle padding from FlatList

### Technical Details
- All changes maintain theme consistency (colors.border, colors.surface)
- Press feedback uses activeOpacity for better UX
- No diagnostics errors found in any modified files
- All existing functionality preserved (navigation, data loading, follow/unfollow)

---

## Phase 2: Extended List Layout & Border Removal (✅ Completed)

### 5. Home Feed List Layout (✅ Completed)
- **File**: `YikYak/src/app/(tabs)/home.jsx`
- **Changes**:
  - Replaced Card component with TouchableOpacity for posts
  - Removed horizontal margins (marginHorizontal: spacing.lg)
  - Removed bottom margins between posts
  - Added direct padding (paddingHorizontal: 20, paddingVertical: 16)
  - Maintained press feedback with activeOpacity={0.7}

### 6. Notifications List Layout (✅ Completed)
- **File**: `YikYak/src/app/(tabs)/notification.jsx`
- **Changes**:
  - Removed Card wrapper, using TouchableOpacity directly
  - Removed horizontal margins (marginHorizontal: 20)
  - Removed bottom margins (marginBottom: 12)
  - Added direct padding to TouchableOpacity
  - Removed contentContainerStyle padding from FlatList
  - Maintained unread indicator and accent border on left

### 7. Post Detail Comments List Layout (✅ Completed)
- **File**: `YikYak/src/app/post/[id].jsx`
- **Changes**:
  - Replaced Card component with View for comments
  - Removed horizontal margins and bottom margins
  - Added direct padding (paddingHorizontal: 20, paddingVertical: 16)
  - Moved "Comments" heading padding to match list style
  - Maintained comment voting functionality

### 8. Border Removal (✅ Completed)
- **Files**: All list screens
- **Changes**:
  - Removed `borderBottomWidth` from Messages screen
  - Removed `borderBottomColor` from Messages screen
  - Removed `isLastItem` conditional border logic from Followers screen
  - Removed `isLastItem` conditional border logic from Following screen
  - All lists now display as continuous surfaces without separators

### Final Result
All screens now use a consistent borderless list layout:
- No spacing between items
- No border separators
- Clean, continuous surface appearance
- Maintained press feedback and functionality
- Consistent padding within items (20px horizontal, 16px vertical)

---

## Phase 3: Border Refinements (✅ Completed)

### 9. Home Feed Post Separators (✅ Completed)
- **File**: `YikYak/src/app/(tabs)/home.jsx`
- **Changes**:
  - Added thin border separator (0.5px) between posts using `borderBottomWidth`
  - Used muted `colors.border` for subtle separation
  - Last post has no bottom border (`isLastPost` check)
  - Updated renderPost to accept index parameter
  - Posts now have visual separation while maintaining list layout

### 10. Profile Page Container Removal (✅ Completed)
- **File**: `YikYak/src/app/(tabs)/profile.jsx`
- **Changes**:
  - Replaced Card component with View for profile header
  - Removed Card border/shadow styling
  - Added manual styling (backgroundColor, borderRadius, padding)
  - Maintained the stats separator line (borderTopWidth: 1)
  - Profile header now has clean appearance without container border
  - Stats section separator remains for visual hierarchy

### Design Rationale
- **Post Separators**: Thin 0.5px borders provide subtle visual separation without being intrusive
- **Profile Container**: Removed border creates cleaner, more modern appearance
- **Stats Separator**: Kept to maintain visual hierarchy between profile info and stats
- **Color Consistency**: All borders use theme's muted `colors.border` for consistency
