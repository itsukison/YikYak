import React from 'react';
import { View, Image, StyleSheet, Dimensions, ScrollView, Pressable } from 'react-native';
import { useTheme } from '../utils/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = 40; // 20px on each side
const PHOTO_GAP = 12;

export default function PhotoGrid({ photos, onPress }) {
  const { colors } = useTheme();

  if (!photos || photos.length === 0) return null;

  const containerWidth = SCREEN_WIDTH - CARD_PADDING;

  // Single photo: full width (static)
  if (photos.length === 1) {
    return (
      <View style={styles.container}>
        <Pressable onPress={onPress}>
          <Image
            source={{ uri: photos[0].photo_url }}
            style={[
              styles.singlePhoto,
              { borderRadius: 12, backgroundColor: colors.inputBackground },
            ]}
            resizeMode="cover"
          />
        </Pressable>
      </View>
    );
  }

  // Multiple photos: Horizontal ScrollView
  // We want to show a peek of the next/prev photo.
  // We'll use a width slightly smaller than the container.
  const photoWidth = containerWidth * 0.85; // 85% width to show clear edges of next/prev
  const visualSidePadding = (containerWidth - photoWidth) / 2;
  const itemSpacing = PHOTO_GAP / 2;
  const contentPadding = visualSidePadding - itemSpacing;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: contentPadding,
        }}
        decelerationRate="fast"
        snapToInterval={photoWidth + PHOTO_GAP}
        snapToAlignment="start"
        pagingEnabled={false}
      >
        {photos.map((photo, index) => (
          <Pressable key={index} onPress={onPress}>
            <Image
              source={{ uri: photo.photo_url }}
              style={{
                width: photoWidth,
                height: 300,
                borderRadius: 12,
                backgroundColor: colors.inputBackground,
                marginHorizontal: itemSpacing,
              }}
              resizeMode="cover"
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  singlePhoto: {
    width: '100%',
    height: 300,
  },
});
