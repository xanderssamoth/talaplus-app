import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import { ApiPayment, getUserPayments } from '@/lib/api';

export default function PaymentsScreen() {
  const [items, setItems] = useState<ApiPayment[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (nextPage: number) => {
    if ((loading && items.length) || nextPage > lastPage) return;
    setLoading(true);
    getUserPayments(nextPage)
      .then((result) => {
        setItems((current) => nextPage === 1 ? result.items : [...current, ...result.items]);
        setPage(nextPage);
        setLastPage(result.lastPage);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title}>Paiements</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onEndReached={() => load(page + 1)}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title="Aucun paiement" body="Vos paiements apparaîtront ici." />}
        ListFooterComponent={loading && items.length ? <LoadingState compact /> : null}
        renderItem={({ item }) => <PaymentRow payment={item} />}
      />
    </SafeAreaView>
  );
}

function PaymentRow({ payment }: { payment: ApiPayment }) {
  const statusColor = payment.status === 'successful' || payment.status === 'paid' ? '#22C55E' : payment.status === 'failed' ? '#EF4444' : '#F6C343';

  return (
    <View style={styles.item}>
      <View style={[styles.coin, { backgroundColor: statusColor }]}>
        <Feather name="dollar-sign" size={22} color={colors.text} />
      </View>
      <View style={styles.body}>
        <Text style={styles.paymentTitle}>{payment.title}</Text>
        <Text style={styles.paymentMeta}>{payment.currency} {payment.amount.toFixed(2)} · {payment.status}</Text>
        {!!payment.time && <Text style={styles.time}>{payment.time}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  list: { padding: 16, paddingBottom: 34 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, padding: 14, marginBottom: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  coin: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  paymentTitle: { color: colors.text, fontWeight: '900' },
  paymentMeta: { color: colors.muted, marginTop: 4 },
  time: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 6 },
});
