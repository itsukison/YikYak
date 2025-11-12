import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compress and resize an image
 * @param {string} uri - Local file URI
 * @param {Object} options - Compression options
 * @returns {Promise<{uri: string, width: number, height: number}>}
 */
export async function compressImage(uri, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
  } = options;

  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return manipResult;
  } catch (error) {
    console.error('Compression error:', error);
    throw error;
  }
}

/**
 * Compress multiple images
 * @param {Array<string>} uris - Array of local file URIs
 * @param {Object} options - Compression options
 * @returns {Promise<Array<{uri: string, width: number, height: number}>>}
 */
export async function compressImages(uris, options = {}) {
  const results = [];

  for (const uri of uris) {
    try {
      const compressed = await compressImage(uri, options);
      results.push(compressed);
    } catch (error) {
      console.error(`Failed to compress ${uri}:`, error);
      // Use original if compression fails
      results.push({ uri, width: 0, height: 0 });
    }
  }

  return results;
}

/**
 * Get image dimensions without loading full image
 * @param {string} uri - Local file URI
 * @returns {Promise<{width: number, height: number}>}
 */
export async function getImageDimensions(uri) {
  try {
    const info = await ImageManipulator.manipulateAsync(uri, [], {
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return { width: info.width, height: info.height };
  } catch (error) {
    console.error('Failed to get dimensions:', error);
    return { width: 0, height: 0 };
  }
}
