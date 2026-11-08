import { useCallback, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ProfileSummary from '@/components/ProfileSummary';
import { colors } from '@/constants/theme';
import { fetchProfile, fetchSubscriptions, fetchWatchlistCount, Profile } from '@/lib/profile-api';

export default function UserProfileScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscriptions, setSubscriptions] = useState(0);
  const [watchlist, setWatchlist] = useState(0);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    if (!id) return;
    fetchProfile(id).then(setProfile).catch(e => setError(e instanceof Error ? e.message : t('requestFailed')));
    fetchSubscriptions(id).then(result => setSubscriptions(result.count)).catch(() => undefined);
    fetchWatchlistCount(id).then(setWatchlist).catch(() => undefined);
  }, [id, t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.content}>
      <ImageBackground source={profile?.coverUrl ? { uri: profile.coverUrl } : undefined} style={styles.cover}>
        <Pressable style={styles.back} onPress={() => router.back()}><Feather name="arrow-left" size={22} color={colors.text}/></Pressable>
      </ImageBackground>
      {profile ? <><View style={styles.summary}><ProfileSummary profile={profile} subscriptions={subscriptions} watchlist={watchlist}/></View>
        {([['package', 'productsServices', 'products'], ['film', 'videosAudios', 'medias']] as const).map(([icon, label, kind]) =>
          <Pressable key={kind} style={styles.link} onPress={() => router.push({ pathname: '/profile/[kind]', params: { kind, userId: id } })}>
            <Feather name={icon} size={19} color={colors.text}/><Text style={styles.linkText}>{t(label)}</Text><Feather name="chevron-right" size={18} color={colors.muted}/>
          </Pressable>)}</> : <Text style={styles.message}>{error || t('loadingMedia')}</Text>}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, content: { paddingBottom: 30 }, cover: { height: 160, marginBottom: 18, backgroundColor: colors.panel }, back: { margin: 12, width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#0009' }, summary: { paddingHorizontal: 16 }, link: { marginHorizontal: 16, marginTop: 9, padding: 16, borderRadius: 8, backgroundColor: colors.panel, flexDirection: 'row', alignItems: 'center', gap: 12 }, linkText: { flex: 1, color: colors.text, fontWeight: '800' }, message: { color: colors.muted, padding: 20 } });
