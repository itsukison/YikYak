# Architecture Refactoring Plan

**Goal**: Align the codebase with `../rule.md` to ensure better layering, single responsibility, and maintainability.
**Status**: PLANNING

## 1. Current State Analysis

### 1.1. Structure Violations
The current structure in `/src` is a mix of framework-specific folders (`app`, `components`) and loose utility folders (`utils`, `services`):
- `src/utils/queries` contains heavy domain logic (data fetching + mutation + business rules) which belongs in `src/services` or `src/core`.
- `src/utils/theme.js` is a large configuration file.
- `src/utils/supabase.js` is an adapter.
- `src/app` contains "mega components" that handle UI, data fetching, and location logic simultaneously.

### 1.2. Large File Violations (>300 lines)
The following files exceed the 300-line limit and have mixed responsibilities:

**UI Layer (Critical):**
1.  `src/app/(tabs)/home.jsx` (**784 lines**): Handles location, refreshing, voting, time formatting, and rendering.
2.  `src/app/post/[id].jsx` (**587 lines**): Post detail view with likely mixed logic.
3.  `src/app/(tabs)/profile.jsx` (**509 lines**)
4.  `src/app/user/[id].jsx` (**470 lines**)
5.  `src/app/create-post.jsx` (**419 lines**)
6.  `src/app/repost/[id].jsx` (**386 lines**)
7.  `src/components/PostActionSheet.jsx` (**359 lines**)

**Logic Layer:**
8.  `src/utils/queries/posts.js` (**366 lines**): Contains 8 different hooks/mutations.

**Configuration:**
9.  `src/utils/theme.js` (**329 lines**): Contains color palette, spacing, and Gluestack config.

## 2. Target Architecture (per rule.md)

```
/src
  /core         # Domain logic, types, pure utilities (No external deps)
  /services     # Business logic & orchestration (e.g., Auth, Feed, PostService)
  /adapters     # External integrations (Supabase, APIs)
  /ui           # Presentation layer
    /app        # Next.js/Expo/Router pages
    /components # Shared UI components
  /config       # Constants, Environment, Theme
  /tests        # Tests
```

## 3. Implementation Plan

### Phase 1: Foundation & Directory Setup
- [x] Create missing directories: `src/core`, `src/adapters`, `src/config`.
- [x] Move `src/utils/supabase.js` → `src/adapters/supabaseClient.js`.
- [x] Move `src/utils/theme.js` → `src/config/theme.js`.
    -   *Optional*: Split `theme.js` if it remains > 300 lines into `theme/colors.js`, `theme/typography.js`.
- [x] Audit `src/utils`:
    -   Move pure helper functions to `src/core/utils`.
    -   Move standard hooks to `src/ui/hooks` (if UI related) or `src/core/hooks`.

### Phase 2: Refactor Services (Logic Layer)
Migrate `src/utils/queries/*` and `src/services/*` into a domain-driven structure under `src/services/`.

- [ ] **Posts Domain** (`src/services/posts/`):
    -   Split `src/utils/queries/posts.js` into:
        -   `src/services/posts/usePosts.js`
        -   `src/services/posts/useCreatePost.js`
        -   `src/services/posts/usePostActions.js` (vote, report, delete)
- [ ] **Chat Domain** (`src/services/chat/`):
    -   Consolidate `src/utils/queries/chats.js` and `src/services/messaging` logic here.
- [ ] **Auth Domain** (`src/services/auth/`):
    -   Move `src/utils/auth/*` content here.
- [ ] **User Domain** (`src/services/user/`):
    -   From `src/utils/queries/users.js`, `follows.js`, `profile.js`.
- [ ] **Notification Domain** (`src/services/notifications/`):
    -   From `src/utils/queries/notifications.js`.

### Phase 3: Refactor UI (Presentation Layer)
Break down "mega files" into smaller, single-responsibility components.

- [ ] **Home Screen (`src/app/(tabs)/home.jsx`) Refactor**:
    -   Extract `LocationManager` (logic) → `src/services/location/useLocation.js` or `src/ui/hooks/useLocationStrategy.js`.
    -   Extract `FeedList` component → `src/components/feed/FeedList.jsx`.
    -   Extract `FeedItem` component → `src/components/feed/FeedItem.jsx`.
    -   Result: `home.jsx` should only be the composition layer (< 150 lines).

- [ ] **Post Detail (`src/app/post/[id].jsx`) Refactor**:
    -   Extract `CommentList`.
    -   Extract `PostHero` (the main post view).

- [ ] **Components**:
    -   Refactor `PostActionSheet.jsx`: Split internal Render functions into sub-components (e.g., `ActionOption`, `ReportModal`).

### Phase 4: Cleanup
- [ ] Remove empty headers/folders from `src/utils` and `src/services` (old locations).
- [ ] Update all import paths.
- [ ] Verify no circular dependencies (e.g. `core` importing `ui`).

## 4. Execution Rules
- **Do NOT break functionality**: Run tests (or manual verification) after every move.
- **Atomic changes**: Move one domain or one component at a time.
- **Update Imports**: Use search-and-replace carefully for updated paths.
