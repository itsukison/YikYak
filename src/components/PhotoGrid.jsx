import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../utils/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = 40; // 20px on each side
const PHOTO_GAP = 8;

export default function PhotoGrid({ photos }) {
  const { colors } = useTheme();

  if (!photos || photos.length === 0) return null;

  const containerWidth = SCREEN_WIDTH - CARD_PADDING;

  const renderLayout = () => {
    switch (photos.length) {
      case 1:
        // Single photo: full width
        return (
          <View style={styles.container}>
            <Image
              source={{ uri: photos[0].photo_url }}
              style={[
                styles.singlePhoto,
                { borderRadius: 12, backgroundColor: colors.inputBackground },
              ]}
              resizeMode="cover"
            />
          </View>
        );

      case 2:
        // Two photos: side by side
        const twoPhotoWidth = (containerWidth - PHOTO_GAP) / 2;
        return (
          <View style={[styles.container, styles.row]}>
            {photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo.photo_url }}
                style={[
                  styles.photo,
                  {
                    width: twoPhotoWidth,
                    height: 200,
                    borderRadius: 12,
                    backgroundColor: colors.inputBackground,
                  },
                ]}
                resizeMode="cover"
              />
            ))}
          </View>
        );

      case 3:
        // Three photos: 2 top, 1 bottom full width
        const threePhotoWidth = (containerWidth - PHOTO_GAP) / 2;
        return (
          <View style={styles.container}>
            <View style={[styles.row, { marginBottom: PHOTO_GAP }]}>
              {photos.slice(0, 2).map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo.photo_url }}
                  style={[
                    styles.photo,
                    {
                      width: threePhotoWidth,
                      height: 150,
                      borderRadius: 12,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                  resizeMode="cover"
                />
              ))}
            </View>
            <Image
              source={{ uri: photos[2].photo_url }}
              style={[
                styles.photo,
                {
                  width: containerWidth,
                  height: 200,
                  borderRadius: 12,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              resizeMode="cover"
            />
          </View>
        );

      case 4:
        // Four photos: 2x2 grid
        const fourPhotoWidth = (containerWidth - PHOTO_GAP) / 2;
        return (
          <View style={styles.container}>
            <View style={[styles.row, { marginBottom: PHOTO_GAP }]}>
              {photos.slice(0, 2).map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo.photo_url }}
                  style={[
                    styles.photo,
                    {
                      width: fourPhotoWidth,
                      height: 150,
                      borderRadius: 12,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                  resizeMode="cover"
                />
              ))}
            </View>
            <View style={styles.row}>
              {photos.slice(2, 4).map((photo, index) => (
                <Image
                  key={index + 2}
                  source={{ uri: photo.photo_url }}
                  style={[
                    styles.photo,
                    {
                      width: fourPhotoWidth,
                      height: 150,
                      borderRadius: 12,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>
        );

      case 5:
        // Five photos: 2 top, 3 bottom
        const fivePhotoTopWidth = (containerWidth - PHOTO_GAP) / 2;
        const fivePhotoBottomWidth = (containerWidth - PHOTO_GAP * 2) / 3;
        return (
          <View style={styles.container}>
            <View style={[styles.row, { marginBottom: PHOTO_GAP }]}>
              {photos.slice(0, 2).map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo.photo_url }}
                  style={[
                    styles.photo,
                    {
                      width: fivePhotoTopWidth,
                      height: 150,
                      borderRadius: 12,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                  resizeMode="cover"
                />
              ))}
            </View>
            <View style={styles.row}>
              {photos.slice(2, 5).map((photo, index) => (
                <Image
                  key={index + 2}
                  source={{ uri: photo.photo_url }}
                  style={[
                    styles.photo,
                    {
                      width: fivePhotoBottomWidth,
                      height: 120,
                      borderRadius: 12,
                      backgroundColor: colors.inputBackground,
                    },
                  ]}
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return renderLayout();
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  singlePhoto: {
    width: '100%',
    height: 300,
  },
  photo: {
    // Dynamic styles applied inline
  },
});
