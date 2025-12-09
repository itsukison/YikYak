import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../adapters/supabaseClient';
import { decode } from 'base64-arraybuffer';

export function useAvatar() {
    const [uploading, setUploading] = useState(false);

    const [status, requestPermission] = ImagePicker.useMediaLibraryPermissions();

    const pickImage = async () => {
        try {
            if (!status?.granted) {
                const permission = await requestPermission();
                if (!permission.granted) {
                    return null;
                }
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                return result.assets[0];
            }
            return null;
        } catch (error) {
            console.error('Error picking image:', error);
            throw error;
        }
    };

    const uploadAvatar = async (currentUserId, imageFile) => {
        try {
            setUploading(true);

            if (!imageFile.uri) {
                throw new Error('No image URI found');
            }

            const fileExt = imageFile.uri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Create blob from URI
            const response = await fetch(imageFile.uri);
            const blob = await response.blob();

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, {
                    contentType: imageFile.mimeType || 'image/jpeg',
                    upsert: true,
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const removeAvatar = async (currentUserId, avatarUrl) => {
        // Optional: Delete from storage if you want to clean up
        // For now, we just return null to update the profile
        return null;
    };

    return {
        pickImage,
        uploadAvatar,
        removeAvatar,
        uploading,
    };
}
