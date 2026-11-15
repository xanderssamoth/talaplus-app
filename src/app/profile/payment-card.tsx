import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { colors } from '@/constants/theme';

export default function CardPayment() {
  const { url, returnTo } = useLocalSearchParams<{ url?: string; returnTo?: string }>();
  const goBack = () => returnTo === 'wallet' ? router.replace({ pathname: '/profile/wallet', params: { paymentPending: '1' } }) : router.replace('/(tabs)/profil');
  return <SafeAreaView style={styles.container}>
    <Pressable style={styles.back} onPress={goBack}><Feather name="arrow-left" size={24} color={colors.text}/></Pressable>
    {typeof url === 'string' && /^https:\/\//i.test(url) && <WebView source={{ uri: url }} style={styles.web}/>}
  </SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, back: { padding: 16 }, web: { flex: 1 } });
