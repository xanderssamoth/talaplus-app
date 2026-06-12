import { useEffect, useState } from 'react';
import { FlatList, Image, ImageBackground, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppHeader from '@/components/AppHeader';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import PostMediaCarousel from '@/components/PostMediaCarousel';
import SectionTitle from '@/components/SectionTitle';
import { colors } from '@/constants/theme';
import { ApiHashtag, ApiMedia, ApiPost, getHashtags, getNewsFeed, getPopularMedia, getRecentMedia } from '@/lib/api';

export default function HomeScreen() {
  const { t } = useTranslation();
  const [popular, setPopular] = useState<ApiMedia[]>([]);
  const [recent, setRecent] = useState<ApiMedia[]>([]);
  const [hashtags, setHashtags] = useState<ApiHashtag[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState({ popular: true, recent: true, hashtags: true, posts: true });
  const [refreshing, setRefreshing] = useState(false);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);

  const loadHome = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading({ popular: true, recent: true, hashtags: true, posts: true });
    }

    await Promise.all([
      getPopularMedia().then(({ items }) => setPopular(items)).catch(() => setPopular([])).finally(() => setLoading((state) => ({ ...state, popular: false }))),
      getRecentMedia().then(({ items }) => setRecent(items)).catch(() => setRecent([])).finally(() => setLoading((state) => ({ ...state, recent: false }))),
      getHashtags().then(({ items }) => setHashtags(items)).catch(() => setHashtags([])).finally(() => setLoading((state) => ({ ...state, hashtags: false }))),
      getNewsFeed().then(({ items }) => setPosts(items)).catch(() => setPosts([])).finally(() => setLoading((state) => ({ ...state, posts: false }))),
    ]);

    setRefreshing(false);
  };

  useEffect(() => {
    loadHome();
  }, []);

  const hero = popular[0] ?? recent[0];

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <AppHeader showLogo showAvatar />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onTouchStart={() => setOpenPostMenuId(null)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHome(true)} tintColor={colors.primary} colors={[colors.primary]} progressBackgroundColor={colors.panel} />}
        >
          {!!hero?.thumbnail && (
            <ImageBackground source={{ uri: hero.thumbnail }} imageStyle={styles.heroImage} style={styles.hero}>
              <View style={styles.heroShade}>
                <Text style={styles.heroTitle}>{hero.title}</Text>
                <Text style={styles.heroSubtitle} numberOfLines={2}>{hero.description}</Text>
                <Pressable style={styles.watchButton} onPress={() => router.push(`/mediaDetails/${hero.id}`)}>
                  <FontAwesome name="play" size={13} color={colors.background} />
                  <Text style={styles.watchText}>Voir</Text>
                </Pressable>
              </View>
            </ImageBackground>
          )}

          <View style={styles.section}>
            <SectionTitle title={t('popular')} />
            {loading.popular ? (
              <LoadingState compact />
            ) : popular.length ? (
              <FlatList horizontal data={popular} keyExtractor={(item) => item.id} showsHorizontalScrollIndicator={false} renderItem={({ item }) => <MediaTile media={item} />} ListFooterComponent={<SeeAllTile onPress={() => router.push('/videos/popular')} />} />
            ) : (
              <EmptyState title={t('noContentTitle')} body={t('noPopularMedia')} />
            )}
          </View>

          <View style={styles.section}>
            <SectionTitle title={t('trends')} />
            {loading.hashtags ? (
              <LoadingState compact />
            ) : hashtags.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hashtagWrap}>
                {hashtags.slice(0, 10).map((hashtag) => (
                  <Pressable key={hashtag.id} style={styles.hashtag} onPress={() => router.push(`/hashtag/${encodeURIComponent(hashtag.name)}`)}>
                    <Text style={styles.hashtagText}>#{hashtag.name}</Text>
                  </Pressable>
                ))}
                <Pressable style={[styles.hashtag, styles.viewAllBadge]} onPress={() => router.push('/hashtags')}>
                  <Text style={styles.hashtagTextSeeAll}>{t('viewAll')}</Text>
                </Pressable>
              </ScrollView>
            ) : (
              <EmptyState title={t('noContentTitle')} body={t('noTrends')} />
            )}
          </View>

          <View style={styles.section}>
            <SectionTitle title={t('latest')} />
            {loading.recent ? (
              <LoadingState compact />
            ) : recent.length ? (
              <FlatList horizontal data={recent} keyExtractor={(item) => item.id} showsHorizontalScrollIndicator={false} renderItem={({ item }) => <MediaTile media={item} />} ListFooterComponent={<SeeAllTile onPress={() => router.push('/videos/recent')} />} />
            ) : (
              <EmptyState title={t('noContentTitle')} body={t('noLatestMedia')} />
            )}
          </View>

          <View style={styles.section}>
            <SectionTitle title={t('posts')} action={posts.length ? t('viewAll') : undefined} onActionPress={() => router.push('/posts')} />
            {loading.posts ? <LoadingState compact /> : posts.length ? posts.map((post) => <PostCard key={post.id} post={post} menuOpen={openPostMenuId === post.id} onToggleMenu={() => setOpenPostMenuId((current) => current === post.id ? null : post.id)} onCloseMenu={() => setOpenPostMenuId(null)} />) : <EmptyState title={t('noContentTitle')} body={t('noPosts')} />}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function MediaTile({ media }: { media: ApiMedia }) {
  return (
    <Pressable style={styles.mediaTile} onPress={() => router.push(`/mediaDetails/${media.id}`)}>
      {media.thumbnail ? <Image source={{ uri: media.thumbnail }} style={styles.mediaImage} /> : <View style={styles.mediaImage} />}
      <Text style={styles.mediaTitle} numberOfLines={1}>{media.title}</Text>
    </Pressable>
  );
}

function SeeAllTile({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Pressable style={styles.seeAllTile} onPress={onPress}>
      <Feather name="arrow-right" size={22} color={colors.primary} />
      <Text style={styles.seeAllText}>{t('viewAll')}</Text>
    </Pressable>
  );
}

function PostCard({ post, menuOpen, onToggleMenu, onCloseMenu }: { post: ApiPost; menuOpen: boolean; onToggleMenu: () => void; onCloseMenu: () => void }) {
  const mediaFiles = post.files.length ? post.files : post.image ? [{ id: `${post.id}-image`, url: post.image, type: 'photo' }] : [];

  // Capitalization helper function
  const capitalizeFirstLetter = (str: string) => {
    if (!str) return ""; // Guard clause for empty values
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <View style={styles.postCard}>
      {menuOpen && <Pressable style={styles.menuDismissLayer} onPress={onCloseMenu} />}
      <View style={styles.postHeader}>
        {post.avatarUrl ? (
          <Image source={{ uri: post.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}><Text style={styles.avatarText}>{post.author.charAt(0)}</Text></View>
        )}
        <View style={styles.postAuthorBlock}>
          <Text style={styles.postAuthor}>{post.author}</Text>
          <Text style={styles.postUsername}>@{post.username}</Text>
        </View>
        <Pressable style={styles.postMenuButton} onPress={onToggleMenu}>
          <Feather name="chevron-down" size={20} color={colors.muted} />
        </Pressable>
        {menuOpen && (
          <Pressable style={styles.reportMenu} onPress={onCloseMenu}>
            <Feather name="flag" size={15} color={colors.danger} />
            <Text style={styles.reportText}>Signaler</Text>
          </Pressable>
        )}
      </View>
      <LinkedPostText text={post.body} />
      {!!mediaFiles.length && <PostMediaCarousel files={mediaFiles} />}
      {!!post.explicitTime && (
        <View style={styles.postedAtRow}>
          <Feather name="clock" size={14} color={colors.muted} />
          <Text style={styles.postDateText}>{capitalizeFirstLetter(post.explicitTime)}</Text>
          {/* <Text style={styles.postedAtText}>Posté à : {post.explicitTime}</Text> */}
        </View>
      )}
      <View style={styles.threadActions}>
        <View style={styles.postMetaItem}>
          <Feather name="message-circle" size={17} color={colors.muted} />
          <Text style={styles.postMeta}>{post.comments ?? 0}</Text>
        </View>
        <View style={styles.postMetaItem}>
          <Feather name="repeat" size={17} color={colors.muted} />
          <Text style={styles.postMeta}>{post.shares ?? 0}</Text>
        </View>
        <View style={styles.postMetaItem}>
          <FontAwesome name={post.liked ? 'heart' : 'heart-o'} size={17} color={post.liked ? colors.danger : colors.muted} />
          <Text style={[styles.postMeta, post.liked && styles.liked]}>{post.likes ?? 0}</Text>
        </View>
        <Feather name="share" size={17} color={colors.muted} />
      </View>
      <View style={styles.postActions}>
        <Text style={styles.postMeta}>♡ {post.comments ?? 0}</Text>
        <Text style={styles.postMeta}>↻ {post.shares ?? 0}</Text>
        <Text style={[styles.postMeta, styles.liked]}>♥ {post.likes ?? 0}</Text>
        <Feather name="share" size={17} color={colors.muted} />
      </View>
    </View>
  );
}

function LinkedPostText({ text }: { text: string }) {
  const parts = text.split(/(#[\p{L}\p{N}_]+)/gu);

  return (
    <Text style={styles.postBody}>
      {parts.map((part, index) => part.startsWith('#') ? (
        <Text key={`${part}-${index}`} style={styles.postHashtag} onPress={() => router.push(`/hashtag/${encodeURIComponent(part.slice(1))}`)}>
          {part}
        </Text>
      ) : (
        <Text key={`${part}-${index}`}>{part}</Text>
      ))}
    </Text>
  );
}

function PostMediaGrid({ files }: { files: { id: string; url: string; type: string }[] }) {
  const visibleFiles = files.slice(0, 4);

  return (
    <View style={[styles.postMediaGrid, visibleFiles.length > 1 && styles.postMediaGridMulti]}>
      {visibleFiles.map((file, index) => {
        const isPhoto = ['photo', 'image'].includes(file.type);

        return (
          <View key={`${file.id}-${index}`} style={[styles.postMediaCell, visibleFiles.length === 1 && styles.postMediaSingle]}>
            {isPhoto ? (
              <Image source={{ uri: file.url }} style={styles.postMediaImage} />
            ) : (
              <View style={styles.postVideoTile}>
                <Feather name="play-circle" size={34} color={colors.text} />
                <Text style={styles.postVideoText}>Video</Text>
              </View>
            )}
            {index === 3 && files.length > 4 && (
              <View style={styles.moreMediaOverlay}>
                <Text style={styles.moreMediaText}>+{files.length - 4}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 96 },
  hero: { height: 250, overflow: 'hidden', borderRadius: 8, marginTop: 8, backgroundColor: colors.panel },
  heroImage: { borderRadius: 8 },
  heroShade: { flex: 1, justifyContent: 'flex-end', padding: 16, backgroundColor: 'rgba(0,0,0,0.34)' },
  heroTitle: { color: colors.text, fontSize: 27, fontWeight: '900' },
  heroSubtitle: { color: colors.text, fontSize: 13, lineHeight: 18, marginTop: 4, maxWidth: 280 },
  watchButton: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 10, marginTop: 14, backgroundColor: colors.text },
  watchText: { color: colors.background, fontWeight: '900' },
  section: { marginTop: 24 },
  mediaTile: { width: 128, marginRight: 10 },
  mediaImage: { width: 128, height: 150, borderRadius: 8, backgroundColor: colors.panelLight },
  mediaTitle: { color: colors.text, marginTop: 8, fontWeight: '700' },
  seeAllTile: { width: 104, height: 150, marginRight: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  seeAllText: { color: colors.primary, fontWeight: '900' },
  hashtagWrap: { gap: 10, paddingRight: 16 },
  hashtag: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  viewAllBadge: { backgroundColor: colors.primary },
  hashtagText: { color: colors.primary, fontWeight: '800' },
  hashtagTextSeeAll: { color: colors.text, fontWeight: '800' },
  postCard: { position: 'relative', borderRadius: 8, padding: 14, marginBottom: 12, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  menuDismissLayer: { ...StyleSheet.absoluteFillObject, zIndex: 4 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  avatarText: { color: colors.text, fontWeight: '900' },
  postAuthorBlock: { flex: 1 },
  postAuthor: { color: colors.text, fontWeight: '900' },
  postUsername: { color: colors.muted, marginTop: 2 },
  postMenuButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  reportMenu: { position: 'absolute', top: 34, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.panelLight, borderWidth: 1, borderColor: colors.border },
  reportText: { color: colors.text, fontWeight: '800' },
  postBody: { color: colors.text, lineHeight: 21, marginTop: 12 },
  postHashtag: { color: colors.primary, fontWeight: '900' },
  postMediaGrid: { marginTop: 12, overflow: 'hidden', borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  postMediaGridMulti: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, borderWidth: 0 },
  postMediaCell: { position: 'relative', width: '49.5%', height: 150, overflow: 'hidden', borderRadius: 8, backgroundColor: colors.panelLight },
  postMediaSingle: { width: '100%', height: 210 },
  postMediaImage: { width: '100%', height: '100%' },
  postVideoTile: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight, gap: 8 },
  postVideoText: { color: colors.text, fontWeight: '900' },
  moreMediaOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.56)' },
  moreMediaText: { color: colors.text, fontSize: 24, fontWeight: '900' },
  threadActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  postActions: { display: 'none' },
  postMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postMeta: { color: colors.muted, fontWeight: '800' },
  postedAtRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  postDateText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  postedAtText: { display: 'none' },
  liked: { color: colors.danger },
});
