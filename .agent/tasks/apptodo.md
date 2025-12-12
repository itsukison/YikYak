App Store Publication Plan for HearSay
1. Legal & Support Pages
Support Page (CRITICAL - MISSING)
Create support page at https://www.hearsay.ink/support with:

Contact form or email: support@hearsay.ink
FAQ section (optional but recommended)
Response time expectation (e.g., "We respond within 48 hours")
This is mandatory for App Store submission.

Make Terms & Privacy Links Clickable (CRITICAL)
Currently in src/app/signup.jsx line 188, the text mentions Terms and Privacy but is NOT clickable.

Fix required in:

src/app/signup.jsx - Add clickable links with expo-web-browser to open URLs
src/app/login.jsx - Add same clickable disclaimer
Example implementation needed:

import * as WebBrowser from 'expo-web-browser';

// Add this component before the signup button
<View style={styles.termsContainer}>
  <Text style={styles.termsText}>
    By continuing, you agree to our{' '}
    <Text 
      style={styles.link} 
      onPress={() => WebBrowser.openBrowserAsync('https://www.hearsay.ink/terms')}
    >
      Terms of Service
    </Text>
    {' '}and{' '}
    <Text 
      style={styles.link}
      onPress={() => WebBrowser.openBrowserAsync('https://www.hearsay.ink/privacy')}
    >
      Privacy Policy
    </Text>
    .
  </Text>
</View>
Requirements:

Must be visible BEFORE signup button
Text must be at least 12pt font
Links must be tappable and open in browser/webview
Cannot be hidden in footer or fine print
---

2. Onboarding Enhancements
Community Guidelines Modal (REQUIRED)
Create modal that shows ONCE after signup, before accessing main feed.

Create new file: src/components/CommunityGuidelinesModal.jsx

Content must include:

"Welcome to HearSay"
Community Rules list:
Be respectful to all users
No harassment, bullying, or hate speech
No explicit content or pornography
No illegal content or promotion of illegal acts
Violations will result in immediate removal
"I Understand and Agree" button
Store acceptance in user profile (community_guidelines_accepted field) to prevent showing again.

Location Permission Priming Screen (REQUIRED)
Create screen that shows BEFORE requesting system location permission.

Create new file: src/components/LocationPermissionPrimer.jsx

Must explain:

"HearSay uses your location to show you posts from people nearby"
"Your exact location is never shared with other users"
"Enable Location" button
"Maybe Later" option
---

3. App Configuration (app.json)
Update app.json with REQUIRED fields:
{
  "expo": {
    "name": "HearSay",
    "slug": "hearsay",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.itsukison.HearSayjapan",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "HearSay uses your location to show you posts from people nearby. Your exact location is never shared with other users.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "HearSay uses your location to show you posts from people nearby even when the app is in the background. Your exact location is never shared with other users.",
        "ITSAppUsesNonExemptEncryption": false
      }
    }
  }
}
Critical: NSLocationWhenInUseUsageDescription is MISSING from current app.json

---

4. Content Moderation System
4.1 Proactive Text Filtering (CRITICAL - MISSING)
Apple requires proactive prevention, not just reactive reporting.

Create new file: src/services/moderation/contentFilter.js

Implement:

Banned words list/library (use bad-words npm package)
Text validation before post creation
Reject posts containing prohibited content
Update: src/services/posts/useCreatePost.js

Add content filtering BEFORE allowing post creation:

const filterResult = filterContent(content);
if (!filterResult.allowed) {
  throw new Error('Your post contains prohibited content and cannot be published.');
}
4.2 Image Content Moderation (CRITICAL - REQUIRED FOR IMAGE UPLOADS)
Since users can upload images, you MUST implement image moderation.

Options:

AWS Rekognition (recommended) - detects explicit content, violence, hate symbols
Google Cloud Vision API (alternative)
Manual review queue (not recommended - too slow)
Create new file: src/services/moderation/imageModeration.js

Must detect and reject:

Explicit Nudity
Violence
Hate Symbols
Graphic content
Update photo upload flow to check images before allowing upload.

4.3 Spam Detection (REQUIRED)
Create new file: src/services/moderation/spamDetection.js

Implement:

Rate limiting (max 10 posts per hour per user)
Duplicate content detection
Link spam detection (max 2 URLs per post)
4.4 Moderation Dashboard (REQUIRED)
You already have reporting functionality in PostActionSheet.jsx, but need a way to REVIEW reports.

Create admin dashboard (can be web-based):

View all reports from reports table
Review reported content within 24 hours
Take actions: Remove content, ban user, dismiss report
Track moderation metrics
Minimum: Email notifications when reports are submitted to support@hearsay.ink

Document moderation response protocol:

Standard reports: 24 hours
High severity: 2 hours
Critical (illegal content): Immediate
---

5. App Store Connect Preparation
5.1 App Metadata
App Name: "HearSay" or "HearSay - Nearby Social"

Subtitle (30 chars): "Anonymous nearby posts" or "Share thoughts with locals"

Keywords (100 chars):

anonymous,local,nearby,social,community,posts,location,neighborhood,discuss,share,yik yak,gossip
Description (4000 chars max):

Discover what's happening in your neighborhood with HearSay – the anonymous social app connecting you with people nearby.

WHY HEARSAY?
• Location-Based Feed – See posts from people within 5 miles
• Complete Anonymity – No profiles, no followers, just authentic voices
• Vote & Engage – Upvote the best posts, downvote the noise
• Safe Community – Zero tolerance for harassment and hate

HOW IT WORKS:
1. Enable location to see nearby posts
2. Share your thoughts anonymously
3. Discover what your neighbors are saying
4. Engage through voting and comments

PRIVACY & SAFETY:
We take your safety seriously. HearSay includes:
• Proactive content filtering
• 24-hour moderation response time
• One-tap blocking and reporting
• Your location is NEVER shared with other users

Perfect for:
✓ Discovering local events and news
✓ Getting neighborhood recommendations
✓ Sharing thoughts without judgment
✓ Connecting with your community

Download HearSay today and join the conversation happening around you!

Support: support@hearsay.ink
Privacy Policy: https://www.hearsay.ink/privacy
Terms: https://www.hearsay.ink/terms
Category:

Primary: Social Networking
Secondary: News (optional)
5.2 App Icon (MISSING - REQUIRED)
Create 1024 x 1024 pixels PNG app icon:

No alpha channel
No rounded corners (Apple adds them)
Simple, recognizable at small sizes
No text if possible
Save to: assets/images/icon.png (update existing placeholder)

5.3 Screenshots (MISSING - REQUIRED)
Mandatory sizes:

6.9-inch iPhone (1290 x 2796 pixels) - Portrait - Minimum 3 screenshots
13-inch iPad (2048 x 2732 pixels) - Portrait - Minimum 3 screenshots
Recommended screenshot sequence:

Hero/Value Prop - "See what's happening nearby"
Feed View - Show real-looking demo posts
Posting - "Share your thoughts anonymously"
Voting - Show upvote/downvote interaction
Safety Features - Block & Report menu
Location Privacy - "Your location stays private"
Requirements:

Use actual app screenshots (no external mockups)
No placeholder content visible
Add text overlays explaining features
High-contrast colors
Include status bar for authenticity
Tools: Use iOS Simulator + screenshot tool, or Figma/Screenshots.pro

5.4 Age Rating Configuration
In App Store Connect questionnaire, answer:

Does your app contain user-generated content? YES
Does your app have unrestricted web access? YES
Infrequent/Mild Profanity or Crude Humor? YES
Does your app use location services? YES
All Violence/Sexual Content: NO (you filter this)
Expected Result: 17+ rating (appropriate and expected)

5.5 Privacy Details Declaration
Data Collection:

Email Address - Linked to User - Account Creation
Precise Location - Linked to User - App Functionality
User ID - Linked to User - App Functionality  
User Content - Linked to User - App Functionality
Usage Data - Not Linked - Analytics
Tracking: Select "No" (unless using advertising SDKs)

---

6. Privacy Manifest Configuration
Expo SDK 50+ handles most automatically, but verify your configuration includes:

{
  "NSPrivacyTracking": false,
  "NSPrivacyCollectedDataTypes": [
    {
      "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeEmailAddress",
      "NSPrivacyCollectedDataTypeLinked": true,
      "NSPrivacyCollectedDataTypeTracking": false,
      "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"]
    },
    {
      "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypePreciseLocation",
      "NSPrivacyCollectedDataTypeLinked": true,
      "NSPrivacyCollectedDataTypeTracking": false,
      "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"]
    }
  ]
}
Check if expo-privacy-manifest-plugin is needed or if automatic.

---

7. EAS Build Configuration
Update eas.json with submission details:

{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      }
    }
  }
}
Get these values from App Store Connect after creating app listing.

---

8. Demo Accounts (CRITICAL)
Create 3 test accounts with real functionality:

Account 1 - Primary Reviewer:

Email: reviewer@hearsay.ink
Password: Reviewer2024!
Pre-populate with 5-10 sample posts
Show variety: text, images, comments, votes
Account 2 - Secondary:

Email: demo@hearsay.ink
Password: Demo2024!
For testing interactions, blocking, reporting
Account 3 - Location Test:

Email: tokyo@hearsay.ink
Password: Tokyo2024!
Test with specific location
In App Store Connect Review Notes, include:

DEMO ACCOUNTS:
Primary: reviewer@hearsay.ink / Reviewer2024!
Secondary: demo@hearsay.ink / Demo2024!

TESTING INSTRUCTIONS:
1. Sign in with primary account
2. Grant location permission when prompted
3. Main feed shows posts within 5 miles
4. Test creating a post (tap + button)
5. Test voting (tap arrows on any post)
6. Test reporting: Tap "..." menu > Report > Select reason
7. Test blocking: Tap username > Block User

CONTENT MODERATION:
- Banned words filter active (try posting explicit terms - will be blocked)
- Image moderation via AWS Rekognition
- All reports reviewed within 24 hours
- Contact: support@hearsay.ink

PRIVACY & LEGAL:
Privacy Policy: https://www.hearsay.ink/privacy
Terms of Service: https://www.hearsay.ink/terms
Support: https://www.hearsay.ink/support
---

9. Pre-Submission QA Checklist
Functionality:

[ ] Fresh install works without crashes
[x] Sign up flow with clickable Terms/Privacy links works
[x] Community Guidelines modal shows once after signup
[x] Location permission priming screen appears
[x] Location permission flow works
[ ] Posts load in feed
[ ] Create post works (text and image)
[ ] Banned word filter blocks prohibited content
[ ] Image moderation rejects explicit images
[ ] Upvote/downvote works
[ ] Comments work
[ ] Block user works (tested in PostActionSheet)
[ ] Report post works (tested in PostActionSheet)
[ ] Logout works
[ ] Account deletion works
Legal Compliance:

[x] Terms link opens https://www.hearsay.ink/terms correctly
[x] Privacy link opens https://www.hearsay.ink/privacy correctly
[x] Support URL https://www.hearsay.ink/support accessible
[x] "By continuing..." text visible and clickable on signup
[x] Community guidelines screen shows once
[x] Location permission description matches app.json
Performance:

[ ] No crashes during normal usage
[ ] App launches within 3 seconds
[ ] No placeholder text ("Lorem ipsum", "TODO")
[ ] No debug information visible
[ ] All images load properly
---

10. Build & Submit Process
10.1 TestFlight Beta (RECOMMENDED)
Before full submission, test with internal testers:

eas build --platform ios --profile production
eas submit --platform ios --profile production
Beta test for 3-7 days:

Add internal testers (up to 100)
Collect feedback
Fix critical bugs
Create final production build
10.2 Final Submission
Run full QA checklist
Build production version: eas build --platform ios --profile production
Upload to App Store Connect
Fill out all metadata
Add demo account credentials to Review Notes
Submit for review
Export Compliance: Answer "Yes" to encryption (HTTPS), "Yes" to exempt (standard HTTPS is exempt)

---

Key Files That Need Creation/Modification
New files to create:

src/components/CommunityGuidelinesModal.jsx
src/components/LocationPermissionPrimer.jsx
src/services/moderation/contentFilter.js
src/services/moderation/imageModeration.js
src/services/moderation/spamDetection.js
Moderation dashboard (can be separate web app)
Files to modify:

src/app/signup.jsx - Add clickable Terms/Privacy links
src/app/login.jsx - Add clickable Terms/Privacy links
src/app/onboarding.jsx - Add Community Guidelines modal
src/services/posts/useCreatePost.js - Add content filtering
src/ui/components/PhotoPicker.jsx or photo upload service - Add image moderation
app.json - Add location permission strings
eas.json - Add submission configuration
assets/images/icon.png - Replace with final app icon
External tasks:

Create support page at hearsay.ink/support
Create app screenshots (6 images, 2 sizes)
Set up AWS Rekognition or Google Cloud Vision API
Create demo accounts
Create App Store Connect listing
---

Estimated Timeline
Week 1: Legal & onboarding (clickable links, guidelines modal, support page)

Week 2: Content moderation (text filtering, image moderation, spam detection)

Week 3: App Store prep (metadata, screenshots, icon, demo accounts)

Week 4: Testing & submission (QA checklist, TestFlight, final submission)

Review Period: 1-7 days typical (Apple's review)

---

Critical Blockers That MUST Be Fixed Before Submission
✅ Support page doesn't exist - hearsay.ink/support must be live
✅ Terms & Privacy links not clickable - Must be tappable on signup/login
✅ No location permission description - NSLocationWhenInUseUsageDescription missing in app.json
✅ No community guidelines modal - Required for UGC apps
❌ No proactive text content filtering - Required, will be rejected without it
❌ No image moderation - Required since app allows image uploads
❌ No app icon - 1024x1024 required
❌ No screenshots - Minimum 3 per device size required
❌ No demo accounts - Required for review
Without these, the app WILL be rejected by Apple.