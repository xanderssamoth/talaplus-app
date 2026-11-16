import { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { fetchPayments } from '@/lib/profile-api';
import { apiRequest, getCurrentUser } from '@/lib/session';

type Payment = Record<string, any>;
const entityLabels: Record<string, string> = { media: 'mediaEntity', cart: 'cartEntity', user: 'userEntity', pricing: 'pricingEntity' };
const reasonLabels: Record<string, string> = { media_create: 'paymentReasonMediaCreate', media_boost: 'paymentReasonMediaBoost', gift: 'paymentReasonGift', product_sale: 'paymentReasonProductSale', user_certfied: 'paymentReasonCertification', user_certified: 'paymentReasonCertification', ad: 'paymentReasonAd', coin_price: 'paymentReasonCoins', earnings_send: 'paymentReasonEarnings' };
function displayValue(value: unknown, language: string): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(item => displayValue(item, language)).filter(Boolean).join(', ');
  if (typeof value !== 'object') return '';
  const object = value as Record<string, unknown>;
  const localized = object[language] ?? object.fr ?? object.en ?? object.ln;
  if (localized !== undefined) return displayValue(localized, language);
  return displayValue(object.name ?? object.title ?? object.label, language);
}
function entityDetail(payment: Payment, language: string) {
  const data = payment.entity_data ?? payment.entityData ?? payment[payment.entity] ?? {};
  if (payment.entity === 'media') return displayValue(data.media_title ?? payment.media_title, language);
  if (payment.entity === 'cart') return displayValue(data.payment_code ?? payment.payment_code, language);
  if (payment.entity === 'user') return [data.firstname ?? payment.firstname, data.lastname ?? payment.lastname].map(value => displayValue(value, language)).filter(Boolean).join(' ');
  if (payment.entity === 'pricing') return displayValue(data.pricing_name ?? payment.pricing_name, language);
  return '';
}
async function completePayment(payment: Payment): Promise<Payment> {
  if (entityDetail(payment, 'fr') || !payment.entity_id || !['media', 'cart', 'user', 'pricing'].includes(payment.entity)) return payment;
  try { const response = await apiRequest<unknown>(`/v1/${payment.entity}/${encodeURIComponent(String(payment.entity_id))}`); return { ...payment, entity_data: Array.isArray(response.data) ? response.data[0] : response.data }; } catch { return payment; }
}
function PaymentStatus({ value }: { value: unknown }) {
  const { t } = useTranslation();
  const status = Number(value);
  const pending = status === 2;
  const succeeded = status === 0;
  return <View style={[styles.status, succeeded ? styles.success : pending ? styles.pending : styles.failed]}><Text style={[styles.statusText, pending && styles.pendingText]}>{t(succeeded ? 'paymentSuccessful' : pending ? 'paymentPending' : 'paymentFailed')}</Text></View>;
}
export default function PaymentsScreen() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<Payment[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const load = useCallback(() => { setBusy(true); fetchPayments(getCurrentUser().id).then(async result => { setItems(await Promise.all(result.items.map(completePayment))); setError(''); }).catch(e => setError(e instanceof Error ? e.message : t('requestFailed'))).finally(() => setBusy(false)); }, [t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const tableHeader = <View style={styles.headerRow}><Text style={[styles.headCell, styles.reasonCell]}>{t('reason')}</Text><Text style={[styles.headCell, styles.entityCell]}>{t('entity')}</Text><Text style={[styles.headCell, styles.detailCell]}>{t('entityData')}</Text><Text style={[styles.headCell, styles.statusCell]}>{t('paymentStatus')}</Text></View>;
  return <SafeAreaView style={styles.container}><View style={styles.top}><Pressable onPress={() => router.back()}><Feather name="arrow-left" size={23} color={colors.text}/></Pressable><Text style={styles.title}>{t('payments')}</Text><View style={{ width: 23 }}/></View>
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.horizontal}><FlatList style={styles.table} data={items} keyExtractor={(item, index) => String(item.id ?? index)} refreshing={busy} onRefresh={load} ListHeaderComponent={tableHeader} contentContainerStyle={styles.list} ListEmptyComponent={!busy ? <Text style={styles.muted}>{error || t('noPaymentBody')}</Text> : undefined} renderItem={({ item }) => <View style={styles.row}><Text style={[styles.cell, styles.reasonCell]}>{reasonLabels[String(item.reason)] ? t(reasonLabels[String(item.reason)]) : displayValue(item.reason, i18n.language)}</Text><Text style={[styles.cell, styles.entityCell]}>{t(entityLabels[item.entity] ?? 'entity')}</Text><Text style={[styles.cell, styles.detailCell]}>{entityDetail(item, i18n.language)}</Text><View style={styles.statusCell}><PaymentStatus value={item.status}/></View></View>}/></ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, top: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: colors.text, fontSize: 21, fontWeight: '900' }, horizontal: { flexGrow: 1 }, table: { minWidth: 700, flex: 1 }, list: { padding: 16, paddingTop: 0, paddingBottom: 35 }, headerRow: { flexDirection: 'row', paddingVertical: 13, paddingHorizontal: 12, backgroundColor: colors.panelLight, borderTopLeftRadius: 10, borderTopRightRadius: 10 }, headCell: { color: colors.text, fontWeight: '900', fontSize: 12 }, row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.panel, borderBottomWidth: 1, borderColor: colors.border }, cell: { color: colors.text, fontSize: 13, paddingRight: 12 }, reasonCell: { width: 180 }, entityCell: { width: 130 }, detailCell: { width: 210 }, statusCell: { width: 140 }, status: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }, success: { backgroundColor: colors.success }, pending: { backgroundColor: colors.text }, failed: { backgroundColor: colors.danger }, statusText: { color: colors.text, fontSize: 12, fontWeight: '900' }, pendingText: { color: colors.background }, muted: { color: colors.muted, padding: 20 } });
