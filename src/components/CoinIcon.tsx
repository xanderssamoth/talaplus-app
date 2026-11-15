import { StyleSheet, Text, View } from 'react-native';

export default function CoinIcon({ size = 30 }: { size?: number }) {
  return <View accessibilityLabel="Coin" style={[styles.coin, { width: size, height: size, borderRadius: size / 2, borderWidth: Math.max(2, size * 0.08) }]}>
    <View style={[styles.inner, { width: size * 0.72, height: size * 0.72, borderRadius: size * 0.36, borderWidth: Math.max(1, size * 0.035) }]}>
      <Text style={[styles.letter, { fontSize: size * 0.48, lineHeight: size * 0.57 }]}>C</Text>
    </View>
  </View>;
}
const styles = StyleSheet.create({ coin: { backgroundColor: '#F6C343', borderColor: '#FFE48A', alignItems: 'center', justifyContent: 'center' }, inner: { borderColor: '#B87705', alignItems: 'center', justifyContent: 'center' }, letter: { color: '#7A4B00', fontWeight: '900', textAlign: 'center', includeFontPadding: false } });
