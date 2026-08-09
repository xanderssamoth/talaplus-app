import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import PostMediaCarousel from '@/components/PostMediaCarousel';
import { colors } from '@/constants/theme';
import MediaCover from '@/components/MediaCover';
import { ApiMedia, ApiPost, getHashtagEntities } from '@/lib/api';

type Tab = 'media' | 'comments';

export default function HashtagEntitiesScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ hashtag: string }>();
  const hashtag = useMemo(() => decodeURIComponent(params.hashtag ?? '').replace(/^#/, ''), [params.hashtag]);
  const [activeTab, setActiveTab] = useState<Tab>('media');
  const [media, setMedia] = useState<ApiMedia[]>([]);
  const [comments, setComments] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hashtag) {
      return;
    }

    setLoading(true);
    getHashtagEntities(hashtag)
      .then((result) => {
        setMedia(result.media);
        setComments(result.posts);
      })
      .catch(() => {
        setMedia([]);
        setComments([]);
      })
      .finally(() => setLoading(false));
  }, [hashtag]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title}>#{hashtag}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TabButton label={t('video')} active={activeTab === 'media'} onPress={() => setActiveTab('media')} />
        <TabButton label={t('comments')} active={activeTab === 'comments'} onPress={() => setActiveTab('comments')} />
      </View>

      {activeTab === 'media' ? (
        <FlatList
          key="hashtag-media"
          data={media}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title={t('noVideoTitle')} body={t('hashtagVideosBody')} />}
          renderItem={({ item }) => <MediaCard media={item} />}
        />
      ) : (
        <FlatList
          key="hashtag-comments"
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title={t('noCommentTitle')} body={t('hashtagCommentsBody')} />}
          renderItem={({ item }) => <CommentCard post={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function MediaCard({ media }: { media: ApiMedia }) {
  return (
    <Pressable style={styles.mediaCard} onPress={() => router.push(`/mediaDetails/${media.id}`)}>
      <MediaCover uri={media.thumbnail} isAudio={media.isAudio} style={styles.mediaImage} />
      <Text style={styles.mediaTitle} numberOfLines={2}>{media.title}</Text>
      {!!media.category && <Text style={styles.mediaMeta} numberOfLines={1}>{media.category}</Text>}
    </Pressable>
  );
}

function CommentCard({ post }: { post: ApiPost }) {
  const { t } = useTranslation();
  const icon = post.targetType === 'product' ? 'bag-shopping' : post.targetType === 'media' ? 'clapperboard' : 'message';
  const label = post.targetType === 'product' ? t('product') : post.targetType === 'media' ? t('video') : t('comment');

  return (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        {post.avatarUrl ? <Image source={{ uri: post.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{post.author.charAt(0)}</Text></View>}
        <View style={styles.commentAuthorBlock}>
          <Text style={styles.commentAuthor}>{post.author}</Text>
          <Text style={styles.commentUsername}>@{post.username}</Text>
        </View>
        <View style={styles.commentType}>
          <FontAwesome6 name={icon as keyof typeof FontAwesome6.glyphMap} size={13} color={colors.primary} />
          <Text style={styles.commentTypeText}>{label}</Text>
        </View>
      </View>
      <Text style={styles.commentBody}>{post.body}</Text>
      <PostMediaCarousel files={post.files} compact />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  tabs: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  tab: { flex: 1, borderRadius: 8, paddingVertical: 11, alignItems: 'center', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.muted, fontWeight: '900' },
  tabTextActive: { color: colors.text },
  grid: { padding: 16, paddingBottom: 34 },
  list: { padding: 16, paddingBottom: 34 },
  mediaCard: { width: '50%', paddingRight: 10, marginBottom: 16 },
  mediaImage: { width: '100%', height: 170, borderRadius: 8, backgroundColor: colors.panelLight },
  mediaTitle: { color: colors.text, fontWeight: '900', marginTop: 8 },
  mediaMeta: { color: colors.muted, marginTop: 4, fontSize: 12 },
  commentCard: { borderRadius: 8, padding: 14, marginBottom: 12, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  avatarText: { color: colors.text, fontWeight: '900' },
  commentAuthorBlock: { flex: 1 },
  commentAuthor: { color: colors.text, fontWeight: '900' },
  commentUsername: { color: colors.muted, marginTop: 2 },
  commentType: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: colors.panelLight },
  commentTypeText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  commentBody: { color: colors.text, lineHeight: 21, marginTop: 12 },
  commentImage: { width: '100%', height: 180, borderRadius: 8, marginTop: 12, backgroundColor: colors.panelLight },
});
