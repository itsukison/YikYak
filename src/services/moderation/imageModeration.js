import { supabase } from "../../adapters/supabaseClient";

/**
 * Moderate an image for inappropriate content
 * @param {string} imageUrl - Public URL of the uploaded image
 * @returns {Promise<{allowed: boolean, reason?: string, labels?: string[]}>}
 */
export async function moderateImage(imageUrl) {
  try {
    // Call Supabase Edge Function for moderation
    const { data, error } = await supabase.functions.invoke("moderate-image", {
      body: { imageUrl },
    });

    if (error) {
      console.error("Image moderation error:", error);
      // On error, default to allowing image to not block users
      // but log for investigation
      return {
        allowed: true,
        reason: "Moderation service unavailable - allowed by default",
        error: error.message,
      };
    }

    return data;
  } catch (error) {
    console.error("Image moderation exception:", error);
    // Fail open - allow image but log error
    return {
      allowed: true,
      reason: "Moderation service error - allowed by default",
      error: error.message,
    };
  }
}

/**
 * Moderate multiple images
 * @param {Array<string>} imageUrls - Array of public image URLs
 * @returns {Promise<{results: Array, blockedCount: number}>}
 */
export async function moderateImages(imageUrls) {
  const results = await Promise.all(
    imageUrls.map(async (url) => {
      const result = await moderateImage(url);
      return { url, ...result };
    })
  );

  const blockedCount = results.filter((r) => !r.allowed).length;

  return {
    results,
    blockedCount,
    allAllowed: blockedCount === 0,
  };
}

/**
 * Validate image before upload (client-side checks)
 * @param {object} asset - Image picker asset
 * @returns {{valid: boolean, error?: string}}
 */
export function validateImageBeforeUpload(asset) {
  // Check file size (max 10MB)
  if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
    return {
      valid: false,
      error: "Image is too large. Maximum size is 10MB.",
    };
  }

  // Check dimensions (max 4096x4096)
  if (asset.width && asset.height) {
    if (asset.width > 4096 || asset.height > 4096) {
      return {
        valid: false,
        error: "Image dimensions are too large. Maximum is 4096x4096 pixels.",
      };
    }
  }

  // Check mime type
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (asset.mimeType && !validTypes.includes(asset.mimeType.toLowerCase())) {
    return {
      valid: false,
      error: "Invalid image format. Please use JPEG, PNG, or WebP.",
    };
  }

  return { valid: true };
}

