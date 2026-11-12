import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

export default function MobilePayment() {
  const { t } = useTranslation();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const goBack = () => returnTo === 'wallet' ? router.replace({ pathname: '/profile/wallet', params: { paymentPending: '1' } }) : router.replace('/(tabs)/profil');
  return <SafeAreaView style={styles.container}>
    <Pressable style={styles.back} onPress={goBack}><Feather name="arrow-left" size={24} color={colors.text}/></Pressable>
    <View style={styles.center}><Image source={require('../../../assets/payment/validate-payment.png')} style={styles.image}/><Text style={styles.text}>{t('validatePaymentPhone')}</Text><Pressable style={styles.button} onPress={goBack}><Text style={styles.buttonText}>{t('ok')}</Text></Pressable></View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, back: { padding: 16 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 28 }, image: { width: 160, height: 160, resizeMode: 'contain' }, text: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' }, button: { minWidth: 160, padding: 14, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' }, buttonText: { color: colors.text, fontSize: 17, fontWeight: '900' } });
