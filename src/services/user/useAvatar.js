import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../adapters/supabaseClient';
import { decode } from 'base64-arraybuffer';

export function useAvatar() {
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                return null;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

            // Read file as base64
            const base64 = await FileSystem.readAsStringAsync(imageFile.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, decode(base64), {
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
