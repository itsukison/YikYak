Minimum concrete checklist for iOS launch
Here's the absolute minimum to pass Apple review without rejection:

✅ Phase 1: Technical Setup (Before Build)
 app.json configured

json
{
  "name": "HearSay",
  "slug": "hearsay",
  "version": "1.0.0",
  "ios": {
    "bundleIdentifier": "com.yourcompany.hearsay",
    "buildNumber": "1",
    "supportsTabletMode": false
  },
  "plugins": [
    ["expo-location", {"locationAlwaysAndWhenInUsePermissions": "Allow HearSay to access your location for the nearby feed."}]
  ]
}
 Permissions declared in app.json (location, notifications, camera if applicable)

 App icons & splash screen (1024x1024 PNG minimum; EAS will auto-generate other sizes)

 Privacy Policy URL (must be publicly hosted; e.g., https://yourdomain.com/privacy)

 Support email reachable and monitored

✅ Phase 2: Core App Features (MVP)
Essential features to ship:

 Signup flow (email or .ac.jp domain auth via Supabase)

 Post creation (text only, no images/media)

 Feed (location-based posts from nearby users)

 Voting (upvote/downvote buttons)

 Comments (on posts)

 Anonymous mode toggle (per-post or profile-level)

 Settings screen (logout, privacy policy link)

Do NOT include yet (Phase 2 feature):

DMs (adds moderation complexity; defer to post-launch)

Follow system (optional, can add later)

✅ Phase 3: Moderation & Safety (Critical)
 Report button on every post

Categories: ["Spam", "Harassment", "Hate speech", "Inappropriate content", "Other"]

Submits to a simple backend table (you review manually)

 Block user button (prevents blocked user's posts in feed, blocks DMs)

 Terms of Service (in Japanese, ~300 words)

Host at https://yourdomain.com/terms

Shown in-app at signup

Ban harassment, bullying, illegal content, doxxing

 Community Guidelines (same URL, linked from settings)

 Onboarding screen (2–3 taps)

"Posts are location-based and semi-anonymous"

"Voting helps surface good discussions"

"Report abuse via the flag icon"

✅ Phase 4: Privacy & Data
 Privacy Policy covering:

What data: email, location (coarse or fine?), posts, votes, comments

Where stored: Supabase (Postgres)

Retention: how long before deletion?

Deletion: users can request account deletion

Children: if any user is <13, compliance with COPPA (unlikely in Japan college app)

 App Tracking Transparency (ATT)

If using any third-party analytics (Firebase, Mixpanel, etc.), add ATT prompt

Otherwise, declare "no tracking" in App Store Connect metadata

 Data Safety form (in App Store Connect)

text
Data collected:
- Email address (linked to identity)
- Location (coarse, for feed) (linked to identity)
- User-generated content (posts, comments) (not linked, semi-anonymous)

Used for: app functionality, abuse detection
Not used for tracking or marketing
✅ Phase 5: Build & Submission
 Create app in App Store Connect

App name: "HearSay"

Bundle ID: com.yourcompany.hearsay (must match app.json)

Category: "Social Networking"

Age rating: likely 17+ (UGC + voting system)

Availability: Japan first, can expand later

 Build production binary

bash
eas build --platform ios --profile production
 Ensure no crashes in TestFlight

bash
eas submit --platform ios  # Uploads to App Store Connect
Enable TestFlight on the build

Add 3–5 internal testers from your Expo account

Test signup → post → vote → comment → view feed

Verify location permission works

Test anonymous + nickname modes

 Fill App Store metadata

Description (250 chars): "Campus social network for nearby discussions"

Keywords: campus, anonymous, college, sns, japan

Support URL: support email or form

Screenshots (5–6): show feed, voting, posting, comments, anonymous feature

App Preview (30s video, optional but helps)

 Respond to privacy questions accurately

"Does your app collect user data?" → Yes (email, location, posts)

"Is data linked to user identity?" → Yes (email), No (anonymous posts)

"Do you use data for tracking?" → No

 Submit for Review

Estimated wait: 24–48 hours for initial review

✅ Phase 6: After Approval
 Monitor first week for crashes, feedback

 Use eas update --branch production for hotfixes (bypasses review)

 Plan Phase 2: DMs, follow system, push notifications

