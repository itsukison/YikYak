import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../adapters/supabaseClient';
import { decode } from 'base64-arraybuffer';

export function useAvatar() {
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        try {
            // Request media library permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                const error = new Error('Photo library permission was denied. Please enable it in your device settings.');
                error.code = 'PERMISSION_DENIED';
                throw error;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
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
                throw new Error('No image was selected');
            }

            const selectedImage = result.assets[0];

            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];
            if (selectedImage.mimeType && !validTypes.includes(selectedImage.mimeType.toLowerCase())) {
                const error = new Error('Please select a JPEG, PNG, or HEIC image file');
                error.code = 'INVALID_FILE_TYPE';
                throw error;
            }

            return selectedImage;
        } catch (error) {
            console.error('Error picking image:', error);
            throw error;
        }
    };

    const uploadAvatar = async (currentUserId, imageFile) => {
        try {
            setUploading(true);

            // Validate input
            if (!currentUserId) {
                throw new Error('User ID is required to upload avatar');
            }

            if (!imageFile || !imageFile.uri) {
                throw new Error('No image file provided');
            }

            // Validate file size (5MB limit)
            const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
            if (imageFile.fileSize && imageFile.fileSize > MAX_FILE_SIZE) {
                const error = new Error('Image file is too large. Please select an image smaller than 5MB');
                error.code = 'FILE_TOO_LARGE';
                throw error;
            }

            // Get file extension
            const fileExt = imageFile.uri.split('.').pop()?.toLowerCase() || 'jpg';
            const validExtensions = ['jpg', 'jpeg', 'png', 'heic'];
            
            if (!validExtensions.includes(fileExt)) {
                const error = new Error('Invalid file format. Please use JPG, PNG, or HEIC');
                error.code = 'INVALID_FILE_FORMAT';
                throw error;
            }

            // Create file path
            const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Read file as base64
            console.log('Reading image file...');
            const base64 = await FileSystem.readAsStringAsync(imageFile.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Upload to Supabase Storage
            console.log('Uploading to Supabase Storage...');
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, decode(base64), {
                    contentType: imageFile.mimeType || 'image/jpeg',
                    upsert: true,
                });

            if (uploadError) {
                console.error('Supabase upload error:', uploadError);
                
                // Handle specific Supabase errors
                if (uploadError.message?.includes('not found')) {
                    throw new Error('Storage bucket not found. Please contact support.');
                } else if (uploadError.message?.includes('policy')) {
                    throw new Error('Permission denied. Please sign in again.');
                } else if (uploadError.message?.includes('size')) {
                    throw new Error('Image file is too large. Please select a smaller image.');
                } else {
                    throw new Error(`Upload failed: ${uploadError.message}`);
                }
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            if (!urlData || !urlData.publicUrl) {
                throw new Error('Failed to get image URL after upload');
            }

            console.log('Avatar uploaded successfully:', urlData.publicUrl);
            return urlData.publicUrl;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            
            // Re-throw with user-friendly message if not already set
            if (!error.message?.includes('Please') && !error.message?.includes('Failed')) {
                const userError = new Error('Failed to upload profile picture. Please try again.');
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
            const urlParts = avatarUrl.split('/avatars/');
            if (urlParts.length > 1) {
                const filePath = urlParts[1];
                
                console.log('Removing avatar from storage:', filePath);
                const { error } = await supabase.storage
                    .from('avatars')
                    .remove([filePath]);

                if (error) {
                    console.error('Error removing avatar from storage:', error);
                    // Don't throw error here - we still want to update the profile to null
                    // even if file deletion fails
                }
            }

            return null;
        } catch (error) {
            console.error('Error in removeAvatar:', error);
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
