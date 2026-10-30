import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { THEME } from '../theme/colors';

interface ShimmerSkeletonProps {
  count?: number;
}

export default function ShimmerSkeleton({ count = 3 }: ShimmerSkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.cardSkeleton}>
          {/* Shimmer Image Placeholder */}
          <Animated.View style={[styles.imageSkeleton, { opacity: animatedValue }]} />

          {/* Shimmer Details */}
          <View style={styles.contentSkeleton}>
            <View style={styles.row}>
              <Animated.View style={[styles.titleLine, { opacity: animatedValue }]} />
              <Animated.View style={[styles.ratingPill, { opacity: animatedValue }]} />
            </View>

            <Animated.View style={[styles.subLine, { opacity: animatedValue }]} />
            <Animated.View style={[styles.specsLine, { opacity: animatedValue }]} />

            <View style={styles.footerRow}>
              <Animated.View style={[styles.priceLine, { opacity: animatedValue }]} />
              <Animated.View style={[styles.badgePill, { opacity: animatedValue }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  cardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  imageSkeleton: {
    width: '100%',
    height: 190,
    backgroundColor: '#EAE8E3',
  },
  contentSkeleton: {
    padding: 14,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleLine: {
    width: '60%',
    height: 18,
    borderRadius: 6,
    backgroundColor: '#EAE8E3',
  },
  ratingPill: {
    width: 44,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#EAE8E3',
  },
  subLine: {
    width: '45%',
    height: 13,
    borderRadius: 4,
    backgroundColor: '#F0EFEA',
  },
  specsLine: {
    width: '80%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#F0EFEA',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    marginTop: 4,
  },
  priceLine: {
    width: '35%',
    height: 20,
    borderRadius: 6,
    backgroundColor: '#EAE8E3',
  },
  badgePill: {
    width: 60,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#F0EFEA',
  },
});

