import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { getMyWallet } from '@/lib/wallet-api';
import CoinIcon from '@/components/CoinIcon';

export default function WalletScreen() {
  const { t, i18n } = useTranslation();
  const { paymentPending } = useLocalSearchParams<{ paymentPending?: string }>();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setLoading(true);
    getMyWallet().then(wallet => { setBalance(wallet.balance); setError(''); })
      .catch(e => setError(e instanceof Error ? e.message : t('requestFailed')))
      .finally(() => setLoading(false));
  }, [t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return <SafeAreaView style={styles.container}>
    <View style={styles.header}><Pressable style={styles.back} onPress={() => router.replace('/(tabs)/profil')}><Feather name="arrow-left" size={23} color={colors.text}/></Pressable><Text style={styles.title}>{t('wallet')}</Text><View style={{ width: 40 }}/></View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.balanceCard}><CoinIcon size={42}/><Text style={styles.label}>{t('coinBalance')}</Text>
        {loading && balance === null ? <ActivityIndicator color={colors.primary}/> : <Text style={styles.balance}>{balance === null ? '—' : new Intl.NumberFormat(i18n.language === 'ln' ? 'fr' : i18n.language).format(balance)} <Text style={styles.coinUnit}>{t('coins')}</Text></Text>}
      </View>
      {!!error && <Pressable onPress={load}><Text style={styles.error}>{error} · {t('retry')}</Text></Pressable>}
      {paymentPending === '1' && <View style={styles.notice}><Feather name="info" size={20} color={colors.primary}/><Text style={styles.noticeText}>{t('walletPaymentPending')}</Text></View>}
      <Pressable style={styles.buy} onPress={() => router.push('/profile/coins')}><Feather name="plus-circle" size={20} color={colors.text}/><Text style={styles.buyText}>{t('buyCoins')}</Text><Feather name="chevron-right" size={20} color={colors.text}/></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }, back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }, title: { color: colors.text, fontSize: 20, fontWeight: '900' }, content: { padding: 18, gap: 18 }, balanceCard: { minHeight: 190, padding: 24, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border }, label: { color: colors.muted, fontSize: 15 }, balance: { color: colors.text, fontSize: 38, fontWeight: '900', textAlign: 'center' }, coinUnit: { color: '#F6C343', fontSize: 18 }, notice: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 12, backgroundColor: colors.panelLight }, noticeText: { flex: 1, color: colors.text, lineHeight: 21 }, buy: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 17, borderRadius: 12, backgroundColor: colors.primary }, buyText: { flex: 1, color: colors.text, fontWeight: '900', fontSize: 16 }, error: { color: colors.danger, textAlign: 'center' } });
