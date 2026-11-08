import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { getCurrentUser } from '@/lib/session';
import { activatePremium, fetchIdCard, fetchPremiumPricing, uploadIdCard } from '@/lib/profile-api';

const operators = [
  { name: 'Afrimoney', value: 'afrimoney', image: require('../../../assets/payment/operator-afrimoney.png') },
  { name: 'Airtel money', value: 'airtel-money', image: require('../../../assets/payment/operator-airtel-money.png') },
  { name: 'M-Pesa', value: 'm-pesa', image: require('../../../assets/payment/operator-m-pesa.png') },
  { name: 'Orange money', value: 'orange-money', image: require('../../../assets/payment/operator-orange-money.png') },
  { name: 'Visa/Mastercard', value: 'visa-mastercard', image: require('../../../assets/payment/operator-visa-mastercard.png') },
] as const;
const paymentImages = { 1: require('../../../assets/payment/payment-1.png'), 2: require('../../../assets/payment/payment-2.png') };

export default function VerifyScreen() {
  const { t } = useTranslation();
  const id = getCurrentUser().id;
  const [step, setStep] = useState<1 | 2>(1);
  const [plans, setPlans] = useState<Record<string, any>[]>([]);
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [plan, setPlan] = useState<Record<string, any> | null>(null);
  const [type, setType] = useState<1 | 2>(1);
  const [channel, setChannel] = useState<string>('afrimoney');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIdCard().then(data => { if (data && (Array.isArray(data) ? data.length > 0 : Boolean((data as any).id || (data as any).file_url))) setStep(2); }).catch(() => undefined);
    fetchPremiumPricing().then(setPlans).catch(e => setError(e instanceof Error ? e.message : t('requestFailed')));
  }, [t]);
  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
    if (!result.canceled) setFile(result.assets[0]);
  };
  const submitCard = async () => {
    if (!file) return Alert.alert(t('idCardRequired'));
    try { setBusy(true); await uploadIdCard(id, { uri: file.uri, name: file.name, mimeType: file.mimeType || 'application/octet-stream' }); setStep(2); }
    catch (e) { Alert.alert(t('actionImpossible'), e instanceof Error ? e.message : t('requestFailed')); }
    finally { setBusy(false); }
  };
  const activate = async () => {
    if (!plan) return;
    const months = Number(plan.duration ?? plan.months);
    if (![1, 3, 6, 12].includes(months)) return Alert.alert(t('actionImpossible'), t('invalidPlanDuration'));
    try {
      setBusy(true);
      const result = await activatePremium(id, months, type, channel);
      setPlan(null);
      if (type === 1) router.replace('/profile/payment-mobile');
      else if (result.url) router.replace({ pathname: '/profile/payment-card', params: { url: result.url } });
      else Alert.alert(t('actionImpossible'), t('paymentUrlMissing'));
    } catch (e) { Alert.alert(t('actionImpossible'), e instanceof Error ? e.message : t('requestFailed')); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.container}><View style={styles.header}><Pressable onPress={() => router.back()}><Feather name="arrow-left" size={23} color={colors.text}/></Pressable><Text style={styles.title}>{t('verifyAccount')}</Text><View style={{ width: 23 }}/></View><ScrollView contentContainerStyle={styles.content}>{step === 1 ? <><Text style={styles.section}>{t('idCardStep')}</Text><Text style={styles.muted}>{t('idCardExplanation')}</Text><Pressable style={styles.option} onPress={pickFile}><Feather name="upload" size={20} color={colors.primary}/><Text style={styles.white}>{file?.name || t('chooseIdCard')}</Text></Pressable><Pressable style={styles.button} onPress={submitCard} disabled={busy}><Text style={styles.buttonText}>{t('next')}</Text></Pressable></> : <><Text style={styles.section}>{t('premiumPlansStep')}</Text>{!!error && <Text style={styles.muted}>{error}</Text>}{plans.map((item, index) => <View key={String(item.id ?? index)} style={styles.plan}><Text style={styles.white}>{item.pricing_name ?? item.name ?? `${item.duration} ${t('months')}`}</Text><Text style={styles.muted}>{item.duration} {t('months')} · {item.price ?? item.amount ?? ''} {item.currency ?? 'USD'}</Text><Pressable style={styles.button} onPress={() => setPlan(item)}><Text style={styles.buttonText}>{t('selectPlan')}</Text></Pressable></View>)}</>}</ScrollView><Modal visible={!!plan} transparent animationType="slide" onRequestClose={() => setPlan(null)}><View style={styles.scrim}><View style={styles.sheet}><View style={styles.header}><Text style={styles.section}>{t('paymentMode')}</Text><Pressable onPress={() => setPlan(null)}><Feather name="x" size={22} color={colors.text}/></Pressable></View><View style={styles.row}>{([1,2] as const).map(value => <Pressable key={value} style={[styles.payment, type === value && styles.selected]} onPress={() => { setType(value); setChannel(value === 2 ? 'visa-mastercard' : 'afrimoney'); }}><Image source={paymentImages[value]} style={styles.paymentImage}/><Text style={styles.white}>{t(value === 1 ? 'mobileMoney' : 'bankCard')}</Text></Pressable>)}</View><Text style={styles.section}>{t('paymentChannel')}</Text><ScrollView horizontal contentContainerStyle={styles.row}>{operators.filter(item => type === 2 ? item.value === 'visa-mastercard' : item.value !== 'visa-mastercard').map(item => <Pressable key={item.value} style={[styles.operator, channel === item.value && styles.selected]} onPress={() => setChannel(item.value)}><Image source={item.image} style={styles.operatorImage}/><Text style={styles.muted}>{item.name}</Text></Pressable>)}</ScrollView><Pressable style={styles.button} disabled={busy} onPress={activate}><Text style={styles.buttonText}>{busy ? t('sending') : t('continue')}</Text></Pressable></View></View></Modal></SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }, title: { color: colors.text, fontSize: 20, fontWeight: '900' }, content: { padding: 18, gap: 12 }, section: { color: colors.text, fontSize: 17, fontWeight: '900', marginVertical: 8 }, muted: { color: colors.muted }, white: { color: colors.text, fontWeight: '800' }, option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: 8, backgroundColor: colors.panel }, button: { padding: 13, alignItems: 'center', borderRadius: 8, backgroundColor: colors.primary }, buttonText: { color: colors.text, fontWeight: '900' }, plan: { gap: 10, padding: 16, borderRadius: 8, backgroundColor: colors.panel }, scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' }, sheet: { padding: 16, backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, gap: 10 }, row: { flexDirection: 'row', gap: 10 }, payment: { flex: 1, gap: 8, alignItems: 'center', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }, selected: { borderColor: colors.primary }, paymentImage: { width: 72, height: 52, resizeMode: 'contain' }, operator: { width: 100, gap: 4, alignItems: 'center', padding: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }, operatorImage: { width: 64, height: 48, resizeMode: 'contain' } });
