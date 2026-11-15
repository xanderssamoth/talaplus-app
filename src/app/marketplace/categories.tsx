import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import { ApiCategory, getCategories } from '@/lib/api';

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ApiCategory[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (nextPage: number) => {
    if ((loading && items.length) || nextPage > lastPage) return;
    setLoading(true);
    getCategories(nextPage)
      .then((result) => {
        setItems((current) => nextPage === 1 ? result.items : [...current, ...result.items]);
        setPage(nextPage);
        setLastPage(result.lastPage);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => load(1), []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title}>{t('categories')}</Text>
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
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => router.push({ pathname: '/marketplace/category/[id]', params: { id: item.id, name: item.name } })}>
            <FontAwesome6 name={item.icon as keyof typeof FontAwesome6.glyphMap} size={24} color={item.color} />
            <Text style={styles.itemText} numberOfLines={2}>{item.name}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  list: { padding: 16, gap: 12 },
  item: { flex: 1, minHeight: 92, margin: 6, borderRadius: 8, padding: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel },
  itemText: { color: colors.text, fontWeight: '800', marginTop: 8, textAlign: 'center' },
});
