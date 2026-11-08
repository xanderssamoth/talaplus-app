import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { fetchPayments } from '@/lib/profile-api';
import { apiRequest, getCurrentUser } from '@/lib/session';

type Payment = Record<string, any>;
const entityLabels: Record<string, string> = { media: 'mediaEntity', cart: 'cartEntity', user: 'userEntity', pricing: 'pricingEntity' };
function entityDetail(payment: Payment) {
  const data = payment.entity_data ?? payment.entityData ?? payment[payment.entity] ?? {};
  if (payment.entity === 'media') return data.media_title ?? payment.media_title ?? '';
  if (payment.entity === 'cart') return data.payment_code ?? payment.payment_code ?? '';
  if (payment.entity === 'user') return [data.firstname, data.lastname].filter(Boolean).join(' ') || [payment.firstname, payment.lastname].filter(Boolean).join(' ');
  if (payment.entity === 'pricing') return data.pricing_name ?? payment.pricing_name ?? '';
  return '';
}
async function completePayment(payment: Payment): Promise<Payment> {
  if (entityDetail(payment) || !payment.entity_id || !['media', 'cart', 'user', 'pricing'].includes(payment.entity)) return payment;
  try {
    const response = await apiRequest<unknown>(`/v1/${payment.entity}/${encodeURIComponent(String(payment.entity_id))}`);
    return { ...payment, entity_data: Array.isArray(response.data) ? response.data[0] : response.data };
  } catch { return payment; }
}
export default function PaymentsScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Payment[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const load = useCallback(() => { setBusy(true); fetchPayments(getCurrentUser().id).then(async r => { setItems(await Promise.all(r.items.map(completePayment))); setError(''); }).catch(e => setError(e instanceof Error ? e.message : t('requestFailed'))).finally(() => setBusy(false)); }, [t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return <SafeAreaView style={styles.container}><View style={styles.header}><Pressable onPress={() => router.back()}><Feather name="arrow-left" size={23} color={colors.text}/></Pressable><Text style={styles.title}>{t('payments')}</Text><View style={{ width: 23 }}/></View>
    <View style={styles.columnHead}><Text style={styles.column}>{t('reason')}</Text><Text style={styles.column}>{t('entity')}</Text><Text style={styles.column}>{t('entityData')}</Text></View>
    <FlatList data={items} keyExtractor={(item, index) => String(item.id ?? index)} refreshing={busy} onRefresh={load} contentContainerStyle={styles.list} ListEmptyComponent={!busy ? <Text style={styles.muted}>{error || t('noPaymentBody')}</Text> : null} renderItem={({ item }) => <View style={styles.row}><Text style={styles.cell}>{String(item.reason ?? '')}</Text><Text style={styles.cell}>{t(entityLabels[item.entity] ?? 'entity')}</Text><Text style={styles.cell}>{entityDetail(item)}</Text></View>}/>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: colors.text, fontSize: 21, fontWeight: '900' }, list: { paddingHorizontal: 12, paddingBottom: 35 }, columnHead: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.panelLight }, column: { flex: 1, color: colors.text, fontWeight: '900', fontSize: 12 }, row: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderColor: colors.border }, cell: { flex: 1, color: colors.text, fontSize: 12 }, muted: { color: colors.muted, padding: 20 } });
