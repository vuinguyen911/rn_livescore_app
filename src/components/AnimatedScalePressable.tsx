import React, { useRef } from 'react';
import { Animated, GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

type Props = PressableProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AnimatedScalePressable({
  children,
  style,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (to: number) => {
    Animated.spring(scale, {
      toValue: to,
      speed: 28,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      {...rest}
      style={[style, { transform: [{ scale }] }]}
      onPressIn={(event: GestureResponderEvent) => {
        animateTo(scaleTo);
        onPressIn?.(event);
      }}
      onPressOut={(event: GestureResponderEvent) => {
        animateTo(1);
        onPressOut?.(event);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
