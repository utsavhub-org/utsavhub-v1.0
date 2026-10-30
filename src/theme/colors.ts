import { Platform } from 'react-native';

export const THEME = {
  colors: {
    // Canvas & Core (Open-Source Radix & Apple Pure Luxury)
    canvas: '#FAF9F6',          // Warm porcelain ivory
    canvasSubtle: '#F4F2ED',
    card: '#FFFFFF',
    surface: '#F5F5F7',
    surfaceSubtle: '#FAFAFB',
    surfaceElevated: '#FFFFFF',

    // Deep Luxe Typography (True High-End Contrast)
    textPrimary: '#0B0B0E',     // Deepest obsidian black
    textSecondary: '#4A4852',   // Refined editorial slate
    textMuted: '#8E8B99',       // Soft muted caption
    textInverse: '#FFFFFF',

    // Champagne & Antique Gold Accent (Matching official Mandala logo)
    gold: '#C5A059',
    goldLight: '#F7E7C4',
    goldDark: '#8C6F34',
    goldGlow: 'rgba(197, 160, 89, 0.15)',
    goldBorder: 'rgba(197, 160, 89, 0.35)',

    // Crisp Clean Hairline Borders (Retina/OLED Crisp)
    border: '#E8E6E1',
    borderSubtle: '#F0EFEA',
    borderDark: '#262626',

    // Primary Luxury Buttons & Accents (Obsidian & Ivory)
    burgundy: '#0B0B0E',
    burgundySurface: '#F5F5F7',
    burgundyBorder: 'rgba(197, 160, 89, 0.25)',

    // Accents & Status
    accentDark: '#0B0B0E',
    danger: '#E11D48',
    dangerBg: '#FFF1F2',
    success: '#059669',
    successBg: '#ECFDF5',
  },
  fonts: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
  },
  shadows: {
    subtle: {
      shadowColor: '#0B0B0E',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    float: {
      shadowColor: '#0B0B0E',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 4,
    },
  },
};
