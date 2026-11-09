import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ProfileSummary from '@/components/ProfileSummary';
import { colors } from '@/constants/theme';
import { fetchProfile, fetchSubscriptions, fetchWatchlistCount, Profile } from '@/lib/profile-api';
import { followUser, isFollowingUser, unfollowUser } from '@/lib/api';
import { getCurrentUser } from '@/lib/session';

export default function UserProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscriptions, setSubscriptions] = useState(0);
  const [watchlist, setWatchlist] = useState(0);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const load = useCallback(() => {
    if (!id) return;
    fetchProfile(id).then(setProfile).catch(e => setError(e instanceof Error ? e.message : t('requestFailed')));
    fetchSubscriptions(id).then(result => setSubscriptions(result.count)).catch(() => undefined);
    fetchWatchlistCount(id).then(setWatchlist).catch(() => undefined);
    if (id !== getCurrentUser().id) isFollowingUser(id).then(setFollowing).catch(() => undefined);
  }, [id, t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const toggleFollow = async () => {
    if (!id || followBusy) return;
    try {
      setFollowBusy(true);
      if (following) await unfollowUser(id); else await followUser(id);
      setFollowing(!following);
    } catch (e) { Alert.alert(t('actionImpossible'), e instanceof Error ? e.message : t('requestFailed')); }
    finally { setFollowBusy(false); }
  };
  return <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}><Pressable style={styles.back} onPress={() => router.back()}><Feather name="arrow-left" size={22} color={colors.text}/></Pressable>
        {id !== getCurrentUser().id && <Pressable style={[styles.follow, following && styles.following]} disabled={followBusy} onPress={toggleFollow}><Feather name={following ? 'user-check' : 'user-plus'} size={16} color={colors.text}/><Text style={styles.followText}>{t(following ? 'unsubscribe' : 'subscribe')}</Text></Pressable>}
      </View>
      {profile ? <><View style={styles.summary}><ProfileSummary profile={profile} subscriptions={subscriptions} watchlist={watchlist}/></View>
        {([['package', 'productsServices', 'products'], ['film', 'videosAudios', 'medias']] as const).map(([icon, label, kind]) =>
          <Pressable key={kind} style={styles.link} onPress={() => router.push({ pathname: '/profile/[kind]', params: { kind, userId: id } })}>
            <Feather name={icon} size={19} color={colors.text}/><Text style={styles.linkText}>{t(label)}</Text><Feather name="chevron-right" size={18} color={colors.muted}/>
          </Pressable>)}</> : <Text style={styles.message}>{error || t('loadingMedia')}</Text>}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, content: { paddingBottom: 30 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }, back: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel }, follow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.primary }, following: { backgroundColor: colors.panelLight }, followText: { color: colors.text, fontWeight: '900' }, summary: { paddingHorizontal: 16 }, link: { marginHorizontal: 16, marginTop: 9, padding: 16, borderRadius: 8, backgroundColor: colors.panel, flexDirection: 'row', alignItems: 'center', gap: 12 }, linkText: { flex: 1, color: colors.text, fontWeight: '800' }, message: { color: colors.muted, padding: 20 } });
