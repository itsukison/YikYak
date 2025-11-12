import React from 'react';
import { View, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { useTheme } from '../utils/theme';
import { Body } from './ui';
import PhotoThumbnail from './PhotoThumbnail';

const MAX_PHOTOS = 5;

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
        const newPhotos = result.assets.map(asset => asset.uri);
        onPhotosChange([...photos, ...newPhotos].slice(0, MAX_PHOTOS));
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
            backgroundColor: isDisabled ? colors.inputBackground : colors.secondaryButton,
            opacity: isDisabled ? 0.5 : 1,
          },
        ]}
        onPress={pickImages}
        disabled={isDisabled}
      >
        <MaterialIcons
          name="image"
          size={20}
          color={isDisabled ? colors.textSecondary : colors.text}
        />
        <Body
          weight="medium"
          style={[
            styles.buttonText,
            { color: isDisabled ? colors.textSecondary : colors.text },
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
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  buttonText: {
    marginLeft: 12,
  },
});
