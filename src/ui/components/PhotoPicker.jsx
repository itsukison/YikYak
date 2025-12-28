import React from 'react';
import { View, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image as ImageIcon } from "lucide-react-native";
import { useTheme } from '../../config/theme';
import { Body } from './ui';
import PhotoThumbnail from './PhotoThumbnail';
import { validateImageBeforeUpload } from '../../services/moderation/imageModeration';

const MAX_PHOTOS = 3;

export default function PhotoPicker({ photos, onPhotosChange }) {
  const { colors } = useTheme();

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to attach photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      Alert.alert('Limit Reached', `You can only attach up to ${MAX_PHOTOS} photos.`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled && result.assets) {
        // Validate each image before adding
        const validPhotos = [];
        const errors = [];

        console.log('[PhotoPicker] Raw result.assets:', JSON.stringify(result.assets, null, 2));

        for (const asset of result.assets) {
          console.log('[PhotoPicker] Processing asset:', JSON.stringify(asset, null, 2));
          console.log('[PhotoPicker] asset.uri type:', typeof asset.uri);
          console.log('[PhotoPicker] asset.uri value:', asset.uri);
          
          const validation = validateImageBeforeUpload(asset);
          if (validation.valid) {
            // Explicitly ensure we're pushing a STRING, not an object
            const uriString = typeof asset.uri === 'string' ? asset.uri : asset.uri?.uri || String(asset.uri);
            console.log('[PhotoPicker] Pushing URI (type: ' + typeof uriString + '):', uriString);
            validPhotos.push(uriString);
          } else {
            errors.push(validation.error);
          }
        }
        
        console.log('[PhotoPicker] Final validPhotos array:', validPhotos);

        if (errors.length > 0) {
          Alert.alert(
            'Invalid Images',
            errors.join('\n'),
            [{ text: 'OK' }]
          );
        }

        if (validPhotos.length > 0) {
          onPhotosChange([...photos, ...validPhotos].slice(0, MAX_PHOTOS));
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const isDisabled = photos.length >= MAX_PHOTOS;

  return (
    <View style={styles.container}>
      {/* Photo Thumbnails */}
      {photos.length > 0 && (
        <View style={styles.thumbnailGrid}>
          {photos.map((uri, index) => (
            <PhotoThumbnail
              key={index}
              uri={uri}
              onRemove={() => removePhoto(index)}
              size={80}
            />
          ))}
        </View>
      )}

      {/* Attach Photos Button */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isDisabled ? colors.surface : colors.ghost,
            opacity: isDisabled ? 0.5 : 1,
          },
        ]}
        onPress={pickImages}
        disabled={isDisabled}
      >
        <ImageIcon
          size={20}
          color={isDisabled ? colors.textSecondary : colors.ghostText}
        />
        <Body
          style={[
            styles.buttonText,
            { color: isDisabled ? colors.textSecondary : colors.ghostText },
          ]}
        >
          Attach Photos ({photos.length}/{MAX_PHOTOS})
        </Body>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  thumbnailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    minHeight: 48,
  },
  buttonText: {
    marginLeft: 12,
    fontWeight: '600',
  },
});
