import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  Platform,
  Easing,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../theme/colors';
import { playAppOpeningSound, playButtonClick } from '../lib/soundManager';

interface AppOpeningIntroProps {
  onAnimationFinish: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const START_SIZE = 124;
const TARGET_SIZE = 50;

export default function AppOpeningIntro({ onAnimationFinish }: AppOpeningIntroProps) {
  const insets = useSafeAreaInsets();
  const lottieRef = useRef<LottieView>(null);

  // Background & Atmosphere Drivers
  const bgOpacity = useRef(new Animated.Value(1)).current;
  const atmosphereOpacity = useRef(new Animated.Value(1)).current;

  // Emblem Transform & Motion Drivers
  const emblemOpacity = useRef(new Animated.Value(0)).current;
  const emblemScaleIntro = useRef(new Animated.Value(0.55)).current;
  const emblemMoveX = useRef(new Animated.Value(0)).current;
  const emblemMoveY = useRef(new Animated.Value(0)).current;
  const emblemScaleGlide = useRef(new Animated.Value(1)).current;

  // Emblem Frame & Border Fade Drivers (melts away to match header logo)
  const emblemFrameBgOpacity = useRef(new Animated.Value(1)).current;
  const emblemBorderOpacity = useRef(new Animated.Value(1)).current;
  const emblemShadowOpacity = useRef(new Animated.Value(1)).current;

  // Specular Light Sweep Driver
  const shimmerTranslate = useRef(new Animated.Value(-160)).current;
  const shimmerOpacity = useRef(new Animated.Value(0)).current;

  // Typography Drivers
  const textGroupOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(18)).current;
  const hairlineScaleX = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(12)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;

  // Calculate Header Docking Position
  const containerWidth = SCREEN_WIDTH > 520 ? 520 : SCREEN_WIDTH;
  const containerLeft = (SCREEN_WIDTH - containerWidth) / 2;

  // Target Header Logo center coordinates
  const targetLeft = containerLeft + 16;
  const targetTop = (insets.top || (Platform.OS === 'ios' ? 44 : 24)) + 10;
  const targetCenterX = targetLeft + TARGET_SIZE / 2;
  const targetCenterY = targetTop + TARGET_SIZE / 2;

  // Start Emblem center coordinates
  const startCenterX = SCREEN_WIDTH / 2;
  const startCenterY = SCREEN_HEIGHT / 2 - 40;

  // Translation deltas
  const deltaX = targetCenterX - startCenterX;
  const deltaY = targetCenterY - startCenterY;
  const targetScale = TARGET_SIZE / START_SIZE;

  useEffect(() => {
    // 0. Trigger Sacred Golden Bell Chime at start
    playAppOpeningSound();

    // Trigger Lottie vector animation
    if (lottieRef.current) {
      lottieRef.current.play();
    }

    // Master Cinematic Sequence
    Animated.sequence([
      // Step 1: Center Stage Bloom (Emblem springs in while Lottie particles burst)
      Animated.parallel([
        Animated.timing(emblemOpacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(emblemScaleIntro, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),

      // Step 2: Specular Golden Light Sweep glides across the mandala
      Animated.parallel([
        Animated.timing(shimmerOpacity, {
          toValue: 0.95,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerTranslate, {
          toValue: 180,
          duration: 600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Step 3: Typography & Hairline Reveal
      Animated.parallel([
        Animated.timing(textGroupOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(hairlineScaleX, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 0.85,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),

      // Step 4: Dramatic luxury appreciation hold
      Animated.delay(650),

      // Step 5: THE HERO GLIDE — Logo moves & settles into the homepage header!
      Animated.parallel([
        // A. Fade out typography, Lottie burst and dark background to reveal Home Screen
        Animated.timing(textGroupOpacity, {
          toValue: 0,
          duration: 350,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(atmosphereOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(bgOpacity, {
          toValue: 0,
          duration: 680,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),

        // B. Melts frame background & border to seamlessly match header logo
        Animated.timing(emblemFrameBgOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(emblemBorderOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(emblemShadowOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),

        // C. Smooth cinematic glide of emblem to top-left header position
        Animated.timing(emblemMoveX, {
          toValue: deltaX,
          duration: 680,
          easing: Easing.bezier(0.2, 0.8, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(emblemMoveY, {
          toValue: deltaY,
          duration: 680,
          easing: Easing.bezier(0.2, 0.8, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(emblemScaleGlide, {
          toValue: targetScale,
          duration: 680,
          easing: Easing.bezier(0.2, 0.8, 0.25, 1),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Gentle tactile docking click as logo settles into header
      playButtonClick();
      onAnimationFinish();
    });
  }, [
    onAnimationFinish,
    deltaX,
    deltaY,
    targetScale,
    bgOpacity,
    atmosphereOpacity,
    emblemOpacity,
    emblemScaleIntro,
    emblemMoveX,
    emblemMoveY,
    emblemScaleGlide,
    emblemFrameBgOpacity,
    emblemBorderOpacity,
    emblemShadowOpacity,
    shimmerOpacity,
    shimmerTranslate,
    textGroupOpacity,
    titleTranslateY,
    hairlineScaleX,
    subtitleTranslateY,
    badgeOpacity,
  ]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* 1. Dissolving Dark Velvet Background Overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]}>
        <LinearGradient
          colors={['#040406', '#140E04', '#040406']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* 2. Vector Lottie Particle & Sacred Geometric Ring Burst */}
      <Animated.View style={[styles.lottieContainer, { opacity: atmosphereOpacity }]}>
        <LottieView
          ref={lottieRef}
          source={require('../../assets/animations/luxury_gold_intro.json')}
          autoPlay
          loop={false}
          style={styles.lottieAnimation}
        />
      </Animated.View>

      {/* 3. Center Typography & Heritage Tagline (Fades out before glide) */}
      <Animated.View
        style={[
          styles.typographyLayer,
          {
            opacity: textGroupOpacity,
            top: startCenterY + START_SIZE / 2 + 18,
          },
        ]}
      >
        <Animated.View style={{ transform: [{ translateY: titleTranslateY }] }}>
          <View style={styles.titleRow}>
            <Text style={styles.brandTitleText}>UTSAV</Text>
            <Text style={styles.brandTitleGold}>HUB</Text>
          </View>

          {/* Symmetrical Expanding Hairline with Diamond Knot */}
          <Animated.View
            style={[
              styles.hairlineRow,
              { transform: [{ scaleX: hairlineScaleX }] },
            ]}
          >
            <View style={styles.hairlineLeft} />
            <View style={styles.goldDiamond} />
            <View style={styles.hairlineRight} />
          </Animated.View>
        </Animated.View>

        <Animated.View
          style={[
            styles.subtitleContainer,
            { transform: [{ translateY: subtitleTranslateY }] },
          ]}
        >
        </Animated.View>
      </Animated.View>

      {/* 4. Minimal Bottom Verification Watermark */}
      <Animated.View
        style={[
          styles.bottomWatermark,
          { opacity: badgeOpacity },
        ]}
      >
        <View style={styles.bottomDot} />
        <Text style={styles.bottomWatermarkText}>VERIFIED ANDHRA WEDDING DIRECTORY</Text>
        <View style={styles.bottomDot} />
      </Animated.View>

      {/* 5. THE MOVING EMBLEM: Smoothly Glides and Scales into the Header */}
      <Animated.View
        style={[
          styles.heroEmblemAnchor,
          {
            left: startCenterX - START_SIZE / 2,
            top: startCenterY - START_SIZE / 2,
            opacity: emblemOpacity,
            transform: [
              { translateX: emblemMoveX },
              { translateY: emblemMoveY },
              { scale: Animated.multiply(emblemScaleIntro, emblemScaleGlide) },
            ],
          },
        ]}
      >
        {/* Outer Circular Frame & Glow (Melt away as it approaches header) */}
        <Animated.View
          style={[
            styles.emblemFrame,
            {
              shadowOpacity: emblemShadowOpacity,
              borderColor: '#D4AF37',
            },
          ]}
        >
          {/* Fading Background Circle */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.emblemBackgroundCircle,
              { opacity: emblemFrameBgOpacity },
            ]}
          />

          {/* Fading Golden Border */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.emblemBorderRing,
              { opacity: emblemBorderOpacity },
            ]}
          />

          {/* Core Mandala Image */}
          <Image
            source={require('../../assets/1.png')}
            style={styles.emblemImage}
            resizeMode="contain"
          />

          {/* Specular Light Sweep Overlay */}
          <Animated.View
            style={[
              styles.specularShimmer,
              {
                opacity: shimmerOpacity,
                transform: [{ translateX: shimmerTranslate }, { rotate: '25deg' }],
              },
            ]}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  lottieContainer: {
    position: 'absolute',
    left: (SCREEN_WIDTH - 420) / 2,
    top: SCREEN_HEIGHT / 2 - 40 - 210,
    width: 420,
    height: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: 420,
    height: 420,
  },
  heroEmblemAnchor: {
    position: 'absolute',
    width: START_SIZE,
    height: START_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  emblemFrame: {
    width: START_SIZE,
    height: START_SIZE,
    borderRadius: START_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 28,
    elevation: 16,
  },
  emblemBackgroundCircle: {
    borderRadius: START_SIZE / 2,
    backgroundColor: '#09080E',
  },
  emblemBorderRing: {
    borderRadius: START_SIZE / 2,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  emblemImage: {
    width: START_SIZE - 20,
    height: START_SIZE - 20,
  },
  specularShimmer: {
    position: 'absolute',
    top: -40,
    left: 0,
    width: 45,
    height: 240,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  typographyLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 990,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleText: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 28,
    letterSpacing: 6,
    color: '#FAF9F6',
    fontWeight: '900',
  },
  brandTitleGold: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 28,
    letterSpacing: 6,
    color: '#D4AF37',
    fontWeight: '900',
  },
  hairlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    width: 150,
    marginTop: 10,
    marginBottom: 12,
  },
  hairlineLeft: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.45)',
  },
  goldDiamond: {
    width: 6,
    height: 6,
    backgroundColor: '#D4AF37',
    transform: [{ rotate: '45deg' }],
    marginHorizontal: 8,
  },
  hairlineRight: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.45)',
  },
  subtitleContainer: {
    alignItems: 'center',
    gap: 5,
  },
  englishTagline: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 10.5,
    letterSpacing: 3.5,
    color: 'rgba(250, 249, 246, 0.7)',
    textTransform: 'uppercase',
  },
  teluguTagline: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12.5,
    color: '#D4AF37',
    letterSpacing: 1,
    marginTop: 2,
  },
  bottomWatermark: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 52 : 36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 990,
  },
  bottomDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#D4AF37',
  },
  bottomWatermarkText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 9.5,
    letterSpacing: 2,
    color: 'rgba(250, 249, 246, 0.45)',
  },
});
