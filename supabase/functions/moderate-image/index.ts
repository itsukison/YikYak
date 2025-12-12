import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { RekognitionClient, DetectModerationLabelsCommand } from "https://esm.sh/@aws-sdk/client-rekognition@3.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ModerationResult {
  allowed: boolean
  reason?: string
  labels?: string[]
  confidence?: number
}

/**
 * Moderate image using AWS Rekognition
 * Falls back to basic checks if AWS is not configured
 */
async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  try {
    // Check if AWS credentials are configured
    const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')
    const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')
    const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1'

    if (!awsAccessKeyId || !awsSecretAccessKey) {
      console.warn('AWS credentials not configured, using basic validation only')
      return basicImageValidation(imageUrl)
    }

    // Fetch image from URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      return {
        allowed: false,
        reason: 'Failed to fetch image for moderation'
      }
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBytes = new Uint8Array(imageBuffer)

    // Call AWS Rekognition DetectModerationLabels
    const result = await detectModerationLabels(
      imageBytes,
      awsAccessKeyId,
      awsSecretAccessKey,
      awsRegion
    )

    return result
  } catch (error) {
    console.error('Image moderation error:', error)
    // On error, default to allowing image but log the issue
    // In production, you might want to be more strict
    return {
      allowed: true,
      reason: 'Moderation service error - allowed by default'
    }
  }
}

/**
 * Call AWS Rekognition DetectModerationLabels API using AWS SDK
 */
async function detectModerationLabels(
  imageBytes: Uint8Array,
  accessKeyId: string,
  secretAccessKey: string,
  region: string
): Promise<ModerationResult> {
  try {
    // Create Rekognition client
    const client = new RekognitionClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    // Create command
    const command = new DetectModerationLabelsCommand({
      Image: {
        Bytes: imageBytes,
      },
      MinConfidence: 60, // Adjust threshold as needed (0-100)
    })

    // Send command
    const response = await client.send(command)

    // Check for problematic labels
    const prohibitedCategories = [
      'Explicit Nudity',
      'Violence',
      'Hate Symbols',
      'Visually Disturbing',
      'Rude Gestures',
    ]

    const problematicLabels = response.ModerationLabels?.filter((label) =>
      prohibitedCategories.some(
        (cat) => label.ParentName === cat || label.Name === cat
      )
    ) || []

    if (problematicLabels.length > 0) {
      return {
        allowed: false,
        reason: 'Image contains prohibited content',
        labels: problematicLabels.map((l) => l.Name || 'Unknown'),
        confidence: Math.max(...problematicLabels.map((l) => l.Confidence || 0)),
      }
    }

    return {
      allowed: true,
      labels: response.ModerationLabels?.map((l) => l.Name || 'Unknown') || [],
    }
  } catch (error) {
    console.error('AWS Rekognition error:', error)
    throw error
  }
}

/**
 * Basic image validation when AWS is not configured
 * Checks file size, dimensions, and basic properties
 */
async function basicImageValidation(imageUrl: string): Promise<ModerationResult> {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' })
    
    const contentType = response.headers.get('content-type')
    const contentLength = parseInt(response.headers.get('content-length') || '0')

    // Check content type
    if (!contentType?.startsWith('image/')) {
      return {
        allowed: false,
        reason: 'Invalid file type - must be an image'
      }
    }

    // Check file size (max 10MB)
    if (contentLength > 10 * 1024 * 1024) {
      return {
        allowed: false,
        reason: 'Image too large - maximum 10MB'
      }
    }

    // If basic checks pass, allow
    return {
      allowed: true,
      reason: 'Basic validation passed (AWS moderation not configured)'
    }
  } catch (error) {
    console.error('Basic validation error:', error)
    return {
      allowed: true,
      reason: 'Validation error - allowed by default'
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'imageUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Moderate the image
    const result = await moderateImage(imageUrl)

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        allowed: true // Fail open to not block legitimate users
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

