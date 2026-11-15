import { Image, StyleSheet } from 'react-native';

type BrandLogoProps = {
  size?: 'sm' | 'md' | 'lg';
};

export default function BrandLogo({ size = 'md' }: BrandLogoProps) {
  return <Image source={require('@assets/logo.png')} style={[styles.logo, styles[size]]} resizeMode="contain" />;
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
  sm: {
    width: 110,
    height: 33,
  },
  md: {
    width: 140,
    height: 44,
  },
  lg: {
    width: 224,
    height: 68,
  },
});
