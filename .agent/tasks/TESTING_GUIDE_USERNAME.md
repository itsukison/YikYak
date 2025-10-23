# Testing Guide: Username Field in Onboarding

**Feature:** Username input field added to onboarding flow
**Date:** 2025-10-23
**Status:** Ready for testing

---

## Quick Test Steps

### 1. New User Signup Flow
1. Run the app: `npx expo start`
2. Navigate to signup screen
3. Create a new account with email/password
4. You should be redirected to onboarding screen
5. **NEW:** Username field appears first (before nickname)
6. Try entering a username:
   - Valid: `tokyo_student` ✅
   - Too short: `ab` ❌ (should show error)
   - With spaces: `hello world` ❌ (should show error)
   - With special chars: `user@123` ❌ (should show error)
7. When you blur the field, it checks availability
8. Fill in nickname and bio
9. Press "Get Started"
10. Should redirect to home screen automatically

### 2. Username Uniqueness Test
1. Create first user with username `testuser`
2. Complete onboarding
3. Sign out
4. Create second user
5. Try to use username `testuser` again
6. Should show "Username is already taken" ❌
7. Try `TestUser` (different case)
8. Should also show "Username is already taken" ❌ (case-insensitive)
9. Try `testuser2`
10. Should be accepted ✅

### 3. Skip Button Test
1. Start onboarding
2. Press "Skip for now" button
3. Should create profile with random username (format: `user_XXXXXXXX`)
4. Should redirect to home screen

---

## What Was Implemented

### Database Changes
- ✅ Unique index on username (case-insensitive): `idx_users_username_unique`
- ✅ Regular index for fast lookups: `idx_users_username`

### UI Changes
- ✅ Username input field (before nickname)
- ✅ Real-time format validation
- ✅ Uniqueness check on blur
- ✅ Loading state: "Checking availability..."
- ✅ Error messages for validation failures
- ✅ Helper text explaining format
- ✅ Automatic lowercase conversion

### Validation Rules
- Required field (cannot be empty)
- 3-20 characters
- Alphanumeric + underscore only (regex: `^[a-zA-Z0-9_]+$`)
- Must be unique (case-insensitive)
- Automatically converted to lowercase

---

## Expected Behavior

### Valid Usernames
- `tokyo_student` ✅
- `user123` ✅
- `student_2024` ✅
- `TokyoStudent` → converted to `tokyostudent` ✅

### Invalid Usernames
- `ab` → "Username must be at least 3 characters" ❌
- `this_is_a_very_long_username` → "Username must be 20 characters or less" ❌
- `hello world` → "Username can only contain letters, numbers, and underscores" ❌
- `user@123` → "Username can only contain letters, numbers, and underscores" ❌
- Empty → "Username is required" ❌
- Duplicate → "Username is already taken" ❌

---

## Files Modified

1. **Database Migration:**
   - Migration: `add_username_unique_constraint`
   - Created unique index on `LOWER(username)`

2. **UI Updates:**
   - `YikYak/src/app/onboarding.jsx`
   - Added username state and validation
   - Added username input field
   - Updated `handleComplete()` to include username
   - Updated `handleSkip()` to generate random username

3. **Documentation:**
   - `YikYak/.agent/README.md` - Updated authentication section
   - `YikYak/.agent/tasks/Onboarding.md` - Marked as complete

---

## Known Issues / Notes

- Username field is required for new users
- Existing users with NULL username can still login (backward compatible)
- Username is case-insensitive for uniqueness but stored as entered
- Skip button generates random username to ensure field is never NULL for new users

---

## Next Steps

After testing, if everything works:
1. Mark task as complete in `Onboarding.md`
2. Close any related issues
3. Consider adding username to profile edit screen (future enhancement)
4. Consider adding username search functionality (future enhancement)
