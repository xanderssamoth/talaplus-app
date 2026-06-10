import { useCallback, useRef, useState } from 'react';
import { Animated, ImageBackground, Pressable, StyleSheet, Text } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import BrandLogo from '@/components/BrandLogo';
import { colors } from '@/constants/theme';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const logoProgress = useRef(new Animated.Value(0)).current;
  const [isNavigating, setIsNavigating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
      Animated.timing(logoProgress, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }).start();
    }, [logoProgress])
  );

  const goToForm = (route: '/login' | '/signup') => {
    if (isNavigating) return;

    setIsNavigating(true);
    Animated.timing(logoProgress, {
      toValue: 1,
      duration: 360,
      useNativeDriver: true,
    }).start(() => router.push(route));
  };

  return (
    <ImageBackground source={require('@assets/home-screen.png')} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.overlay}>
        <Animated.View
          pointerEvents={isNavigating ? 'none' : 'auto'}
          style={[
            styles.brandBlock,
            {
              transform: [
                {
                  translateY: logoProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -214],
                  }),
                },
                {
                  scale: logoProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 190 / 214],
                  }),
                },
              ],
            },
          ]}
        >
          <BrandLogo size="lg" />
          <Animated.Text
            style={[
              styles.tagline,
              {
                opacity: logoProgress.interpolate({
                  inputRange: [0, 0.55],
                  outputRange: [1, 0],
                }),
              },
            ]}
          >
            {t('welcomeTagline')}
          </Animated.Text>
        </Animated.View>

        <Animated.View
          pointerEvents={isNavigating ? 'none' : 'auto'}
          style={[
            styles.actions,
            {
              opacity: logoProgress.interpolate({
                inputRange: [0, 0.35],
                outputRange: [1, 0],
              }),
            },
          ]}
        >
          <Pressable style={styles.primaryButton} onPress={() => goToForm('/signup')}>
            <Text style={styles.primaryText}>{t('start')}</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => goToForm('/login')}>
            <Text style={styles.secondaryText}>{t('signIn')}</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    backgroundColor: 'rgba(5, 11, 18, 0.16)',
  },
  brandBlock: {
    marginBottom: 26,
    alignSelf: 'flex-start',
  },
  tagline: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 31,
    maxWidth: 280,
    marginTop: 8,
  },
  actions: {
    gap: 12,
    paddingBottom: 18,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 15,
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(5, 11, 18, 0.46)',
  },
  secondaryText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
