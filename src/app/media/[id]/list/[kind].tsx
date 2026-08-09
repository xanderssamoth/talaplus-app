import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import PostMediaCarousel from '@/components/PostMediaCarousel';
import { colors } from '@/constants/theme';
import MediaCover from '@/components/MediaCover';
import { ApiMedia, ApiPost, getMediaChildren, getMediaComments, getRelatedMedia, likeComment } from '@/lib/api';

export default function MediaMoreListScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string; kind: string; title?: string; type?: string }>();
  const title = params.title ? decodeURIComponent(params.title) : t('viewAll');
  const [mediaItems, setMediaItems] = useState<ApiMedia[]>([]);
  const [comments, setComments] = useState<ApiPost[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (nextPage: number) => {
    if (!params.id || (loading && (mediaItems.length || comments.length)) || nextPage > lastPage) return;

    setLoading(true);
    const request = params.kind === 'comments'
      ? getMediaComments(params.id, nextPage)
      : params.kind === 'related'
        ? getRelatedMedia(params.type ?? '', params.id, nextPage)
        : getMediaChildren(params.id, nextPage);

    request
      .then((result) => {
        if (params.kind === 'comments') {
          setComments((current) => nextPage === 1 ? result.items as ApiPost[] : [...current, ...result.items as ApiPost[]]);
        } else {
          setMediaItems((current) => nextPage === 1 ? result.items as ApiMedia[] : [...current, ...result.items as ApiMedia[]]);
        }
        setPage(nextPage);
        setLastPage(result.lastPage);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setMediaItems([]);
    setComments([]);
    setPage(1);
    setLastPage(1);
    load(1);
  }, [params.id, params.kind, params.type]);

  const isComments = params.kind === 'comments';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
      {isComments ? (
        <FlatList
          data={comments}
          key="comments"
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={() => load(page + 1)}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title={t('noCommentTitle')} body={t('noCommentsBody')} />}
          ListFooterComponent={loading && comments.length ? <LoadingState compact /> : null}
          renderItem={({ item }) => <CommentRow comment={item} />}
        />
      ) : (
        <FlatList
          data={mediaItems}
          key="media"
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={() => load(page + 1)}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title={t('noMediaTitle')} body={t('noMediaBody')} />}
          ListFooterComponent={loading && mediaItems.length ? <LoadingState compact /> : null}
          renderItem={({ item }) => <MediaRow media={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function MediaRow({ media }: { media: ApiMedia }) {
  return (
    <Pressable style={styles.mediaRow} onPress={() => router.push(`/mediaDetails/${media.id}`)}>
      <MediaCover uri={media.thumbnail} isAudio={media.isAudio} style={styles.mediaImage} />
      <View style={styles.mediaBody}>
        <Text style={styles.mediaTitle} numberOfLines={2}>{media.title}</Text>
        <Text style={styles.mediaMeta}>{media.type}</Text>
      </View>
    </Pressable>
  );
}

function CommentRow({ comment }: { comment: ApiPost }) {
  const [liked, setLiked] = useState(Boolean(comment.liked));
  const [likes, setLikes] = useState(comment.likes ?? 0);

  const toggle = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((value) => Math.max(value + (next ? 1 : -1), 0));
    await likeComment(comment.id, next ? 'add' : 'remove').catch(() => {
      setLiked(!next);
      setLikes((value) => Math.max(value + (next ? -1 : 1), 0));
    });
  };

  return (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        {comment.avatarUrl ? <Image source={{ uri: comment.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{comment.author.charAt(0)}</Text></View>}
        <View>
          <Text style={styles.commentAuthor}>{comment.author}</Text>
          <Text style={styles.commentUsername}>@{comment.username}</Text>
        </View>
      </View>
      <Text style={styles.commentText}>{comment.body}</Text>
      <PostMediaCarousel files={comment.files} compact />
      <Pressable style={styles.likeRow} onPress={toggle}>
        <FontAwesome name={liked ? 'heart' : 'heart-o'} size={16} color={liked ? colors.primary : colors.muted} />
        <Text style={styles.likeText}>{likes}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { flex: 1, color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  list: { padding: 16, paddingBottom: 34 },
  mediaRow: { flexDirection: 'row', gap: 12, padding: 10, marginBottom: 10, borderRadius: 8, backgroundColor: colors.panel },
  mediaImage: { width: 112, height: 70, borderRadius: 8, backgroundColor: colors.panelLight },
  mediaBody: { flex: 1, justifyContent: 'center' },
  mediaTitle: { color: colors.text, fontWeight: '900' },
  mediaMeta: { color: colors.muted, marginTop: 4 },
  commentCard: { padding: 14, borderRadius: 8, marginBottom: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  avatarText: { color: colors.text, fontWeight: '900' },
  commentAuthor: { color: colors.text, fontWeight: '900' },
  commentUsername: { color: colors.muted, fontSize: 12, marginTop: 2 },
  commentText: { color: colors.text, lineHeight: 21, marginTop: 6 },
  likeRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 6, marginTop: 10 },
  likeText: { color: colors.muted, fontWeight: '800' },
});
