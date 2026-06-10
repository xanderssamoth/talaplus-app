import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import BrandLogo from '@/components/BrandLogo';

type AuthLogoProps = {
  delay?: number;
};

export default function AuthLogo({ delay = 80 }: AuthLogoProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        styles.logo,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [60, 0],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [1.35, 1],
              }),
            },
          ],
        },
      ]}
    >
      <BrandLogo size="lg" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
    marginBottom: 24,
  },
});
