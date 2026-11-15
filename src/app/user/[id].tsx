import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ProfileSummary from '@/components/ProfileSummary';
import PostIdentity from '@/components/PostIdentity';
import PostMediaCarousel from '@/components/PostMediaCarousel';
import { colors } from '@/constants/theme';
import { fetchFollowers, fetchProfile, fetchSubscriptions, fetchUserMediaCount, fetchUserPosts, Profile } from '@/lib/profile-api';
import { ApiPost, followUser, isFollowingUser, unfollowUser } from '@/lib/api';
import { getCurrentUser } from '@/lib/session';

export default function UserProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ownId = getCurrentUser().id;
  const isOwn = id === ownId;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mediaCount, setMediaCount] = useState(0);
  const [subscriptions, setSubscriptions] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [postPage, setPostPage] = useState(0);
  const [lastPostPage, setLastPostPage] = useState(1);
  const [postsBusy, setPostsBusy] = useState(false);
  const [error, setError] = useState('');
  const [postsError, setPostsError] = useState('');
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (isOwn) router.replace('/(tabs)/profil');
    else { setPosts([]); setPostPage(0); setLastPostPage(1); }
  }, [id, isOwn]);
  const loadPosts = useCallback(async (page: number) => {
    if (!id || isOwn) return;
    setPostsBusy(true);
    try {
      const result = await fetchUserPosts(id, page);
      setPosts(current => page === 1 ? result.items : [...current, ...result.items]);
      setPostPage(page);
      setLastPostPage(result.lastPage);
      setPostsError('');
    } catch (e) { setPostsError(e instanceof Error ? e.message : t('requestFailed')); }
    finally { setPostsBusy(false); }
  }, [id, isOwn, t]);
  const load = useCallback(() => {
    if (!id || isOwn) return;
    setError('');
    fetchProfile(id).then(setProfile).catch(e => setError(e instanceof Error ? e.message : t('requestFailed')));
    fetchUserMediaCount(id).then(setMediaCount).catch(() => undefined);
    fetchSubscriptions(id).then(result => setSubscriptions(result.count)).catch(() => undefined);
    fetchFollowers(id).then(result => setFollowers(result.count)).catch(() => undefined);
    isFollowingUser(id).then(setFollowing).catch(() => undefined);
    loadPosts(1);
  }, [id, isOwn, loadPosts, t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleFollow = async () => {
    if (!id || followBusy) return;
    const next = !following;
    try {
      setFollowBusy(true);
      if (next) await followUser(id); else await unfollowUser(id);
      setFollowing(next);
      setFollowers(current => Math.max(0, current + (next ? 1 : -1)));
      fetchFollowers(id).then(result => setFollowers(result.count)).catch(() => undefined);
    } catch (e) { Alert.alert(t('actionImpossible'), e instanceof Error ? e.message : t('requestFailed')); }
    finally { setFollowBusy(false); }
  };

  if (isOwn) return <SafeAreaView style={styles.container}/>;
  const shownProfile = profile?.id === id ? profile : null;
  return <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()}><Feather name="arrow-left" size={22} color={colors.text}/></Pressable>
        <Pressable style={[styles.follow, following && styles.following]} disabled={followBusy} onPress={toggleFollow}><Feather name={following ? 'user-check' : 'user-plus'} size={16} color={colors.text}/><Text style={styles.followText}>{t(following ? 'unsubscribe' : 'subscribe')}</Text></Pressable>
      </View>
      {shownProfile ? <>
        <View style={styles.summary}><ProfileSummary profile={shownProfile} mediaCount={mediaCount} subscriptions={subscriptions} followers={followers}/></View>
        {([['package', 'productsServices', 'products'], ['film', 'videosAudios', 'medias']] as const).map(([icon, label, kind]) =>
          <Pressable key={kind} style={styles.link} onPress={() => router.push({ pathname: '/profile/[kind]', params: { kind, userId: id } })}>
            <Feather name={icon} size={19} color={colors.text}/><Text style={styles.linkText}>{t(label)}</Text><Feather name="chevron-right" size={18} color={colors.muted}/>
          </Pressable>)}
        <Text style={styles.sectionTitle}>{t('posts')}</Text>
        {posts.map(post => <View key={post.id} style={styles.postCard}>
          <PostIdentity post={post}/>
          <Pressable onPress={() => router.push(`/posts/${post.id}`)}><Text style={styles.postBody}>{post.body}</Text></Pressable>
          <PostMediaCarousel files={post.files}/>
          {!!post.explicitTime && <Text style={styles.postTime}>{post.explicitTime}</Text>}
        </View>)}
        {!postsBusy && !posts.length && <Text style={styles.message}>{postsError || t('noUserPosts')}</Text>}
        {postsBusy && <ActivityIndicator color={colors.primary} style={styles.loading}/>}
        {!postsBusy && postPage < lastPostPage && <Pressable style={styles.more} onPress={() => loadPosts(postPage + 1)}><Text style={styles.linkText}>{t('more')}</Text></Pressable>}
      </> : <Text style={styles.message}>{error || t('loadingMedia')}</Text>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  back: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel },
  follow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.primary }, following: { backgroundColor: colors.panelLight }, followText: { color: colors.text, fontWeight: '900' },
  summary: { paddingHorizontal: 16 }, link: { marginHorizontal: 16, marginTop: 9, padding: 16, borderRadius: 8, backgroundColor: colors.panel, flexDirection: 'row', alignItems: 'center', gap: 12 }, linkText: { flex: 1, color: colors.text, fontWeight: '800' },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginHorizontal: 16, marginTop: 26, marginBottom: 12 }, postCard: { marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 10, backgroundColor: colors.panel, gap: 12 }, postBody: { color: colors.text, lineHeight: 21 }, postTime: { color: colors.muted, fontSize: 12 }, message: { color: colors.muted, padding: 20 }, loading: { marginVertical: 20 }, more: { alignItems: 'center', marginHorizontal: 16, padding: 14, borderRadius: 8, backgroundColor: colors.panelLight },
});
