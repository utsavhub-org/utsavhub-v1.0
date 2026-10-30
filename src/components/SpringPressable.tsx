import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback, StyleProp, ViewStyle } from 'react-native';
import { playButtonClick, playTabPop, playSuccessSound } from '../lib/soundManager';

interface SpringPressableProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  activeScale?: number;
  soundType?: 'click' | 'pop' | 'success' | 'none';
}

export default function SpringPressable({
  onPress,
  style,
  children,
  activeScale = 0.97,
  soundType = 'click',
}: SpringPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 100,
    }).start();
  };

  const handlePress = () => {
    if (soundType === 'click') {
      playButtonClick();
    } else if (soundType === 'pop') {
      playTabPop();
    } else if (soundType === 'success') {
      playSuccessSound();
    }
    onPress?.();
  };

  return (
    <TouchableWithoutFeedback
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

