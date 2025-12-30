import { supabase } from "../../adapters/supabaseClient";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { moderateImage } from "../moderation/imageModeration";

/**
 * Upload a photo to Supabase Storage with moderation
 * @param {string} userId - User ID for folder organization
 * @param {string} uri - Local file URI
 * @param {number} order - Photo order in post (0-4)
 * @returns {Promise<{url: string, error: null, moderated: true} | {url: null, error: string}>}
 */
export async function uploadPhoto(userId, uri, order) {
  try {
    console.log('[uploadPhoto] Received URI type:', typeof uri);
    console.log('[uploadPhoto] Received URI value:', uri);
    console.log('[uploadPhoto] Received URI JSON:', JSON.stringify(uri));
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${timestamp}_${order}.jpg`;

    // Ensure URI is a string
    const uriString = typeof uri === 'string' ? uri : (uri?.uri || String(uri));
    console.log('[uploadPhoto] Using URI string:', uriString);

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uriString, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("post-photos")
      .upload(filename, decode(base64), {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return { url: null, error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("post-photos").getPublicUrl(filename);

    // Moderate the uploaded image
    const moderationResult = await moderateImage(publicUrl);

    if (!moderationResult.allowed) {
      // Delete the uploaded image if it fails moderation
      await supabase.storage.from("post-photos").remove([filename]);

      return {
        url: null,
        error: moderationResult.reason || "Image contains prohibited content",
        moderationFailed: true,
        labels: moderationResult.labels,
      };
    }

    return { url: publicUrl, error: null, moderated: true };
  } catch (error) {
    console.error("Upload exception:", error);
    return { url: null, error: error.message };
  }
}

/**
 * Upload multiple photos with retry logic
 * @param {string} userId - User ID
 * @param {Array<string>} uris - Array of local file URIs
 * @param {number} maxRetries - Max retry attempts per photo
 * @returns {Promise<{urls: Array<string>, errors: Array<string>}>}
 */
export async function uploadPhotos(userId, uris, maxRetries = 3) {
  const results = [];
  const errors = [];

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success) {
      const { url, error } = await uploadPhoto(userId, uri, i);

      if (url) {
        results.push(url);
        success = true;
      } else {
        attempt++;
        if (attempt >= maxRetries) {
          errors.push(`Photo ${i + 1}: ${error}`);
        } else {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  return { urls: results, errors };
}

/**
 * Delete a photo from Supabase Storage
 * @param {string} photoUrl - Full public URL of the photo
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export async function deletePhoto(photoUrl) {
  try {
    // Extract filename from URL
    const urlParts = photoUrl.split("/post-photos/");
    if (urlParts.length < 2) {
      return { success: false, error: "Invalid photo URL" };
    }

    const filename = urlParts[1];

    const { error } = await supabase.storage
      .from("post-photos")
      .remove([filename]);

    if (error) {
      console.error("Delete error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Delete exception:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete multiple photos
 * @param {Array<string>} photoUrls - Array of photo URLs
 * @returns {Promise<{success: boolean, errors: Array<string>}>}
 */
export async function deletePhotos(photoUrls) {
  const errors = [];

  for (const url of photoUrls) {
    const { success, error } = await deletePhoto(url);
    if (!success) {
      errors.push(error);
    }
  }

  return { success: errors.length === 0, errors };
}
