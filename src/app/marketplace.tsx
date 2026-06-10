import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppHeader from '@/components/AppHeader';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import ProductCard from '@/components/ProductCard';
import SectionTitle from '@/components/SectionTitle';
import { colors } from '@/constants/theme';
import { ApiCategory, ApiProduct, getCategories, getPopularProducts, getPromotedProducts, getRecentProducts } from '@/lib/api';

export default function MarketplaceScreen() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [popular, setPopular] = useState<ApiProduct[]>([]);
  const [promoted, setPromoted] = useState<ApiProduct[]>([]);
  const [recent, setRecent] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState({ categories: true, popular: true, promoted: true, recent: true });

  useEffect(() => {
    getCategories().then(({ items }) => setCategories(items)).catch(() => setCategories([])).finally(() => setLoading((state) => ({ ...state, categories: false })));
    getPopularProducts().then(({ items }) => setPopular(items)).catch(() => setPopular([])).finally(() => setLoading((state) => ({ ...state, popular: false })));
    getPromotedProducts().then(({ items }) => setPromoted(items)).catch(() => setPromoted([])).finally(() => setLoading((state) => ({ ...state, promoted: false })));
    getRecentProducts().then(({ items }) => setRecent(items)).catch(() => setRecent([])).finally(() => setLoading((state) => ({ ...state, recent: false })));
  }, []);

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <AppHeader title={t('marketplace')} showAvatar searchType="product" />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <SectionTitle title={t('categories')} />
            {loading.categories ? (
              <LoadingState compact />
            ) : !!categories.length && (
              <FlatList
                horizontal
                data={[...categories.slice(0, 5), { id: 'more', name: t('viewAll'), icon: 'ellipsis', color: colors.muted } as ApiCategory]}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable style={styles.categoryItem} onPress={() => item.id === 'more' ? router.push('/marketplace/categories') : router.push({ pathname: '/marketplace/category/[id]', params: { id: item.id, name: item.name } })}>
                    <View style={[styles.categoryIcon, { borderColor: item.color }]}>
                      <FontAwesome6 name={item.icon as keyof typeof FontAwesome6.glyphMap} size={24} color={item.color} />
                    </View>
                    <Text style={styles.categoryText} numberOfLines={1}>{item.name}</Text>
                  </Pressable>
                )}
              />
            )}
          </View>

          <ProductSection title={t('popularProducts')} empty={t('noProducts')} products={popular} loading={loading.popular} route="/marketplace/products/popular" />
          <ProductSection title={t('specialOffers')} empty={t('noProducts')} products={promoted} loading={loading.promoted} wide route="/marketplace/products/promoted" />
          <ProductSection title={t('recommendedForYou')} empty={t('noProducts')} products={recent} loading={loading.recent} route="/marketplace/products/recent" />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function ProductSection({ title, empty, products, loading, wide, route }: { title: string; empty: string; products: ApiProduct[]; loading: boolean; wide?: boolean; route: string }) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <SectionTitle title={title} />
      {loading ? (
        <LoadingState compact />
      ) : products.length ? (
        <FlatList horizontal data={products} keyExtractor={(item) => item.id} showsHorizontalScrollIndicator={false} renderItem={({ item }) => <ProductCard product={item} wide={wide} />} ListFooterComponent={<Pressable style={[styles.seeAllProduct, wide && styles.seeAllProductWide]} onPress={() => router.push(route)}><Text style={styles.seeAllText}>{t('viewAll')}</Text></Pressable>} />
      ) : (
        <EmptyState title={t('noContentTitle')} body={empty} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 90 },
  section: { marginBottom: 26 },
  categoryItem: { width: 92, marginRight: 12, alignItems: 'center' },
  categoryIcon: { width: 72, height: 72, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel, borderWidth: 1 },
  categoryText: { color: colors.text, marginTop: 8, fontWeight: '700', maxWidth: 88 },
  seeAllProduct: { width: 120, minHeight: 250, marginRight: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  seeAllProductWide: { width: 180, minHeight: 190 },
  seeAllText: { color: colors.primary, fontWeight: '900' },
});
