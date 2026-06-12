import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import PostMediaCarousel from '@/components/PostMediaCarousel';
import ShareSheet from '@/components/ShareSheet';
import { colors } from '@/constants/theme';
import { addToWatchlist, ApiMedia, ApiMediaStats, ApiPost, createMediaComment, getMedia, getMediaChildren, getMediaComments, getMediaStats, getRelatedMedia, getUserWatchlist, isFollowingUser, likeComment, likeMedia, removeFromWatchlist, toggleSubscription } from '@/lib/api';
import { getCurrentUser } from '@/lib/session';
import { compactNumber, pluralize } from '@/utils/format';
import { getAvatarSource } from '@/utils/user';

export default function MediaDetailsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string }>();
  const [media, setMedia] = useState<ApiMedia | null>(null);
  const [children, setChildren] = useState<ApiMedia[]>([]);
  const [comments, setComments] = useState<ApiPost[]>([]);
  const [related, setRelated] = useState<ApiMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentModal, setCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  const [watchlisted, setWatchlisted] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [stats, setStats] = useState<ApiMediaStats>({ views: 0, plays: 0, likes: 0, liked: false });

  const user = getCurrentUser();
  const avatarSource = getAvatarSource(user);

  const load = async () => {
    if (!params.id) return;

    setLoading(true);
    try {
      const nextMedia = await getMedia(params.id);
      const [childrenResult, commentsResult, relatedResult, watchlistResult, statsResult, followedResult] = await Promise.all([
        getMediaChildren(nextMedia.id).catch(() => ({ items: [] })),
        getMediaComments(nextMedia.id).catch(() => ({ items: [] })),
        getRelatedMedia(nextMedia.type ?? '', nextMedia.id).catch(() => ({ items: [] })),
        getUserWatchlist().catch(() => ({ items: [] })),
        getMediaStats(nextMedia.id).catch(() => ({ views: nextMedia.views ?? 0, plays: 0, likes: nextMedia.likes ?? 0, liked: Boolean(nextMedia.isLiked) })),
        nextMedia.userId && nextMedia.userId !== user.id ? isFollowingUser(nextMedia.userId).catch(() => false) : Promise.resolve(false),
      ]);
      setMedia({ ...nextMedia, likes: statsResult.likes, views: statsResult.views });
      setStats(statsResult);
      setLiked(Boolean(nextMedia.isLiked || statsResult.liked));
      setChildren(childrenResult.items);
      setComments(commentsResult.items);
      setRelated(relatedResult.items.filter((item) => item.id !== nextMedia.id && item.belongsTo !== nextMedia.id));
      setWatchlisted(Boolean(nextMedia.isInWatchlist || watchlistResult.items.some((item) => item.id === nextMedia.id)));
      setSubscribed(Boolean(followedResult));
    } catch {
      setMedia(null);
      setChildren([]);
      setComments([]);
      setRelated([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [params.id]);

  const toggleLike = async () => {
    if (!media) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setMedia({ ...media, likes: Math.max((media.likes ?? 0) + (nextLiked ? 1 : -1), 0) });
    setStats((current) => ({ ...current, likes: Math.max(current.likes + (nextLiked ? 1 : -1), 0), liked: nextLiked }));
    try {
      await likeMedia(media.id, nextLiked ? 'add' : 'remove');
    } catch (error) {
      setLiked(!nextLiked);
      Alert.alert('Action impossible', error instanceof Error ? error.message : 'La requ\u00eate a \u00e9chou\u00e9.');
    }
  };

  const submitComment = async () => {
    if (!media || !commentText.trim()) return;

    try {
      setSubmittingComment(true);
      await createMediaComment(media.id, commentText.trim());
      setCommentText('');
      setCommentModal(false);
      const result = await getMediaComments(media.id);
      setComments(result.items);
    } catch (error) {
      Alert.alert('Commentaire impossible', error instanceof Error ? error.message : 'La requ\u00eate a \u00e9chou\u00e9.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const toggleWatchlist = async () => {
    if (!media) return;
    const next = !watchlisted;
    setWatchlisted(next);
    try {
      if (next) {
        await addToWatchlist(media.id);
      } else {
        await removeFromWatchlist(media.id);
      }
    } catch (error) {
      setWatchlisted(!next);
      Alert.alert('Watchlist impossible', error instanceof Error ? error.message : 'La requ\u00eate a \u00e9chou\u00e9.');
    }
  };

  const subscribe = async () => {
    if (!media?.userId) return;
    const next = !subscribed;
    setSubscribed(next);
    try {
      await toggleSubscription(media.userId, next ? 'add' : 'remove');
    } catch {
      setSubscribed(!next);
    }
  };

  const toggleCommentLike = async (comment: ApiPost) => {
    const nextLiked = !comment.liked;
    setComments((items) => items.map((item) => item.id === comment.id ? { ...item, liked: nextLiked, likes: Math.max((item.likes ?? 0) + (nextLiked ? 1 : -1), 0) } : item));
    try {
      await likeComment(comment.id, nextLiked ? 'add' : 'remove');
    } catch {
      setComments((items) => items.map((item) => item.id === comment.id ? { ...item, liked: !nextLiked, likes: Math.max((item.likes ?? 0) + (nextLiked ? -1 : 1), 0) } : item));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}><LoadingState /></View>
      </SafeAreaView>
    );
  }

  if (!media) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}><EmptyState title={t('noContentTitle')} body={t('noLatestMedia')} /></View>
      </SafeAreaView>
    );
  }

  const childTitle = media.type === 'music' ? 'Chansons' : 'Episodes';
  const showChildren = (media.type === 'film_series' || media.type === 'music') && children.length > 0;
  const isOwner = media.userId === user.id;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ImageBackground source={media.thumbnail ? { uri: media.thumbnail } : undefined} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay}>
            <Pressable style={styles.back} onPress={() => router.back()}>
              <Feather name="chevron-left" size={28} color={colors.text} />
            </Pressable>
            {!!media.videoUrl && (
              <Pressable style={styles.watchButton} onPress={() => router.push(`/player/${media.id}`)}>
                <FontAwesome name="play" size={14} color={colors.background} />
                <Text style={styles.watchText}>{t('watch')}</Text>
              </Pressable>
            )}
          </View>
        </ImageBackground>

        <View style={styles.content}>
          <Text style={styles.title}>{media.title}</Text>
          <Text style={styles.subtitleVisible}>{channelLabel(media.type)}{media.views ? ` · ${compactNumber(media.views)} ${pluralize(media.views, 'vue', 'vues')}` : ''}</Text>
          <Text style={styles.subtitle}>{channelLabel(media.type)}{media.views ? ` · ${media.views} vues` : ''}</Text>
          <View style={styles.publisherRow}>
            {media.avatarUrl ? <Image source={{ uri: media.avatarUrl }} style={styles.publisherAvatar} /> : <View style={styles.publisherAvatar}><Text style={styles.avatarText}>{(media.username || 'T').charAt(0)}</Text></View>}
            <View style={styles.publisherBody}>
              <Text style={styles.publisherName}>@{media.username || 'talaplus'}</Text>
              <Text style={styles.publisherMeta}>{channelLabel(media.type)}</Text>
            </View>
            {!isOwner && (
              <Pressable style={[styles.subscribeButton, subscribed && styles.subscribeButtonActive]} onPress={subscribe}>
                <Text style={[styles.subscribeText, subscribed && styles.subscribeTextActive]}>{subscribed ? 'Abonné' : "S'abonner"}</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.statsRow}>
            <StatPill singular="vue" plural="vues" value={stats.views} />
            <StatPill singular="lecture" plural="lectures" value={stats.plays} />
            <StatPill singular="like" plural="likes" value={stats.likes} />
          </View>
          {!!media.description && <LinkedDescription text={media.description} />}
          {!!media.author && <Text style={styles.authorLine}>Auteur : {media.author}</Text>}
          {!!media.categories?.length && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryBadges}>
              {media.categories.map((category) => (
                <View key={category.id} style={[styles.categoryBadge, { backgroundColor: category.color }]}>
                  <FontAwesome6 name={category.icon as keyof typeof FontAwesome6.glyphMap} size={13} color={colors.text} />
                  <Text style={styles.categoryBadgeText}>{category.name}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.actions}>
            <ActionButton icon="heart" label="J'aime" active={liked} value={media.likes} onPress={toggleLike} />
            <ActionButton icon="message-square" label="Commenter" onPress={() => setCommentModal(true)} />
            <ActionButton icon="share" label="Partager" onPress={() => setShareVisible(true)} />
            <ActionButton icon={watchlisted ? 'check-circle' : 'plus-square'} label={watchlisted ? 'Ajoutée' : 'Ajouter'} active={watchlisted} onPress={toggleWatchlist} />
          </View>

          {showChildren && <MediaSection title={childTitle} items={children.slice(0, 5)} route={`/media/${media.id}/list/children?title=${encodeURIComponent(childTitle)}&type=${encodeURIComponent(media.type ?? '')}`} compact />}
          <CommentSection mediaId={media.id} items={comments.slice(0, 5)} onLike={toggleCommentLike} />
          {!!related.length && <MediaSection title="A suivre" items={related.slice(0, 5)} route={`/media/${media.id}/list/related?title=${encodeURIComponent('A suivre')}&type=${encodeURIComponent(media.type ?? '')}`} />}
        </View>
      </ScrollView>

      <Modal transparent visible={commentModal} animationType="slide" onRequestClose={() => setCommentModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.commentModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Commenter</Text>
              <Pressable onPress={() => setCommentModal(false)}><Feather name="x" size={22} color={colors.text} /></Pressable>
            </View>
            <View style={styles.userRow}>
              {avatarSource ? <Image source={avatarSource} style={styles.avatarImage} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{user.firstname.charAt(0)}</Text></View>}
              <View>
                <Text style={styles.userName}>{[user.firstname, user.lastname].filter(Boolean).join(' ') || user.username}</Text>
                <Text style={styles.userMeta}>@{user.username}</Text>
              </View>
            </View>
            <TextInput value={commentText} onChangeText={setCommentText} placeholder="Votre commentaire..." placeholderTextColor={colors.muted} style={styles.commentInput} multiline />
            <Pressable style={[styles.submitButton, (!commentText.trim() || submittingComment) && styles.submitButtonDisabled]} onPress={submitComment} disabled={!commentText.trim() || submittingComment}>
              <Text style={styles.submitText}>{submittingComment ? 'Envoi...' : 'Publier'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <ShareSheet visible={shareVisible} entity="media" entityId={media.id} onClose={() => setShareVisible(false)} />
    </SafeAreaView>
  );
}

function ActionButton({ icon, label, value, active, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; value?: number; active?: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.actionButton} onPress={onPress}>
      {icon === 'heart' ? (
        <FontAwesome name={active ? 'heart' : 'heart-o'} size={20} color={active ? colors.primary : colors.text} />
      ) : icon === 'check-circle' ? (
        <FontAwesome name="check-circle" size={20} color={colors.primary} />
      ) : (
        <Feather name={icon} size={20} color={active ? colors.primary : colors.text} />
      )}
      <Text style={[styles.actionText, active && styles.actionTextActive]}>{label}{value ? ` ${value}` : ''}</Text>
    </Pressable>
  );
}

function StatPill({ singular, plural, value }: { singular: string; plural: string; value: number }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{compactNumber(value)}</Text>
      <Text style={styles.statLabel}>{pluralize(value, singular, plural)}</Text>
    </View>
  );
}

function MediaSection({ title, items, route, compact }: { title: string; items: ApiMedia[]; route: string; compact?: boolean }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Pressable onPress={() => router.push(route)}><Text style={styles.moreText}>Voir plus</Text></Pressable>
      </View>
      {items.map((item) => <MediaRow key={item.id} media={item} compact={compact} />)}
    </View>
  );
}

function MediaRow({ media, compact }: { media: ApiMedia; compact?: boolean }) {
  return (
    <Pressable style={styles.mediaRow} onPress={() => router.push(`/mediaDetails/${media.id}`)}>
      {media.thumbnail ? <Image source={{ uri: media.thumbnail }} style={styles.rowImage} /> : <View style={styles.rowImage} />}
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>{media.title}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>{compact ? media.category || media.type : media.type}</Text>
      </View>
      <Feather name="more-vertical" size={18} color={colors.muted} />
    </Pressable>
  );
}

function CommentSection({ mediaId, items, onLike }: { mediaId: string; items: ApiPost[]; onLike: (comment: ApiPost) => Promise<unknown> }) {
  if (!items.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Commentaires</Text>
        <Pressable onPress={() => router.push(`/media/${mediaId}/list/comments?title=${encodeURIComponent('Commentaires')}`)}><Text style={styles.moreText}>Voir plus</Text></Pressable>
      </View>
      {items.map((item) => <CommentCard key={item.id} comment={item} onLike={() => onLike(item)} />)}
    </View>
  );
}

function CommentCard({ comment, onLike }: { comment: ApiPost; onLike: () => void }) {
  return (
    <View style={styles.commentCard}>
      <View style={styles.commentTop}>
        {comment.avatarUrl ? <Image source={{ uri: comment.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{comment.author.charAt(0)}</Text></View>}
        <View style={styles.commentBody}>
          <Text style={styles.commentAuthor}>{comment.author}</Text>
          <Text style={styles.commentUsername}>@{comment.username}</Text>
          <Text style={styles.commentText}>{comment.body}</Text>
          <PostMediaCarousel files={comment.files} compact />
        </View>
      </View>
      <Pressable style={styles.commentLike} onPress={onLike}>
        <FontAwesome name={comment.liked ? 'heart' : 'heart-o'} size={16} color={comment.liked ? colors.primary : colors.muted} />
        <Text style={styles.commentLikeText}>{comment.likes ?? 0}</Text>
      </Pressable>
    </View>
  );
}

function LinkedDescription({ text }: { text: string }) {
  const parts = text.split(/(#[\p{L}\p{N}_]+)/gu);

  return (
    <Text style={styles.description}>
      {parts.map((part, index) => part.startsWith('#') ? (
        <Text key={`${part}-${index}`} style={styles.descriptionHashtag} onPress={() => router.push(`/hashtag/${encodeURIComponent(part.slice(1))}`)}>
          {part}
        </Text>
      ) : (
        <Text key={`${part}-${index}`}>{part}</Text>
      ))}
    </Text>
  );
}

function channelLabel(type?: string) {
  const labels: Record<string, string> = {
    film_series: 'Films & Series',
    comedy: 'Com\u00e9die',
    music: 'Musique',
    education: 'Education',
    business: 'Business',
    crafts_diy: 'M\u00e9tiers & Bricolage',
    sports: 'Sport Simul\u00e9',
    documentary: 'Documentaires',
  };

  return type ? labels[type] ?? type : 'TALA+';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyWrap: { padding: 16 },
  scrollContent: { paddingBottom: 30 },
  hero: { height: 280, backgroundColor: colors.panel },
  heroImage: { opacity: 0.94 },
  heroOverlay: { flex: 1, justifyContent: 'space-between', padding: 12, backgroundColor: 'rgba(0,0,0,0.24)' },
  back: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(5,11,18,0.48)' },
  watchButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.text },
  watchText: { color: colors.background, fontWeight: '900' },
  content: { padding: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  subtitle: { display: 'none' },
  subtitleVisible: { color: colors.muted, marginTop: 5, fontWeight: '700' },
  description: { color: colors.text, lineHeight: 21, marginTop: 12 },
  descriptionHashtag: { color: colors.primary, fontWeight: '900' },
  publisherRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  publisherAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  publisherBody: { flex: 1 },
  publisherName: { color: colors.text, fontWeight: '900' },
  publisherMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  subscribeButton: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.text },
  subscribeButtonActive: { backgroundColor: colors.primary },
  subscribeText: { color: colors.background, fontWeight: '900' },
  subscribeTextActive: { color: colors.text },
  authorLine: { color: colors.text, fontWeight: '800', marginTop: 12 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statPill: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.panel },
  statValue: { color: colors.text, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  categoryBadges: { gap: 8, marginTop: 12, paddingRight: 16 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 38, borderRadius: 8, paddingHorizontal: 12 },
  categoryBadgeText: { color: colors.text, fontWeight: '900' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, marginTop: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  actionButton: { alignItems: 'center', gap: 6, minWidth: 70 },
  actionText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  actionTextActive: { color: colors.primary },
  section: { marginTop: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  moreText: { color: colors.primary, fontWeight: '900' },
  mediaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  rowImage: { width: 72, height: 48, borderRadius: 8, backgroundColor: colors.panelLight },
  rowBody: { flex: 1 },
  rowTitle: { color: colors.text, fontWeight: '900' },
  rowMeta: { color: colors.muted, marginTop: 3, fontSize: 12 },
  commentCard: { borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  commentTop: { flexDirection: 'row', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  avatarText: { color: colors.text, fontWeight: '900' },
  avatarImage: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.panelLight },
  commentBody: { flex: 1 },
  commentAuthor: { color: colors.text, fontWeight: '900' },
  commentUsername: { color: colors.muted, fontSize: 12, marginTop: 2 },
  commentText: { color: colors.text, lineHeight: 20, marginTop: 4 },
  commentLike: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 6, marginTop: 8 },
  commentLikeText: { color: colors.muted, fontWeight: '800' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  commentModal: { borderTopLeftRadius: 8, borderTopRightRadius: 8, padding: 16, backgroundColor: colors.background, borderTopWidth: 1, borderColor: colors.border },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  userName: { color: colors.text, fontWeight: '900' },
  userMeta: { color: colors.muted, marginTop: 2 },
  commentInput: { minHeight: 120, color: colors.text, borderRadius: 8, padding: 12, marginTop: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, textAlignVertical: 'top' },
  submitButton: { alignItems: 'center', borderRadius: 8, paddingVertical: 14, marginTop: 12, backgroundColor: colors.primary },
  submitButtonDisabled: { opacity: 0.55 },
  submitText: { color: colors.text, fontWeight: '900' },
});
