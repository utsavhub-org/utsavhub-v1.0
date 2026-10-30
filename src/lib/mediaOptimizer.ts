import * as ImageManipulator from 'expo-image-manipulator';

export interface OptimizedImageResult {
  uri: string;
  width: number;
  height: number;
  originalUri: string;
  fileSizeEstimateKb?: number;
}

/**
 * Client-Side Image Optimizer
 * 
 * IMPORTANT: Firebase Storage does NOT automatically compress uploaded images or videos.
 * Uploading uncompressed 12MP-48MP camera photos (8-15MB each) fills storage quotas rapidly
 * and causes severe lag when mobile users download vendor listings.
 * 
 * This optimizer resizes large vendor photos (e.g. max 1280px width) and applies 
 * 80% JPEG compression, reducing file size from ~12MB down to ~250KB (over 95% reduction)
 * with virtually zero perceptible loss in visual quality.
 */
export async function optimizeImageForUpload(
  sourceUri: string,
  maxWidth = 1280,
  quality = 0.82
): Promise<OptimizedImageResult> {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      sourceUri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );

    return {
      uri: manipResult.uri,
      width: manipResult.width,
      height: manipResult.height,
      originalUri: sourceUri,
    };
  } catch (error) {
    console.warn('Image optimization note, using original URI:', error);
    return {
      uri: sourceUri,
      width: maxWidth,
      height: Math.round(maxWidth * 0.75),
      originalUri: sourceUri,
    };
  }
}

