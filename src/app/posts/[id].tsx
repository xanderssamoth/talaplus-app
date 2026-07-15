import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import PostMediaCarousel from '@/components/PostMediaCarousel';
import ShareSheet from '@/components/ShareSheet';
import { colors } from '@/constants/theme';
import { ApiPost, getPost } from '@/lib/api';

export default function PostDetailsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareVisible, setShareVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPost(id).then(setPost).catch(() => setPost(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <SafeAreaView style={styles.container}><LoadingState /></SafeAreaView>;
  if (!post) return <SafeAreaView style={styles.container}><EmptyState title={t('postNotFoundTitle')} body={t('postNotFoundBody')} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title}>{t('posts')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.card}>
        <View style={styles.row}>
          {post.avatarUrl ? <Image source={{ uri: post.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{post.author.charAt(0)}</Text></View>}
          <View>
            <Text style={styles.author}>{post.author}</Text>
            <Text style={styles.username}>@{post.username}</Text>
          </View>
        </View>
        <Text style={styles.body}>{post.body}</Text>
        <PostMediaCarousel files={post.files} />
        {!!post.explicitTime && <Text style={styles.time}>{post.explicitTime}</Text>}
        <View style={styles.actions}>
          <View style={styles.action}><Feather name="message-circle" size={17} color={colors.muted} /><Text style={styles.meta}>{post.comments ?? 0}</Text></View>
          <View style={styles.action}><Feather name="repeat" size={17} color={colors.muted} /><Text style={styles.meta}>{post.shares ?? 0}</Text></View>
          <View style={styles.action}><FontAwesome name={post.liked ? 'heart' : 'heart-o'} size={17} color={post.liked ? colors.primary : colors.muted} /><Text style={[styles.meta, post.liked && styles.liked]}>{post.likes ?? 0}</Text></View>
          <Pressable style={styles.action} onPress={() => setShareVisible(true)}><Feather name="share" size={17} color={colors.muted} /></Pressable>
        </View>
      </View>
      <ShareSheet visible={shareVisible} entity="post" entityId={post.id} onClose={() => setShareVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  card: { borderRadius: 8, padding: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  avatarText: { color: colors.text, fontWeight: '900' },
  author: { color: colors.text, fontWeight: '900' },
  username: { color: colors.muted, marginTop: 2 },
  body: { color: colors.text, lineHeight: 22, marginTop: 14 },
  time: { color: colors.muted, marginTop: 12, fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 14 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { color: colors.muted, fontWeight: '800' },
  liked: { color: colors.primary },
});
