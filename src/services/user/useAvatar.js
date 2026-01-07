import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { supabase } from "../../adapters/supabaseClient";
import { decode } from "base64-arraybuffer";

export function useAvatar() {
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      // Request media library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        const error = new Error(
          "Photo library permission was denied. Please enable it in your device settings."
        );
        error.code = "PERMISSION_DENIED";
        throw error;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      // User canceled the picker
      if (result.canceled) {
        return null;
      }

      // Validate result
      if (!result.assets || result.assets.length === 0) {
        throw new Error("No image was selected");
      }

      const selectedImage = result.assets[0];

      // Validate file type (allow common image formats - we'll convert to JPEG)
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/heic",
        "image/webp",
      ];
      if (
        selectedImage.mimeType &&
        !validTypes.includes(selectedImage.mimeType.toLowerCase())
      ) {
        const error = new Error(
          "Please select a valid image file (JPEG, PNG, HEIC, or WebP)"
        );
        error.code = "INVALID_FILE_TYPE";
        throw error;
      }

      return selectedImage;
    } catch (error) {
      console.error("Error picking image:", error);
      throw error;
    }
  };

  const uploadAvatar = async (currentUserId, imageFile) => {
    try {
      setUploading(true);

      // Validate input
      if (!currentUserId) {
        throw new Error("User ID is required to upload avatar");
      }

      if (!imageFile || !imageFile.uri) {
        throw new Error("No image file provided");
      }

      // Validate file size before processing (10MB limit for original, will be reduced after optimization)
      const MAX_ORIGINAL_FILE_SIZE = 10 * 1024 * 1024; // 10MB for original
      if (imageFile.fileSize && imageFile.fileSize > MAX_ORIGINAL_FILE_SIZE) {
        const error = new Error(
          "Image file is too large. Please select an image smaller than 10MB"
        );
        error.code = "FILE_TOO_LARGE";
        throw error;
      }

      // OPTIMIZATION: Resize to 400x400 and convert to JPEG
      console.log("Optimizing image (resize to 400x400, convert to JPEG)...");
      const optimizedImage = await ImageManipulator.manipulateAsync(
        imageFile.uri,
        [{ resize: { width: 400, height: 400 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG, // Always convert to JPEG
        }
      );

      // Check optimized file size (should be < 1MB after optimization)
      const optimizedFileInfo = await FileSystem.getInfoAsync(
        optimizedImage.uri
      );
      const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB for optimized
      if (optimizedFileInfo.size && optimizedFileInfo.size > MAX_FILE_SIZE) {
        // Try higher compression if still too large
        console.log("Image still too large, applying higher compression...");
        const recompressed = await ImageManipulator.manipulateAsync(
          optimizedImage.uri,
          [],
          {
            compress: 0.5, // Higher compression
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
        optimizedImage.uri = recompressed.uri;
      }

      // Create file path (always .jpg extension now)
      const fileName = `${currentUserId}/${Date.now()}.jpg`;
      const filePath = `${fileName}`;

      // Read optimized file as base64
      console.log("Reading optimized image...");
      const base64 = await FileSystem.readAsStringAsync(optimizedImage.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Upload to Supabase Storage (always JPEG now)
      console.log("Uploading to Supabase Storage...");
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, decode(base64), {
          contentType: "image/jpeg", // Always JPEG after optimization
          upsert: true,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);

        // Handle specific Supabase errors
        if (uploadError.message?.includes("not found")) {
          throw new Error("Storage bucket not found. Please contact support.");
        } else if (uploadError.message?.includes("policy")) {
          throw new Error("Permission denied. Please sign in again.");
        } else if (uploadError.message?.includes("size")) {
          throw new Error(
            "Image file is too large. Please select a smaller image."
          );
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        throw new Error("Failed to get image URL after upload");
      }

      console.log("Avatar uploaded successfully:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);

      // Re-throw with user-friendly message if not already set
      if (
        !error.message?.includes("Please") &&
        !error.message?.includes("Failed")
      ) {
        const userError = new Error(
          "Failed to upload profile picture. Please try again."
        );
        userError.originalError = error;
        throw userError;
      }

      throw error;
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async (currentUserId, avatarUrl) => {
    try {
      if (!avatarUrl) {
        return null;
      }

      // Extract file path from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/avatars/[userId]/[filename]
      const urlParts = avatarUrl.split("/avatars/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];

        console.log("Removing avatar from storage:", filePath);
        const { error } = await supabase.storage
          .from("avatars")
          .remove([filePath]);

        if (error) {
          console.error("Error removing avatar from storage:", error);
          // Don't throw error here - we still want to update the profile to null
          // even if file deletion fails
        }
      }

      return null;
    } catch (error) {
      console.error("Error in removeAvatar:", error);
      // Don't throw - just log and return null
      return null;
    }
  };

  return {
    pickImage,
    uploadAvatar,
    removeAvatar,
    uploading,
  };
}
