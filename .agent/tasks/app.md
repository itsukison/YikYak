HearSay App Store Submission Guide (Complete 2025 Edition)
Table of Contents
Pre-Submission Preparation

Mandatory Legal Documents

Technical Implementation Requirements

Content Moderation System

App Store Connect Configuration

Build & Submission Process

Review Preparation

Pre-Submission QA Checklist

Submission Timeline

1. Pre-Submission Preparation
1.1 Apple Developer Account
 Enroll in Apple Developer Program ($99/year)

 Complete two-factor authentication

 Accept latest program license agreement

1.2 Development Environment
 Ensure Expo SDK is up to date (SDK 50+)

 Test on physical iPhone device (not just simulator)

 Verify all third-party dependencies are App Store compliant

2. Mandatory Legal Documents
2.1 Privacy Policy (Hosted URL)
Requirement: Must be publicly accessible via a permanent URL.​

Content Checklist:

 Data Collected: Email, Location (Precise), User Content (Posts/Comments), Usage Data (votes)

 Purpose of Collection: "Location is used to show you posts from people nearby. Your exact location is never shared with other users."

 Data Retention: "Data is retained until account deletion or as required by law."

 User Rights: How users can access, modify, or delete their data

 Deletion Process: "Users can request account deletion via Settings > Account > Delete Account or by emailing support@hearsay.app"

 Third-Party Services: List all services:

Supabase (Database & Authentication)

PostHog (Analytics) - if applicable

Firebase (Push Notifications) - if applicable

AWS/Google Vision API (Content Moderation) - if applicable

 Contact Information: privacy@hearsay.app

 Children's Privacy: Statement that service is 17+ only

 International Users: If operating in EU: GDPR compliance statement

Hosting Options:

Vercel/Netlify (recommended for static hosting)

Your own domain: https://hearsay.app/privacy

GitHub Pages (free alternative)

Template Resources:

TermsFeed Privacy Policy Generator (customize for your needs)

Ensure it's specific, not generic AI-generated content

2.2 Terms of Service / EULA
Requirement: Mandatory for UGC apps to protect from liability.​

Option A (Not Recommended): Use Apple's default EULA
Option B (Recommended): Custom EULA including:

 Zero tolerance for objectionable content policy

 User conduct rules and prohibited content

 Content licensing (users grant you license to display their content)

 Account termination procedures

 Intellectual property rights

 Limitation of liability

 Dispute resolution and governing law

 Contact information

Hosting: Same as Privacy Policy (https://hearsay.app/terms)

2.3 Support URL
Requirement: Webpage where users can contact you.​

Minimum Requirements:

Contact form OR mailto: link

FAQ section (optional but recommended)

Response time expectation (e.g., "We respond within 48 hours")

Example: https://hearsay.app/support

Quick Setup:

Simple HTML page with contact form

Or use Typeform/Google Forms embedded

3. Technical Implementation Requirements
3.1 Onboarding Integration (CRITICAL)
3.1.1 Explicit Agreement ("Clickwrap")
Location: Signup/Login screen

Implementation:

jsx
<View style={styles.termsContainer}>
  <Text style={styles.termsText}>
    By continuing, you agree to our{' '}
    <Text 
      style={styles.link} 
      onPress={() => openURL('https://hearsay.app/terms')}
    >
      Terms of Service
    </Text>
    {' '}and{' '}
    <Text 
      style={styles.link}
      onPress={() => openURL('https://hearsay.app/privacy')}
    >
      Privacy Policy
    </Text>
    .
  </Text>
</View>
⚠️ Critical:

Must be visible BEFORE signup button

Text must be at least 12pt font

Links must be tappable and open in modal/webview

Do NOT hide in footer or fine print

3.1.2 Community Guidelines Acknowledgement
Location: After signup, before accessing main feed (first-time only)

Implementation:

jsx
<Modal visible={showGuidelines}>
  <View style={styles.guidelinesContainer}>
    <Text style={styles.title}>Welcome to HearSay</Text>
    <Text style={styles.subtitle}>Community Rules</Text>
    
    <View style={styles.rulesList}>
      <Text>• Be respectful to all users</Text>
      <Text>• No harassment, bullying, or hate speech</Text>
      <Text>• No explicit content or pornography</Text>
      <Text>• No illegal content or promotion of illegal acts</Text>
      <Text>• Violations will result in immediate removal</Text>
    </View>
    
    <Button onPress={handleAccept}>
      I Understand and Agree
    </Button>
  </View>
</Modal>
Storage: Track acceptance in user profile (prevent showing again)

3.1.3 Location Permission Priming
Location: Before requesting system location permission

Implementation:

jsx
<View style={styles.permissionPrimer}>
  <Icon name="location" size={48} />
  <Text style={styles.title}>
    Discover What's Happening Nearby
  </Text>
  <Text style={styles.description}>
    HearSay uses your location to show you posts from people around you. 
    Your exact location is never shared with other users.
  </Text>
  <Button onPress={requestLocationPermission}>
    Enable Location
  </Button>
  <Button variant="text" onPress={skipForNow}>
    Maybe Later
  </Button>
</View>
app.json Configuration:

json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "HearSay uses your location to show you posts from people nearby. Your exact location is never shared with other users.",
      "NSLocationAlwaysAndWhenInUseUsageDescription": "HearSay uses your location to show you posts from people nearby even when the app is in the background. Your exact location is never shared with other users."
    }
  }
}
3.2 Privacy Manifest (PrivacyInfo.xcprivacy)
Requirement: Mandatory for apps using certain APIs (UserDefaults, disk access, etc.).​

Implementation:
If using Expo SDK 50+, most is handled automatically. Verify your configuration:

Check Required APIs:

json
{
  "NSPrivacyTracking": false,
  "NSPrivacyTrackingDomains": [],
  "NSPrivacyCollectedDataTypes": [
    {
      "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeEmailAddress",
      "NSPrivacyCollectedDataTypeLinked": true,
      "NSPrivacyCollectedDataTypeTracking": false,
      "NSPrivacyCollectedDataTypePurposes": [
        "NSPrivacyCollectedDataTypePurposeAppFunctionality"
      ]
    },
    {
      "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypePreciseLocation",
      "NSPrivacyCollectedDataTypeLinked": true,
      "NSPrivacyCollectedDataTypeTracking": false,
      "NSPrivacyCollectedDataTypePurposes": [
        "NSPrivacyCollectedDataTypePurposeAppFunctionality"
      ]
    },
    {
      "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeUserID",
      "NSPrivacyCollectedDataTypeLinked": true,
      "NSPrivacyCollectedDataTypeTracking": false,
      "NSPrivacyCollectedDataTypePurposes": [
        "NSPrivacyCollectedDataTypePurposeAppFunctionality"
      ]
    }
  ],
  "NSPrivacyAccessedAPITypes": [
    {
      "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults",
      "NSPrivacyAccessedAPITypeReasons": ["CA92.1"]
    }
  ]
}
For Expo: Check if using expo-privacy-manifest-plugin or if automatic

3.3 Export Compliance
When Submitting: You'll answer these questions in App Store Connect

Questions:

Does your app use encryption?

Answer: Yes (HTTPS counts)

Is your app exempt from Export Compliance?

Answer: Yes (standard HTTPS is exempt)

If using Supabase/Custom Backend: Verify encryption type (usually exempt)

4. Content Moderation System
4.1 Proactive Filtering (REQUIRED)​
⚠️ Critical: Apple requires proactive prevention, not just reactive reporting.

4.1.1 Text Content Filtering
Implementation:

javascript
// banned-words-filter.js
const BANNED_WORDS = [
  'word1', 'word2', // Populate with explicit terms
  // Consider using: https://github.com/web-mech/badwords
];

export function filterContent(text) {
  const lowerText = text.toLowerCase();
  
  for (const word of BANNED_WORDS) {
    if (lowerText.includes(word)) {
      return {
        allowed: false,
        reason: 'Contains prohibited content'
      };
    }
  }
  
  return { allowed: true };
}

// In your post creation:
async function createPost(content) {
  const filterResult = filterContent(content);
  
  if (!filterResult.allowed) {
    throw new Error('Your post contains prohibited content and cannot be published.');
  }
  
  // Proceed with post creation
}
Recommended Libraries:

bad-words (npm package)

profanity-check (more advanced)

4.1.2 Image Content Filtering
Options:

Option A (Recommended): AWS Rekognition

javascript
import AWS from 'aws-sdk';

const rekognition = new AWS.Rekognition();

async function moderateImage(imageUrl) {
  const params = {
    Image: {
      S3Object: {
        Bucket: 'your-bucket',
        Name: 'image-key'
      }
    },
    MinConfidence: 75
  };
  
  const result = await rekognition.detectModerationLabels(params).promise();
  
  const hasExplicitContent = result.ModerationLabels.some(label =>
    ['Explicit Nudity', 'Violence', 'Hate Symbols'].includes(label.ParentName)
  );
  
  return !hasExplicitContent;
}
Option B: Google Cloud Vision API (similar implementation)

Option C (Budget): Manual review + user reporting (less reliable)

4.1.3 Spam Detection
Basic Implementation:

javascript
function detectSpam(content) {
  // Rate limiting
  if (userPostCountLastHour > 10) {
    return { isSpam: true, reason: 'Too many posts' };
  }
  
  // Repeated content
  if (isDuplicateOfRecentPost(content)) {
    return { isSpam: true, reason: 'Duplicate content' };
  }
  
  // Link spam
  const urlCount = (content.match(/https?:\/\//g) || []).length;
  if (urlCount > 2) {
    return { isSpam: true, reason: 'Too many links' };
  }
  
  return { isSpam: false };
}
4.2 Reactive Moderation (User Tools)
4.2.1 Block User Feature
Location: User profile, post menu ("...")

Functionality:

Hide all posts from blocked user

Prevent blocked user from seeing your posts

Persist in user preferences

4.2.2 Report Content Feature
Location: Post menu ("...")

Implementation:

javascript
const REPORT_REASONS = [
  'Harassment or bullying',
  'Hate speech or discrimination',
  'Explicit content',
  'Spam',
  'Violence or dangerous content',
  'False information',
  'Other'
];

async function reportPost(postId, reason, details) {
  await supabase.from('reports').insert({
    post_id: postId,
    reported_by: currentUserId,
    reason: reason,
    details: details,
    status: 'pending',
    created_at: new Date()
  });
  
  // Send notification to moderation team
  await sendModeratorAlert(postId, reason);
}
4.2.3 Moderation Dashboard
For You/Team:

Review reported content within 24 hours

See report history

Take actions: Remove content, ban user, dismiss report

Track moderation metrics

Basic Implementation:

Admin panel (can be web-based)

Email notifications for new reports

Action logging for audit trail

4.3 Moderation Response Protocol
Document this (for your records):

Severity Levels:

Low: Spam, minor violations → Remove content, warn user

Medium: Harassment, hateful content → Remove content, 7-day suspension

High: Explicit content, illegal activity → Remove content, permanent ban

Critical: Child exploitation, credible threats → Remove, ban, report to law enforcement

Response Times:

Standard reports: 24 hours

High severity: 2 hours

Critical: Immediate

Appeal Process:

Users can email support@hearsay.app

Review within 3 business days

Final decision communicated via email

5. App Store Connect Configuration
5.1 App Store Metadata​
5.1.1 App Information
App Name (30 characters max):

text
HearSay
or

text
HearSay - Nearby Social
Subtitle (30 characters max):​

text
Anonymous nearby posts
or

text
Share thoughts with locals
Category:

Primary: Social Networking

Secondary: News (optional)

5.1.2 Keywords (100 characters)​
Format: Comma-separated, no spaces

text
anonymous,local,nearby,social,community,posts,location,neighborhood,discuss,share,yik yak,gossip
Strategy:

Include competitors: "yik yak alternative"

Include use cases: "local news", "neighborhood chat"

Avoid brand name repetition (already in title)

5.1.3 Promotional Text (170 characters)
Updatable anytime without new version:

text
Join thousands discovering what's happening around them. Share anonymously, vote on posts, and connect with your local community. Download now!
5.1.4 Description (4000 characters max)
Structure:

Hook (1-2 sentences)

Key features (bullet points)

How it works

Safety & privacy

Call to action

Example:

text
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

Support: support@hearsay.app
Privacy Policy: hearsay.app/privacy
Terms: hearsay.app/terms
5.2 Screenshots & App Preview​
5.2.1 Required Screenshot Sizes
Mandatory (2025):

6.9-inch iPhone (1290 x 2796 pixels) - Portrait

13-inch iPad (2048 x 2732 pixels) - Portrait

Optional but Recommended:

6.9-inch Landscape (if app supports)

13-inch iPad Landscape

Format: PNG or JPEG, RGB color space, no alpha channel​

Number: Minimum 3, recommended 6-8

5.2.2 Screenshot Content Strategy​
Order Matters: First 2-3 visible without scrolling

Recommended Sequence:

Hero/Value Prop - "See what's happening nearby"

Feed View - Show real-looking posts (use demo content)

Posting - "Share your thoughts anonymously"

Voting - Show upvote/downvote interaction

Safety Features - Block & Report

Location Privacy - "Your location stays private"

Design Tips:

Add captions/text overlays explaining features

Use high-contrast colors

Show actual UI, not mockups

Include status bar for authenticity

Can use tools like: Figma, Sketch, Screenshots.pro

⚠️ Apple Requirements:

Must be from actual app (no external mockups)

No placeholder content visible

Consistent design language

5.2.3 App Icon
Size: 1024 x 1024 pixels
Format: PNG, no alpha channel, no rounded corners
Design:

Simple, recognizable at small sizes

Consistent with brand

No text if possible (doesn't scale well)

5.2.4 App Preview Video (Optional)
Length: 15-30 seconds
Content:

Quick feature overview

Show actual app usage

No external footage

Silent-friendly (add captions)

5.3 Age Rating
5.3.1 Questionnaire Answers
Expected "Yes" Responses:

Does your app contain user-generated content? YES

Does your app have unrestricted web access? YES (if you have external links)

Infrequent/Mild Profanity or Crude Humor? YES

Does your app use location services? YES

All Violence/Sexual Content: NO (you filter this)

Result: 17+ rating (expected and appropriate)

5.4 App Privacy Details
Data Collection Declaration:

Data Type	Linked to User	Used for Tracking	Purpose
Email Address	Yes	No	Account Creation
Precise Location	Yes	No	App Functionality
User ID	Yes	No	App Functionality
User Content	Yes	No	App Functionality
Usage Data	No	No	Analytics
Tracking: Select "No" unless using advertising SDKs

6. Build & Submission Process
6.1 EAS Configuration​
6.1.1 Initialize EAS
bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Initialize project
eas build:configure
6.1.2 Configure eas.json
json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "resourceClass": "large",
        "buildConfiguration": "Release"
      },
      "env": {
        "ENVIRONMENT": "production"
      }
    }
  },
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
6.1.3 app.json Configuration
Ensure these are set:

json
{
  "expo": {
    "name": "HearSay",
    "slug": "hearsay",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.hearsay",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "HearSay uses your location to show you posts from people nearby. Your exact location is never shared with other users.",
        "NSUserTrackingUsageDescription": "This identifier will be used to deliver personalized ads to you."
      },
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "privacy": "public"
  }
}
6.2 Production Build
bash
# Build for iOS
eas build --platform ios --profile production

# Wait for build (usually 10-20 minutes)
# Download .ipa file when complete
6.3 TestFlight Beta Testing (RECOMMENDED)
Before full submission:

bash
# Submit to TestFlight
eas submit --platform ios --profile production

# Or manual upload via Transporter app
Beta Testing Process:

Add internal testers (up to 100)

Distribute build via TestFlight

Test for 3-7 days

Collect feedback

Fix critical bugs

Submit final build for App Review

6.4 App Store Submission
Via EAS:

bash
eas submit --platform ios --profile production
Via App Store Connect:

Go to App Store Connect

My Apps > Your App > + Version

Enter version number (1.0.0)

Upload build (via Transporter or Xcode)

Fill out all metadata

Submit for Review

7. Review Preparation
7.1 Demo Accounts (CRITICAL)
Create Multiple Test Accounts:

Account 1 - Primary Reviewer Account:

text
Email: reviewer@hearsay.app
Password: Reviewer123!
Purpose: Main testing account with sample posts
Account 2 - Secondary Account:

text
Email: demo@hearsay.app
Password: Demo123!
Purpose: For testing interactions, blocking, reporting
Account 3 - Location Test Account:

text
Email: tokyo@hearsay.app
Password: Tokyo123!
Purpose: Test with specific location (if geofenced)
Prepare Accounts:

Pre-populate with 5-10 sample posts each

Include variety: text, images, comments, votes

Demonstrate all major features

Show blocking/reporting functionality

7.2 App Review Notes
In App Store Connect, add this to "Review Notes":

text
DEMO ACCOUNTS:
Primary: reviewer@hearsay.app / Reviewer123!
Secondary: demo@hearsay.app / Demo123!

TESTING INSTRUCTIONS:
1. Sign in with primary account
2. Grant location permission when prompted (or use GPX file below)
3. Main feed shows posts within 5 miles
4. Test creating a post (tap + button)
5. Test voting (tap arrows on any post)
6. Test reporting: Tap "..." menu > Report > Select reason
7. Test blocking: Tap username > Block User

LOCATION TESTING:
If testing outside coverage area, use this GPX file for Tokyo, Japan:
[Attach GPX file or provide coordinates: 35.6762, 139.6503]

CONTENT MODERATION:
- Banned words filter active (try posting explicit terms - will be blocked)
- All reports reviewed within 24 hours
- Contact for urgent moderation: support@hearsay.app

PRIVACY & LEGAL:
Privacy Policy: https://hearsay.app/privacy
Terms of Service: https://hearsay.app/terms
Support: https://hearsay.app/support
7.3 GPX File (If Geofenced)
Create GPX file for location simulation:

xml
<?xml version="1.0"?>
<gpx version="1.1">
  <wpt lat="35.6762" lon="139.6503">
    <name>Tokyo Test Location</name>
  </wpt>
</gpx>
Upload to App Store Connect: Review Notes > Attach File

7.4 Contact Information
Ensure accessible:

Support URL: Working and responsive

Support Email: Monitored daily during review

Phone Number: Optional but can speed up approval

8. Pre-Submission QA Checklist
8.1 Functionality Testing
 Fresh install works without crashes

 Sign up flow completes successfully

 Login flow works with test accounts

 Location permission flow works

 Location permission denial handled gracefully

 Posts load in feed

 Create post works (text only)

 Create post works (with image)

 Upvote/downvote works

 Comments work

 Block user works

 Report post works

 Settings screen accessible

 Logout works

 Account deletion works (if implemented)

8.2 Legal Compliance
 Terms of Service link opens correctly

 Privacy Policy link opens correctly

 Support URL accessible

 "By continuing..." text visible on signup

 Community guidelines screen shows once

 Location permission description matches app.json

 Age gate (17+) enforced if applicable

8.3 Content Moderation
 Banned words filter prevents bad posts

 Report feature submits successfully

 Block feature hides user content

 Image moderation working (if implemented)

 Spam detection prevents rapid posting

8.4 Performance & Stability
 No console errors on launch

 No crashes during normal usage

 App launches within 3 seconds

 Offline behavior handled (error messages shown)

 Network errors handled gracefully

 Images load properly

 Scroll performance smooth

8.5 Visual & UX
 No placeholder text ("Lorem ipsum", "TODO")

 No debug information visible

 App icon displays correctly

 Splash screen works

 All buttons tappable

 No broken images

 Proper spacing and alignment

 Dark mode support (optional)

8.6 Technical
 Bundle ID matches App Store Connect

 Version number correct (1.0.0)

 Build number increments

 Certificates valid

 Privacy manifest included

 Location permissions configured

 Export compliance set correctly

9. Submission Timeline
Week -4: Foundation
 Generate Privacy Policy & ToS

 Host documents (Vercel/Netlify)

 Set up support page

 Implement onboarding changes (clickwrap, guidelines)

 Add location permission priming

Week -3: Content Moderation
 Implement banned words filter

 Set up image moderation (if doing)

 Test block/report features thoroughly

 Create moderation dashboard

 Document moderation protocol

Week -2: App Store Prep
 Create App Store Connect listing

 Write app description

 Design and generate screenshots

 Create app icon (final version)

 Finalize keywords/metadata

 Fill out age rating questionnaire

 Complete privacy details form

Week -1: Testing & Accounts
 Create 3+ demo accounts

 Populate with sample content

 Run full QA checklist

 Test on multiple devices

 Create GPX file (if needed)

 Write App Review Notes

 TestFlight beta (optional)

Week 0: Build & Submit
Day 1:

 Run final tests

 Build production version (eas build)

 Download .ipa file

Day 2:

 Upload build to App Store Connect

 Verify metadata one last time

 Add demo account credentials

 Add review notes

Day 3:

 Submit for review

 Monitor email for Apple responses

 Be ready to respond quickly

Review Period (1-7 days typical)
 Check App Store Connect daily

 Respond to any Apple questions within 24 hours

 If rejected: Read feedback carefully, fix, resubmit

 If approved: Celebrate! 🎉

Post-Approval
 Set release date (manual vs. automatic)

 Prepare launch marketing

 Monitor crash reports

 Respond to user reviews

 Plan version 1.1 improvements

10. Common Rejection Reasons & How to Avoid
10.1 UGC Without Moderation​
Rejection: "Your app allows user-generated content but doesn't have adequate filtering."

Prevention:

✅ Implement proactive filtering (banned words)

✅ Show Block & Report features in screenshots

✅ Mention moderation in App Review Notes

✅ Document 24-hour response time

10.2 Hidden Terms/Privacy Policy
Rejection: "Users cannot easily access your Terms of Service."

Prevention:

✅ Make links prominent on signup screen

✅ Use tappable blue links, not gray footer text

✅ Test that links work in build

10.3 Location Permission Unclear
Rejection: "Your app's location permission description doesn't match usage."

Prevention:

✅ Match NSLocationWhenInUseUsageDescription exactly to app behavior

✅ Show permission primer before system prompt

✅ Never access location without permission

10.4 Broken Demo Accounts
Rejection: "We were unable to sign in with the provided credentials."

Prevention:

✅ Test demo accounts the day before submission

✅ Use simple passwords (no special characters that could be misread)

✅ Provide 2+ accounts

✅ Don't use temporary email services

10.5 Incomplete Metadata
Rejection: "Your app metadata is incomplete or contains errors."

Prevention:

✅ Fill out ALL fields in App Store Connect

✅ Provide both iPhone and iPad screenshots

✅ Proofread description for typos

✅ Ensure support URL works

Quick Reference Links
Apple Official:

App Store Review Guidelines

App Store Connect

Privacy Manifest Documentation

Expo:

EAS Build Documentation

EAS Submit Documentation

App Store Configuration

Tools:

TermsFeed Privacy Policy Generator

App Store Screenshot Generator

Keyword Research: App Annie