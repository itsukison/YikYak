# Image Moderation Edge Function

This Supabase Edge Function provides automated image content moderation using AWS Rekognition to detect inappropriate content before it's published.

## Features

- Detects explicit nudity, violence, hate symbols, and disturbing content
- Automatically removes images that fail moderation
- Falls back gracefully if AWS is not configured
- Client-side validation for file size and format
- Configurable confidence thresholds

## Setup Instructions

### 1. AWS Rekognition Setup

1. **Create AWS Account** (if you don't have one)

   - Go to https://aws.amazon.com
   - Sign up for an account

2. **Create IAM User for Rekognition**

   - Go to AWS IAM Console
   - Create new user with programmatic access
   - Attach policy: `AmazonRekognitionFullAccess`
   - Save the Access Key ID and Secret Access Key

3. **Set Region**
   - Choose your preferred AWS region (e.g., `us-east-1`, `eu-west-1`)
   - Make sure Rekognition is available in that region

### 2. Configure Supabase Secrets

Run these commands in your terminal:

```bash
# Set AWS credentials as Supabase secrets
npx supabase secrets set AWS_ACCESS_KEY_ID=your_access_key_here
npx supabase secrets set AWS_SECRET_ACCESS_KEY=your_secret_key_here
npx supabase secrets set AWS_REGION=us-east-1
```

### 3. Deploy the Edge Function

```bash
# Deploy the function
npx supabase functions deploy moderate-image

# Test the function
npx supabase functions invoke moderate-image --data '{"imageUrl":"https://example.com/test-image.jpg"}'
```

### 4. Verify Integration

The image moderation is automatically integrated into:

- `src/services/storage/photoUpload.js` - Server-side moderation after upload
- `src/ui/components/PhotoPicker.jsx` - Client-side validation before upload
- `src/services/moderation/imageModeration.js` - Moderation service wrapper

## How It Works

1. **Client-side validation** (PhotoPicker):

   - Checks file size (max 10MB)
   - Checks dimensions (max 4096x4096)
   - Checks file format (JPEG, PNG, WebP)

2. **Upload to Supabase Storage** (photoUpload.js):

   - Image is uploaded to Supabase Storage
   - Gets public URL

3. **Server-side moderation** (Edge Function):

   - Calls AWS Rekognition DetectModerationLabels API
   - Analyzes image for prohibited content
   - Returns allowed/blocked status with labels

4. **Post-moderation action** (photoUpload.js):
   - If blocked: Delete image from storage, return error
   - If allowed: Return URL for use in post

## Moderation Categories

The function checks for these content categories:

- **Explicit Nudity** - Sexual content, nudity
- **Violence** - Graphic violence, weapons, blood
- **Hate Symbols** - Nazi symbols, hate group imagery
- **Visually Disturbing** - Gore, corpses
- **Rude Gestures** - Offensive hand gestures

## Confidence Threshold

Currently set to **60%** (configurable in `index.ts`):

- Higher value = stricter (more false positives)
- Lower value = more permissive (more false negatives)

Recommended: 50-70% for balanced moderation

## Fallback Behavior

If AWS credentials are not configured or service is unavailable:

- Function falls back to basic validation (file type, size)
- Allows images by default to not block legitimate users
- Logs errors for investigation

## Testing

### Test with sample images:

```bash
# Test with appropriate image (should allow)
curl -X POST https://your-project.supabase.co/functions/v1/moderate-image \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/appropriate-image.jpg"}'

# Expected response: {"allowed": true, "labels": [...]}
```

### Test moderation in app:

1. Try uploading various test images
2. Check console for moderation results
3. Verify blocked images are rejected
4. Verify appropriate images are allowed

## Costs

AWS Rekognition pricing (as of 2024):

- First 1 million images/month: $1.00 per 1,000 images
- After 1 million: $0.80 per 1,000 images

Example costs:

- 100 images/day = $3/month
- 1,000 images/day = $30/month
- 10,000 images/day = $300/month

## Monitoring

Monitor moderation performance:

1. Check Supabase Functions logs for errors
2. Track moderation results in application logs
3. Review AWS Rekognition CloudWatch metrics
4. Monitor costs in AWS Billing Dashboard

## Troubleshooting

### "AWS credentials not configured"

- Verify secrets are set: `npx supabase secrets list`
- Redeploy function after setting secrets

### "Failed to fetch image for moderation"

- Check that images are publicly accessible
- Verify Supabase Storage bucket is public

### Images not being moderated

- Check Supabase Functions logs: `npx supabase functions logs moderate-image`
- Verify function is deployed: `npx supabase functions list`
- Test function directly with curl

### High false positive rate

- Lower the MinConfidence threshold in `index.ts`
- Adjust prohibited categories list

## Security Notes

- Never commit AWS credentials to git
- Use Supabase secrets for credential management
- Rotate AWS keys periodically
- Use IAM user with minimal required permissions
- Monitor AWS CloudTrail for suspicious activity
