import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { getCurrentUser } from '@/lib/session';
import { CoinPack, getCoinPacks, purchaseCoins } from '@/lib/wallet-api';
import CoinIcon from '@/components/CoinIcon';

const operators = [
  { name: 'Afrimoney', value: 'afrimoney', image: require('../../../assets/payment/operator-afrimoney.png') },
  { name: 'Airtel money', value: 'airtel-money', image: require('../../../assets/payment/operator-airtel-money.png') },
  { name: 'M-Pesa', value: 'm-pesa', image: require('../../../assets/payment/operator-m-pesa.png') },
  { name: 'Orange money', value: 'orange-money', image: require('../../../assets/payment/operator-orange-money.png') },
  { name: 'Visa/Mastercard', value: 'visa-mastercard', image: require('../../../assets/payment/operator-visa-mastercard.png') },
] as const;
const paymentImages = { 1: require('../../../assets/payment/payment-1.png'), 2: require('../../../assets/payment/payment-2.png') };

export default function CoinPacksScreen() {
  const { t, i18n } = useTranslation();
  const [packs, setPacks] = useState<CoinPack[]>([]);
  const [selected, setSelected] = useState<CoinPack | null>(null);
  const [type, setType] = useState<1 | 2>(1);
  const [channel, setChannel] = useState<string>('afrimoney');
  const [phone, setPhone] = useState(getCurrentUser().phone || '');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setLoading(true);
    getCoinPacks(i18n.language).then(items => { setPacks(items); setError(''); })
      .catch(e => setError(e instanceof Error ? e.message : t('requestFailed')))
      .finally(() => setLoading(false));
  }, [t, i18n.language]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const purchase = async () => {
    if (!selected || busy) return;
    if (type === 1 && !phone.trim()) return Alert.alert(t('phoneRequired'));
    try {
      setBusy(true);
      const result = await purchaseCoins(selected.id, type, channel, phone);
      if (type === 2 && !/^https:\/\//i.test(result.url)) throw new Error(t('paymentUrlMissing'));
      setSelected(null);
      if (type === 1) router.replace({ pathname: '/profile/payment-mobile', params: { returnTo: 'wallet' } });
      else router.replace({ pathname: '/profile/payment-card', params: { url: result.url, returnTo: 'wallet' } });
    } catch (e) { Alert.alert(t('actionImpossible'), e instanceof Error ? e.message : t('requestFailed')); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.container}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Feather name="arrow-left" size={23} color={colors.text}/></Pressable><Text style={styles.title}>{t('buyCoins')}</Text><View style={{ width: 23 }}/></View>
    <ScrollView contentContainerStyle={styles.content}>
      {loading && <ActivityIndicator color={colors.primary}/>}
      {!!error && <Pressable onPress={load}><Text style={styles.muted}>{error} · {t('retry')}</Text></Pressable>}
      {!loading && !error && packs.length === 0 && <Text style={styles.muted}>{t('noCoinPacks')}</Text>}
      {packs.map(pack => <View key={pack.id} style={styles.pack}>
        <View style={styles.packTop}><CoinIcon size={30}/><Text style={styles.packName}>{pack.name}</Text></View>
        <Text style={styles.coins}>{pack.coins} {t('coins')}</Text>
        <Text style={styles.muted}>{pack.price} {pack.currency}</Text>
        <Pressable style={styles.button} onPress={() => { setType(1); setChannel('afrimoney'); setSelected(pack); }}><Text style={styles.buttonText}>{t('selectPlan')}</Text></Pressable>
      </View>)}
    </ScrollView>
    <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}><KeyboardAvoidingView style={styles.scrim} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={styles.sheet}>
      <View style={styles.sheetHeader}><Text style={styles.section}>{selected?.name}</Text><Pressable onPress={() => setSelected(null)}><Feather name="x" size={22} color={colors.text}/></Pressable></View>
      <Text style={styles.section}>{t('paymentMode')}</Text>
      <View style={styles.row}>{([1, 2] as const).map(value => <Pressable key={value} style={[styles.payment, type === value && styles.selected]} onPress={() => { setType(value); setChannel(value === 2 ? 'visa-mastercard' : 'afrimoney'); }}><Image source={paymentImages[value]} style={styles.paymentImage}/><Text style={styles.white}>{t(value === 1 ? 'mobileMoney' : 'bankCard')}</Text></Pressable>)}</View>
      <Text style={styles.section}>{t('paymentChannel')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>{operators.filter(item => type === 2 ? item.value === 'visa-mastercard' : item.value !== 'visa-mastercard').map(item => <Pressable key={item.value} style={[styles.operator, channel === item.value && styles.selected]} onPress={() => setChannel(item.value)}><Image source={item.image} style={styles.operatorImage}/><Text style={styles.muted}>{item.name}</Text></Pressable>)}</ScrollView>
      {type === 1 && <View><Text style={styles.white}>{t('paymentPhone')}</Text><TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder={t('paymentPhone')} placeholderTextColor={colors.muted} style={styles.phoneInput}/></View>}
      <Pressable style={styles.button} disabled={busy} onPress={purchase}><Text style={styles.buttonText}>{busy ? t('sending') : t('continue')}</Text></Pressable>
    </View></KeyboardAvoidingView></Modal>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }, title: { color: colors.text, fontSize: 20, fontWeight: '900' }, content: { padding: 18, gap: 12, paddingBottom: 36 }, muted: { color: colors.muted }, pack: { padding: 18, borderRadius: 12, backgroundColor: colors.panel, gap: 10, borderWidth: 1, borderColor: colors.border }, packTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, packName: { color: colors.text, fontWeight: '900', fontSize: 17, flex: 1 }, coins: { color: '#F6C343', fontSize: 22, fontWeight: '900' }, button: { padding: 14, alignItems: 'center', borderRadius: 8, backgroundColor: colors.primary }, buttonText: { color: colors.text, fontWeight: '900' }, scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' }, sheet: { padding: 16, backgroundColor: colors.background, borderTopLeftRadius: 18, borderTopRightRadius: 18, gap: 12 }, sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, section: { color: colors.text, fontSize: 16, fontWeight: '900' }, row: { flexDirection: 'row', gap: 10 }, payment: { flex: 1, gap: 8, alignItems: 'center', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }, selected: { borderColor: colors.primary }, paymentImage: { width: 72, height: 52, resizeMode: 'contain' }, operator: { width: 100, gap: 4, alignItems: 'center', padding: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }, operatorImage: { width: 64, height: 48, resizeMode: 'contain' }, white: { color: colors.text, fontWeight: '800' }, phoneInput: { marginTop: 7, padding: 12, borderRadius: 8, color: colors.text, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border } });
