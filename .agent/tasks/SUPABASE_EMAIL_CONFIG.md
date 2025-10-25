# Supabase Email Verification Configuration

## Important: Expo Go vs Standalone App

**You are currently using Expo Go!** This means email verification with deep links won't work the traditional way.

### For Expo Go Development:

- Custom schemes like `HearSay://` don't work in Expo Go
- You need to use a **web-based callback** instead
- The user will verify in a browser, then return to the app

### For Production (Standalone App):

- After running `npx expo prebuild` and creating a standalone build
- Custom schemes like `HearSay://` will work
- Email links will directly open your app

## Required Manual Configuration Steps

Since email templates and some auth settings can only be configured through the Supabase Dashboard, please complete these steps manually:

### 1. Configure Redirect URLs

**Path**: Supabase Dashboard → Authentication → URL Configuration

**For Expo Go (Development):**
Add your Expo development URL to "Redirect URLs":

```
exp://YOUR-IP-ADDRESS:8081
https://auth.expo.io/@YOUR-USERNAME/YOUR-SLUG
```

**For Standalone App (Production):**

```
HearSay://auth/callback
HearSay://**
```

To get your Expo development URL, run `npx expo start` and look for the URL in the terminal.

### 2. Customize Email Template

**Path**: Supabase Dashboard → Authentication → Email Templates → Confirm signup

**Replace the template with this:**

```html
<h2>Welcome to HearSay Japan! 🎉</h2>

<p>Hi there,</p>

<p>
  Thank you for signing up with your school email. Please verify your email
  address by clicking the button below:
</p>

<p style="text-align: center; margin: 32px 0;">
  <a
    href="{{ .ConfirmationURL }}"
    style="background-color: #FFCC00; color: #1C1C1E; padding: 14px 32px; text-decoration: none; border-radius: 20px; display: inline-block; font-weight: 600; font-size: 16px;"
  >
    Verify Email Address
  </a>
</p>

<p style="color: #8E8E93; font-size: 14px;">
  This link will expire in 24 hours.
</p>

<p style="color: #8E8E93; font-size: 14px;">
  If you didn't create an account with HearSay Japan, you can safely ignore this
  email.
</p>

<hr style="border: none; border-top: 1px solid #E5E5EA; margin: 32px 0;" />

<p style="color: #AEAEB2; font-size: 12px; text-align: center;">
  HearSay Japan - Connect with your university community
</p>
```

**Important Notes for Expo Go:**

- **Use `{{ .ConfirmationURL }}`** - This is correct for Expo Go! ([Reference](https://supabase.com/blog/react-native-authentication))
- The link opens in the browser, verifies the email, then closes
- The app automatically detects the verified session when it returns to foreground
- **NO custom deep links needed in Expo Go!**
- This template works for both Expo Go AND standalone builds

### 3. How Email Verification Works in Expo Go

When the user clicks "Verify Email Address" in the email:

1. **Browser opens** with the Supabase confirmation URL
2. **Supabase verifies** the token on the server
3. **Session is created** and stored in AsyncStorage
4. **Browser closes** automatically (or user closes it)
5. **User returns to app** (manually or automatically)
6. **App detects session** via `onAuthStateChange` in `useAuth.js`
7. **User is authenticated!** 🎉

**The deep link handler in `_layout.jsx` is NOT used in Expo Go** - the session is detected automatically via Supabase's `onAuthStateChange` listener.

### 4. Verify Email Confirmation is Enabled

**Path**: Supabase Dashboard → Authentication → Providers → Email

**Check these settings:**

- ✅ "Confirm email" should be **enabled**
- ✅ "Secure email change" should be **enabled** (recommended)

### 5. Optional: Create Schools Table (Future Enhancement)

If you want to prepare for multiple schools, run this in the SQL Editor:

```sql
-- Schools table for multi-university support
CREATE TABLE IF NOT EXISTS public.schools (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email_domain TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Waseda
INSERT INTO public.schools (name, email_domain)
VALUES ('Waseda University', 'waseda.jp')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Public read policy (anyone can see available schools)
CREATE POLICY "Schools are publicly readable"
  ON public.schools
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Add comment
COMMENT ON TABLE public.schools IS 'List of universities/schools that can use the app';
```

## Testing the Configuration

### Test Email Verification Flow:

1. **Sign Up**:

   - Navigate to login screen
   - Click "Sign Up"
   - Select "Waseda University"
   - Enter email with @waseda.jp domain
   - Enter password and confirm
   - Click "Create Account"

2. **Verify Email Screen**:

   - Should see "Check Your Email" screen
   - Email address should be displayed
   - Can click "Resend Email" (with 60s cooldown)

3. **Check Email**:

   - Open email from Supabase
   - Should have HearSay Japan branding
   - Click "Verify Email Address" button

4. **Browser Verification (Expo Go)**:

   - **Browser opens** (in-app or external)
   - You'll see a Supabase confirmation page
   - Wait a moment for verification
   - **Close the browser** (or it closes automatically)
   - **Return to the Expo Go app**

5. **App Detects Session**:

   - The app automatically detects your verified session
   - You'll be redirected to **onboarding** screen
   - (You might need to reload or bring app to foreground)

6. **Complete Onboarding**:
   - Enter username, nickname, bio
   - Should redirect to home screen

### Common Issues and Solutions:

**Issue**: "Invalid email domain" error

- **Solution**: Make sure email ends with `@waseda.jp`

**Issue**: Email not received

- **Solution**:
  - Check spam folder
  - Wait a few minutes (email delivery can be delayed)
  - Click "Resend Email" button
  - Verify email configuration in Supabase Dashboard

**Issue**: Deep link doesn't open app

- **Solution**:
  - On iOS: Make sure app.json has `"scheme": "HearSay"`
  - On Android: Check AndroidManifest.xml has intent-filter
  - Rebuild app with `npx expo prebuild`

**Issue**: "Token expired" error

- **Solution**:
  - Email links expire after 24 hours
  - Request a new verification email
  - Check that user clicked the link in time

**Issue**: Stuck on verify-email screen after verification

- **Solution**:
  - Manually navigate back to login
  - Try signing in with verified credentials
  - Check if session was created in Supabase Dashboard

**Issue**: Browser shows "Confirmation successful" but app doesn't redirect to onboarding

- **Solution (Expo Go)**:
  - **This is normal!** The browser won't auto-redirect in Expo Go
  - **Close the browser manually**
  - **Go back to your Expo Go app**
  - The app should detect the session and redirect you to onboarding
  - If it doesn't, try pulling down to refresh on the verify-email screen
  - The session is stored in AsyncStorage, so it persists

**Issue**: Email link opens but shows error page

- **Solution**:
  - Check that you're using `{{ .ConfirmationURL }}` in the email template (NOT a custom URL)
  - Verify email confirmation is enabled in Supabase Dashboard
  - Try a different browser or clear browser cache
  - Check Supabase Dashboard → Auth → Users to see if email was verified

## Verification Checklist (Expo Go)

- [ ] Email template updated with `{{ .ConfirmationURL }}` (NOT custom deep links)
- [ ] Email confirmation is enabled in Supabase Dashboard
- [ ] Test signup with waseda.jp subdomain email (e.g., `test@fuji.waseda.jp`)
- [ ] Verification email received (check spam folder)
- [ ] Browser opens when clicking email link
- [ ] Browser shows "Confirmation successful" message
- [ ] Close browser and return to Expo Go app
- [ ] App detects session and redirects to onboarding
- [ ] User can complete onboarding and access home screen
- [ ] Database has school_name column populated

## Next Steps

After completing this configuration:

1. Test the complete signup flow end-to-end
2. Test on both iOS and Android devices
3. Verify email template renders correctly in different email clients
4. Test resend email functionality
5. Test error handling (expired links, wrong email, etc.)

## Support

If you encounter issues:

- Check Supabase logs in Dashboard → Logs → Auth
- Check app console logs for error messages
- Verify all configuration steps were completed
- Test with a real device (not just simulator)
