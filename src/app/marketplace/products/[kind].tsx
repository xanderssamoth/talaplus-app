import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import ProductCard from '@/components/ProductCard';
import { colors } from '@/constants/theme';
import { ApiProduct, getPopularProducts, getPromotedProducts, getRecentProducts } from '@/lib/api';

export default function ProductListScreen() {
  const { t } = useTranslation();
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const title = useMemo(() => {
    if (kind === 'popular') return t('popularProducts');
    if (kind === 'promoted') return t('specialOffers');
    return t('recommendedForYou');
  }, [kind, t]);

  const load = (nextPage: number) => {
    if ((loading && items.length) || nextPage > lastPage) return;
    setLoading(true);
    const fn = kind === 'popular' ? getPopularProducts : kind === 'promoted' ? getPromotedProducts : getRecentProducts;
    fn(nextPage)
      .then((result) => {
        setItems((current) => nextPage === 1 ? result.items : [...current, ...result.items]);
        setPage(nextPage);
        setLastPage(result.lastPage);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => load(1), [kind]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        onEndReached={() => load(page + 1)}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title={t('noContentTitle')} body={t('noProducts')} />}
        ListFooterComponent={loading && items.length ? <LoadingState compact /> : null}
        renderItem={({ item }) => <View style={styles.cardWrap}><ProductCard product={item} /></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontSize: 20, fontWeight: '900' },
  list: { padding: 16, paddingBottom: 34 },
  cardWrap: { width: '50%', alignItems: 'center', marginBottom: 14 },
});
