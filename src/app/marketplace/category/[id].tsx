import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import ProductCard from '@/components/ProductCard';
import { colors } from '@/constants/theme';
import { ApiProduct, getProductsByCategory } from '@/lib/api';

export default function CategoryProductsScreen() {
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const title = params.name ? decodeURIComponent(params.name) : 'Cat\u00e9gorie';

  const load = (nextPage: number) => {
    if (!params.id || (loading && items.length) || nextPage > lastPage) return;
    setLoading(true);
    getProductsByCategory(params.id, nextPage)
      .then((result) => {
        setItems((current) => nextPage === 1 ? result.items : [...current, ...result.items]);
        setPage(nextPage);
        setLastPage(result.lastPage);
      })
      .catch(() => {
        if (nextPage === 1) {
          setItems([]);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setItems([]);
    setPage(1);
    setLastPage(1);
    load(1);
  }, [params.id]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        onEndReached={() => load(page + 1)}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title="Aucun produit" body="Les produits de cette cat\u00e9gorie appara\u00eetront ici." />}
        ListFooterComponent={loading && items.length ? <LoadingState compact /> : null}
        renderItem={({ item }) => <View style={styles.cardWrap}><ProductCard product={item} /></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { flex: 1, color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  list: { padding: 16, paddingBottom: 34 },
  cardWrap: { width: '50%', alignItems: 'center', marginBottom: 14 },
});
