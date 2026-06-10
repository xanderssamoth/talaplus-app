import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import { ApiMedia, getMediaByType, getPopularMedia, getRecentMedia } from '@/lib/api';

const channelLabels: Record<string, string> = {
  film_series: 'Films & Series',
  comedy: 'Com\u00e9die',
  music: 'Musique',
  education: 'Education',
  business: 'Business',
  crafts_diy: 'M\u00e9tiers & Bricolage',
  sports: 'Sport Simul\u00e9',
  documentary: 'Documentaires',
};

export default function VideosListScreen() {
  const params = useLocalSearchParams<{ kind: string; type?: string; title?: string }>();
  const kind = params.kind ?? 'recent';
  const type = params.type;
  const title = useMemo(() => {
    if (params.title) return decodeURIComponent(params.title);
    if (type) return channelLabels[type] ?? type;
    if (kind === 'popular') return 'Vid\u00e9os populaires';
    return 'Toutes les vid\u00e9os';
  }, [kind, params.title, type]);
  const [items, setItems] = useState<ApiMedia[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (nextPage: number) => {
    if ((loading && items.length) || nextPage > lastPage) return;
    setLoading(true);
    const request = type ? getMediaByType(type, nextPage) : kind === 'popular' ? getPopularMedia(nextPage) : getRecentMedia(nextPage);

    request
      .then((result) => {
        setItems((current) => nextPage === 1 ? result.items : [...current, ...result.items]);
        setPage(nextPage);
        setLastPage(result.lastPage);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setItems([]);
    setPage(1);
    setLastPage(1);
    load(1);
  }, [kind, type]);

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
        contentContainerStyle={styles.list}
        onEndReached={() => load(page + 1)}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title="Aucune vid\u00e9o" body="Les vid\u00e9os appara\u00eetront ici." />}
        ListFooterComponent={loading && items.length ? <LoadingState compact /> : null}
        renderItem={({ item, index }) => kind === 'popular' ? <RankedMedia media={item} rank={index + 1} /> : <MediaRow media={item} />}
      />
    </SafeAreaView>
  );
}

function RankedMedia({ media, rank }: { media: ApiMedia; rank: number }) {
  return (
    <Pressable style={styles.rankedCard} onPress={() => router.push(`/mediaDetails/${media.id}`)}>
      {media.thumbnail ? <Image source={{ uri: media.thumbnail }} style={styles.rankedImage} /> : <View style={styles.rankedImage} />}
      <Text style={styles.rank}>{rank}</Text>
      <View style={styles.rankedBody}>
        <Text style={styles.mediaTitle} numberOfLines={2}>{media.title}</Text>
        <Text style={styles.mediaMeta}>{channelLabels[media.type ?? ''] ?? media.type ?? 'TALA+'}</Text>
      </View>
    </Pressable>
  );
}

function MediaRow({ media }: { media: ApiMedia }) {
  return (
    <Pressable style={styles.mediaRow} onPress={() => router.push(`/mediaDetails/${media.id}`)}>
      {media.thumbnail ? <Image source={{ uri: media.thumbnail }} style={styles.mediaImage} /> : <View style={styles.mediaImage} />}
      <View style={styles.mediaBody}>
        <Text style={styles.mediaTitle} numberOfLines={2}>{media.title}</Text>
        <Text style={styles.mediaMeta}>{media.category || channelLabels[media.type ?? ''] || 'TALA+'}</Text>
      </View>
      <FontAwesome name="play-circle" size={28} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { flex: 1, color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  list: { padding: 16, paddingBottom: 34 },
  rankedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, marginBottom: 10, borderRadius: 8, backgroundColor: colors.panel },
  rankedImage: { width: 96, height: 76, borderRadius: 8, backgroundColor: colors.panelLight },
  rank: { width: 28, color: colors.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  rankedBody: { flex: 1 },
  mediaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, marginBottom: 10, borderRadius: 8, backgroundColor: colors.panel },
  mediaImage: { width: 72, height: 54, borderRadius: 8, backgroundColor: colors.panelLight },
  mediaBody: { flex: 1 },
  mediaTitle: { color: colors.text, fontWeight: '900' },
  mediaMeta: { color: colors.muted, marginTop: 4, fontSize: 12 },
});
