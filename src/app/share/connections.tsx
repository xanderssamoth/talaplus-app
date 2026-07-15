import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import { ApiUserProfile, getUserConnections } from '@/lib/api';

export default function ShareConnectionsScreen() {
  const { t } = useTranslation();
  const { link } = useLocalSearchParams<{ link?: string }>();
  const [items, setItems] = useState<ApiUserProfile[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (nextPage: number) => {
    if ((loading && items.length) || nextPage > lastPage) return;

    setLoading(true);
    getUserConnections(nextPage)
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
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{t('message')}</Text>
        <View style={{ width: 24 }} />
      </View>
      {!!link && <Text style={styles.link} numberOfLines={1}>{link}</Text>}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onEndReached={() => load(page + 1)}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title={t('noUserTitle')} body={t('noUserBody')} />}
        ListFooterComponent={loading && items.length ? <LoadingState compact /> : null}
        renderItem={({ item }) => <ConnectionRow user={item} />}
      />
    </SafeAreaView>
  );
}

function ConnectionRow({ user }: { user: ApiUserProfile }) {
  return (
    <Pressable style={styles.row}>
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{user.name.charAt(0) || 'T'}</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name}>{user.name}</Text>
        {!!user.username && <Text style={styles.username}>@{user.username}</Text>}
      </View>
      <Feather name="send" size={19} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  link: { color: colors.primary, marginHorizontal: 16, marginBottom: 8, fontWeight: '800' },
  list: { padding: 16, paddingBottom: 34 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.panelLight },
  avatarFallback: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  avatarText: { color: colors.text, fontWeight: '900' },
  body: { flex: 1 },
  name: { color: colors.text, fontWeight: '900' },
  username: { color: colors.muted, marginTop: 3 },
});
