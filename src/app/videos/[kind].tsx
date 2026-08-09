import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import MediaCover from '@/components/MediaCover';
import { ApiMedia, getMediaByType, getPopularMedia, getRecentMedia } from '@/lib/api';

export default function VideosListScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ kind: string; type?: string; title?: string }>();
  const kind = params.kind ?? 'recent';
  const type = params.type;
  const title = useMemo(() => {
    if (params.title) return decodeURIComponent(params.title);
    if (type) return channelLabel(type, t);
    if (kind === 'popular') return t('popularVideos');
    return t('allVideos');
  }, [kind, params.title, t, type]);
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
        ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title={t('noVideoTitle')} body={t('noVideosBody')} />}
        ListFooterComponent={loading && items.length ? <LoadingState compact /> : null}
        renderItem={({ item, index }) => kind === 'popular' ? <RankedMedia media={item} rank={index + 1} /> : <MediaRow media={item} />}
      />
    </SafeAreaView>
  );
}

function RankedMedia({ media, rank }: { media: ApiMedia; rank: number }) {
  const { t } = useTranslation();

  return (
    <Pressable style={styles.rankedCard} onPress={() => router.push(`/mediaDetails/${media.id}`)}>
      <MediaCover uri={media.thumbnail} isAudio={media.isAudio} style={styles.rankedImage} />
      <Text style={styles.rank}>{rank}</Text>
      <View style={styles.rankedBody}>
        <Text style={styles.mediaTitle} numberOfLines={2}>{media.title}</Text>
        <Text style={styles.mediaMeta}>{media.type ? channelLabel(media.type, t) : 'TALA+'}</Text>
      </View>
    </Pressable>
  );
}

function MediaRow({ media }: { media: ApiMedia }) {
  const { t } = useTranslation();

  return (
    <Pressable style={styles.mediaRow} onPress={() => router.push(`/mediaDetails/${media.id}`)}>
      <MediaCover uri={media.thumbnail} isAudio={media.isAudio} style={styles.mediaImage} />
      <View style={styles.mediaBody}>
        <Text style={styles.mediaTitle} numberOfLines={2}>{media.title}</Text>
        <Text style={styles.mediaMeta}>{media.category || (media.type ? channelLabel(media.type, t) : 'TALA+')}</Text>
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

function channelLabel(type: string, t: (key: string) => string) {
  const labels: Record<string, string> = {
    film_series: t('filmsAndSeries'),
    comedy: t('comedy'),
    music: t('music'),
    education: t('education'),
    business: t('business'),
    crafts_diy: t('crafts'),
    sports: t('simulatedSport'),
    documentary: t('documentaries'),
  };

  return labels[type] ?? type;
}
