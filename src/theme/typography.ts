import { Platform, PixelRatio, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive font scaler based on standard mobile width (375px - iPhone 13/14)
export function responsiveFont(size: number, maxScale: number = 1.25): number {
  const scale = SCREEN_WIDTH / 375;
  const newSize = size * Math.min(scale, maxScale);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
}

export const FONTS = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',

  // Fallbacks if fonts are loading
  systemSans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }),
  systemBold: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }),
};

