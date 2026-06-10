import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import SectionTitle from '@/components/SectionTitle';
import { colors } from '@/constants/theme';
import { ApiMedia, getRecentMedia } from '@/lib/api';

const labels: Record<string, string> = {
  films: 'Films & Series',
  comedie: 'Com\u00e9die',
  musique: 'Musique',
  education: 'Education',
  business: 'Business',
  metiers: 'M\u00e9tiers & Bricolage',
  sport: 'Sport Simul\u00e9',
  documentaires: 'Documentaires',
};

const typeByChannel: Record<string, string> = {
  films: 'film_series',
  comedie: 'comedy',
  musique: 'music',
  education: 'education',
  business: 'business',
  metiers: 'crafts_diy',
  sport: 'sports',
  documentaires: 'documentary',
};

export default function ChannelDetailsScreen() {
  const { id } = useLocalSearchParams();
  const channelId = Array.isArray(id) ? id[0] : id ?? 'musique';
  const title = labels[channelId] ?? 'TALA+';
  const type = typeByChannel[channelId] ?? channelId;
  const [media, setMedia] = useState<ApiMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentMedia().then(({ items }) => setMedia(items)).catch(() => setMedia([])).finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Feather name="chevron-left" size={28} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.content}>
          {loading ? (
            <LoadingState />
          ) : media.length ? (
            <>
              <SectionTitle title={`Top ${title}`} action="Voir tout" onActionPress={() => router.push({ pathname: '/videos/popular', params: { type, title: `Top ${title}` } })} />
              <View style={styles.topRow}>
                {media.slice(0, 3).map((item, index) => (
                  <Pressable key={item.id} style={styles.topCard} onPress={() => router.push(`/mediaDetails/${item.id}`)}>
                    {item.thumbnail ? <Image source={{ uri: item.thumbnail }} style={styles.topImage} /> : <View style={styles.topImage} />}
                    <Text style={styles.rank}>{index + 1}</Text>
                    <Text style={styles.topTitle} numberOfLines={1}>{item.title}</Text>
                  </Pressable>
                ))}
              </View>

              <SectionTitle title="Nouveaut\u00e9s" action="Voir tout" onActionPress={() => router.push({ pathname: '/videos/recent', params: { type, title: 'Nouveaut\u00e9s' } })} />
              {media.slice(3, 9).map((item) => (
                <Pressable key={item.id} style={styles.song} onPress={() => router.push(`/mediaDetails/${item.id}`)}>
                  {item.thumbnail ? <Image source={{ uri: item.thumbnail }} style={styles.songImage} /> : <View style={styles.songImage} />}
                  <View style={styles.songBody}>
                    <Text style={styles.songTitle}>{item.title}</Text>
                    <Text style={styles.songArtist}>{item.category || 'TALA+'}</Text>
                  </View>
                  <FontAwesome name="play-circle" size={26} color={colors.text} />
                </Pressable>
              ))}
            </>
          ) : (
            <EmptyState title="Aucun contenu" body="Les contenus de cette chaine viendront directement de l API." />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { minHeight: 150, flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingTop: 16, paddingHorizontal: 12, backgroundColor: colors.panel },
  back: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 4 },
  content: { padding: 16, paddingBottom: 30 },
  topRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  topCard: { flex: 1 },
  topImage: { width: '100%', aspectRatio: 1.05, borderRadius: 8, backgroundColor: colors.panelLight },
  rank: { position: 'absolute', left: 6, top: 54, color: colors.text, fontSize: 24, fontWeight: '900' },
  topTitle: { color: colors.text, fontSize: 11, fontWeight: '800', marginTop: 6 },
  song: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, padding: 10, marginBottom: 9, backgroundColor: colors.panel },
  songImage: { width: 46, height: 46, borderRadius: 8, backgroundColor: colors.panelLight },
  songBody: { flex: 1 },
  songTitle: { color: colors.text, fontWeight: '900' },
  songArtist: { color: colors.muted, fontSize: 12, marginTop: 3 },
});
