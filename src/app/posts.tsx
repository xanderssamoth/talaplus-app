import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import PostMediaCarousel from '@/components/PostMediaCarousel';
import { colors } from '@/constants/theme';
import { ApiPost, getNewsFeed } from '@/lib/api';

export default function PostsScreen() {
  const [items, setItems] = useState<ApiPost[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (nextPage: number) => {
    if ((loading && items.length) || nextPage > lastPage) return;
    setLoading(true);
    getNewsFeed(nextPage)
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
        <Text style={styles.title}>Posts</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onEndReached={() => load(page + 1)}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title="Aucun post" body="Les posts publics appara\u00eetront ici." />}
        ListFooterComponent={loading && items.length ? <LoadingState compact /> : null}
        renderItem={({ item }) => <PostRow post={item} />}
      />
    </SafeAreaView>
  );
}

function PostRow({ post }: { post: ApiPost }) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        {post.avatarUrl ? <Image source={{ uri: post.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{post.author.charAt(0)}</Text></View>}
        <View style={styles.authorBlock}>
          <Text style={styles.author}>{post.author}</Text>
          <Text style={styles.username}>@{post.username}</Text>
        </View>
      </View>
      <LinkedPostText text={post.body} />
      <PostMediaCarousel files={post.files} />
      {!!post.explicitTime && (
        <View style={styles.dateRow}>
          <Feather name="clock" size={14} color={colors.muted} />
          <Text style={styles.dateText}>{post.explicitTime}</Text>
        </View>
      )}
      <View style={styles.actions}>
        <View style={styles.actionItem}><Feather name="message-circle" size={17} color={colors.muted} /><Text style={styles.meta}>{post.comments ?? 0}</Text></View>
        <View style={styles.actionItem}><Feather name="repeat" size={17} color={colors.muted} /><Text style={styles.meta}>{post.shares ?? 0}</Text></View>
        <View style={styles.actionItem}><FontAwesome name={post.liked ? 'heart' : 'heart-o'} size={17} color={post.liked ? colors.danger : colors.muted} /><Text style={[styles.meta, post.liked && styles.liked]}>{post.likes ?? 0}</Text></View>
        <Feather name="share" size={17} color={colors.muted} />
      </View>
    </View>
  );
}

function LinkedPostText({ text }: { text: string }) {
  const parts = text.split(/(#[\p{L}\p{N}_]+)/gu);

  return (
    <Text style={styles.body}>
      {parts.map((part, index) => part.startsWith('#') ? (
        <Text key={`${part}-${index}`} style={styles.hashtag} onPress={() => router.push(`/hashtag/${encodeURIComponent(part.slice(1))}`)}>{part}</Text>
      ) : (
        <Text key={`${part}-${index}`}>{part}</Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontSize: 20, fontWeight: '900' },
  list: { padding: 16, paddingBottom: 34 },
  postCard: { borderRadius: 8, padding: 14, marginBottom: 12, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  avatarText: { color: colors.text, fontWeight: '900' },
  authorBlock: { flex: 1 },
  author: { color: colors.text, fontWeight: '900' },
  username: { color: colors.muted, marginTop: 2 },
  body: { color: colors.text, lineHeight: 21, marginTop: 12 },
  hashtag: { color: colors.primary, fontWeight: '900' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  dateText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { color: colors.muted, fontWeight: '800' },
  liked: { color: colors.danger },
});
