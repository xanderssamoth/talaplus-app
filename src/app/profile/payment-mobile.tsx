import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
export default function MobilePayment() { const { t } = useTranslation(); return <SafeAreaView style={styles.container}><Pressable style={{ padding: 16 }} onPress={() => router.replace('/(tabs)/profil')}><Feather name="arrow-left" size={24} color={colors.text}/></Pressable><View style={styles.center}><Image source={require('../../../assets/payment/validate-payment.png')} style={styles.image}/><Text style={styles.text}>{t('validatePaymentPhone')}</Text><Pressable style={styles.button} onPress={() => router.replace('/(tabs)/profil')}><Text style={styles.text}>{t('ok')}</Text></Pressable></View></SafeAreaView>; }
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 28 }, image: { width: 160, height: 160, resizeMode: 'contain' }, text: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' }, button: { minWidth: 160, padding: 14, borderRadius: 8, backgroundColor: colors.primary } });
