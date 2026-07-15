import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import { ApiHashtag, getHashtags } from '@/lib/api';

export default function HashtagsScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ApiHashtag[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (nextPage: number) => {
    if ((loading && items.length) || nextPage > lastPage) return;
    setLoading(true);
    getHashtags(nextPage)
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
        <Text style={styles.title}>{t('hashtags')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        onEndReached={() => load(page + 1)}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title={t('noHashtagTitle')} body={t('noHashtagBody')} />}
        ListFooterComponent={loading && items.length ? <LoadingState compact /> : null}
        renderItem={({ item }) => (
          <Pressable style={styles.badge} onPress={() => router.push(`/hashtag/${encodeURIComponent(item.name)}`)}>
            <Text style={styles.badgeText}>#{item.name}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontSize: 20, fontWeight: '900' },
  list: { padding: 16, paddingBottom: 34 },
  badge: { flex: 1, minHeight: 48, margin: 5, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.panel },
  badgeText: { color: colors.primary, fontWeight: '900' },
});
