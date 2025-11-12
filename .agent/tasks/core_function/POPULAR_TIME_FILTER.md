# Popular Time Filter Feature

**Status:** ✅ Complete
**Implemented:** 2025-10-27

## 📋 Requirements

Add a time-based filter to the "Popular" tab on the home feed, allowing users to view popular posts from different time periods:
- **Day** - Posts from the last 24 hours
- **Week** - Posts from the last 7 days  
- **Month** - Posts from the last 30 days

This prevents users from constantly seeing the same old popular posts and provides fresher content discovery.

---

## 🎨 Design Specifications

Following `.agent/styling.md` guidelines (Coinbase/Artifact-inspired):

### Visual Style
- **Minimal and clean** - small, unobtrusive filter UI
- **Flat design** - no heavy shadows, clean dividers
- **Professional typography** - Instrument Sans/Poppins
- **Accent colors** - Use existing theme colors (primary blue, subtle grays)

### Layout Options

**Option A: Horizontal Pill Selector (Recommended)**
```
[Popular ▼]  ← Dropdown or inline pills below tab
  Day | Week | Month
```
- Appears only when "Popular" tab is active
- Small pill buttons (6-8px border radius)
- Positioned directly below the New/Popular tab selector
- Compact horizontal layout: `[Day] [Week] [Month]`
- Active state: filled with `colors.primary`, white text
- Inactive state: transparent background, `colors.textSecondary` text

**Option B: Segmented Control (Alternative)**
```
Popular
┌─────┬──────┬───────┐
│ Day │ Week │ Month │
└─────┴──────┴───────┘
```
- iOS-style segmented control
- Slightly larger but more explicit

### Spacing & Sizing
- Filter height: ~32-36px
- Horizontal padding: 16px (match feed cards)
- Margin top: 8px (from tab selector)
- Margin bottom: 12px (before posts)
- Pill padding: 8px horizontal, 6px vertical
- Font size: 12-13px
- Gap between pills: 6px

### Color Scheme
- Active pill: `colors.primary` background, white text
- Inactive pill: transparent background, `colors.textSecondary` text
- Border (if needed): `colors.border` or none for flat design
- Hover/press: `colors.primarySubtle` for inactive pills

---

## 🏗️ Implementation Plan

### Phase 1: State Management
**File:** `src/app/(tabs)/home.jsx`

1. Add new state for time filter:
```javascript
const [timeFilter, setTimeFilter] = useState("week"); // 'day' | 'week' | 'month'
```

2. Only show filter when `activeTab === "popular"`

3. Pass `timeFilter` to `usePostsQuery` hook

### Phase 2: UI Component
**File:** `src/app/(tabs)/home.jsx`

1. Create inline filter component below tab selector:
```javascript
{activeTab === "popular" && (
  <View style={styles.timeFilterContainer}>
    {['day', 'week', 'month'].map(filter => (
      <TouchableOpacity
        key={filter}
        onPress={() => setTimeFilter(filter)}
        style={[
          styles.timeFilterPill,
          timeFilter === filter && styles.timeFilterPillActive
        ]}
      >
        <Text style={timeFilter === filter ? styles.timeFilterTextActive : styles.timeFilterText}>
          {filter.charAt(0).toUpperCase() + filter.slice(1)}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
)}
```

2. Style definitions following design specs above

### Phase 3: Backend Query Update
**File:** `src/utils/queries/posts.js`

1. Update `usePostsQuery` to accept `timeFilter` parameter

2. Modify Supabase query to filter by `created_at`:
```javascript
let query = supabase
  .from('posts')
  .select('*, users!inner(nickname, is_anonymous)')
  .order('score', { ascending: false });

if (sortBy === 'popular' && timeFilter) {
  const now = new Date();
  let cutoffDate;
  
  switch(timeFilter) {
    case 'day':
      cutoffDate = new Date(now - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      cutoffDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
  }
  
  query = query.gte('created_at', cutoffDate.toISOString());
}
```

### Phase 4: Header Layout Adjustment
**File:** `src/app/(tabs)/home.jsx`

1. Adjust `paddingTop` in ScrollView `contentContainerStyle` to account for new filter height when visible:
```javascript
paddingTop: insets.top + (activeTab === "popular" ? 200 : 160)
```

2. Ensure smooth transition when switching tabs

---

## 📁 Files to Modify

1. **`src/app/(tabs)/home.jsx`**
   - Add `timeFilter` state
   - Add filter UI component
   - Adjust header padding
   - Pass `timeFilter` to query hook

2. **`src/utils/queries/posts.js`**
   - Update `usePostsQuery` signature
   - Add time-based filtering logic
   - Maintain existing location/radius filtering

---

## ✅ Testing Checklist

- [x] Filter appears only when "Popular" tab is active
- [x] Filter disappears when switching to "New" tab
- [x] Clicking each filter (Day/Week/Month) updates posts correctly
- [x] Default filter is "Week" on first load
- [x] Posts are correctly filtered by time range
- [x] Location radius filtering still works with time filter
- [x] Smooth scrolling with adjusted header height
- [x] Visual design matches styling guidelines
- [x] Works in both light and dark themes
- [x] No layout shifts when switching tabs
- [x] Pull-to-refresh works correctly with active filter

---

## 🎯 Success Criteria

- Users can easily switch between Day/Week/Month views
- Popular posts feel fresh and relevant
- UI is minimal and doesn't clutter the feed
- Performance remains smooth (no lag when filtering)
- Design feels cohesive with existing app style

---

## 📝 Implementation Notes

- Keep the filter small and unobtrusive
- Default to "Week" for balanced freshness vs. content availability
- Consider caching each time filter's results separately in React Query
- Ensure the filter state persists during the session (but not across app restarts)
- If no posts exist for a time period, show appropriate empty state

---

## 🚀 Future Enhancements (Optional)

- Add "All Time" option for classic popular view
- Persist user's preferred time filter in AsyncStorage
- Add subtle animation when switching filters
- Show post count for each time period
- Add "Trending" algorithm that weighs recency + velocity


---

## 🎉 Implementation Complete

### Changes Made

**1. Frontend UI (`src/app/(tabs)/home.jsx`)**
- Added `timeFilter` state (default: "week")
- Created horizontal pill selector with Day/Week/Month options
- Filter only visible when Popular tab is active
- Adjusted ScrollView padding to accommodate filter height (200px vs 160px)
- Passed `timeFilter` to `usePostsQuery` hook

**2. Query Hook (`src/utils/queries/posts.js`)**
- Updated `usePostsQuery` signature to accept `timeFilter` parameter
- Added `timeFilter` to queryKey for proper caching
- Passed `time_filter` to Supabase RPC call

**3. Database Function (`supabase/migrations/add_time_filter_to_posts.sql`)**
- Updated `get_posts_within_radius` function with new `time_filter` parameter
- Added time-based filtering logic:
  - Day: last 24 hours
  - Week: last 7 days
  - Month: last 30 days
- Time filter only applies when `sort_by = 'popular'`
- New posts show all time periods (no filter)
- Migration applied successfully to database

### Design Implementation
- Clean horizontal pill layout with 6px gap
- Active state: primary color background, white text
- Inactive state: transparent background, secondary text color
- 6px border radius for subtle rounding
- 13px font size for compact appearance
- Centered alignment below tab selector
- 8px top margin for proper spacing

### Result
Users can now filter popular posts by time period, ensuring fresh content discovery and preventing stale popular posts from dominating the feed. The UI is minimal, professional, and follows the Coinbase/Artifact-inspired design system.
