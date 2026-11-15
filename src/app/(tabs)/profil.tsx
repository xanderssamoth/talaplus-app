import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppHeader from '@/components/AppHeader';
import { colors } from '@/constants/theme';
import { getCurrentUser, signOut } from '@/lib/session';
import ProfileSummary from '@/components/ProfileSummary';
import { fetchCart, fetchFollowers, fetchProfile, fetchWatchlistCount, Profile, uploadAvatar } from '@/lib/profile-api';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const user = getCurrentUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [followers, setFollowers] = useState(0);
  const [watchlist, setWatchlist] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [error, setError] = useState('');
  const languageName = i18n.language === 'ln' ? 'Lingala' : i18n.language === 'en' ? 'English' : 'Francais';
  const load = useCallback(() => {
    fetchProfile(user.id).then(setProfile).catch(e => setError(e instanceof Error ? e.message : t('requestFailed')));
    fetchFollowers(user.id).then(r => setFollowers(r.count)).catch(() => undefined);
    fetchWatchlistCount(user.id).then(setWatchlist).catch(() => undefined);
    fetchCart(user.id).then(r => setCartCount(r.count)).catch(() => undefined);
  }, [user.id, t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const changeAvatar = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;
    try {
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: 'base64' });
      const updated = await uploadAvatar(user.id, base64);
      setProfile(updated);
    } catch (e) { Alert.alert(t('actionImpossible'), e instanceof Error ? e.message : t('requestFailed')); }
  };

  const menu = [
    ['package', 'productsServices', '/profile/products'],
    ['film', 'videosAudios', '/profile/medias'],
    ['heart', 'watchlist', '/profile/watchlist'],
    ['shopping-cart', 'cart', '/profile/cart'],
    ['users', 'subscriptions', '/profile/subscriptions'],
    ['credit-card', 'payments', '/payments'],
    ['share-2', 'referral', '/profile/referral'],
    ['credit-card', 'wallet', '/profile/wallet'],
    ['settings', 'settings', '/profile/settings'],
  ];

  const logout = async () => {
    await signOut();
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={t('profile')} />
      <ScrollView contentContainerStyle={styles.content}>
        {profile ? <ProfileSummary profile={profile} followers={followers} watchlist={watchlist} editable onAvatar={changeAvatar} onVerify={() => router.push('/profile/verify')}/> : <Text style={styles.languageValue}>{error || t('loadingMedia')}</Text>}
        {menu.map(([icon, label, route]) => (
          <Pressable key={label} style={styles.menuItem} onPress={() => router.push(route as never)}>
            <Feather name={icon as keyof typeof Feather.glyphMap} size={18} color={colors.text} />
            <Text style={styles.menuText}>{t(label)}</Text>
            {label === 'cart' && cartCount > 0 && <Text style={styles.languageValue}>{cartCount}</Text>}
            <Feather name="chevron-right" size={18} color={colors.muted} />
          </Pressable>
        ))}

        <Pressable style={styles.menuItem} onPress={() => router.push('/language')}>
          <Feather name="globe" size={18} color={colors.text} />
          <Text style={styles.menuText}>{t('language')}</Text>
          <Text style={styles.languageValue}>{languageName}</Text>
        </Pressable>

        {!!profile?.promoCode && <Pressable style={styles.partner} onPress={() => router.push('/partner')}>
          <Text style={styles.partnerTitle}>{t('partnerTitle')}</Text>
          <Text style={styles.partnerText}>{t('partnerText')}</Text>
        </Pressable>}

        <Pressable style={styles.logoutButton} onPress={logout}>
          <Feather name="log-out" size={18} color={colors.text} />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 30 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: { width: 86, height: 86, borderRadius: 43 },
  avatarFallback: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  avatarFallbackText: { color: colors.text, fontSize: 28, fontWeight: '900' },
  nameBlock: { flex: 1 },
  name: { color: colors.text, fontSize: 24, fontWeight: '900' },
  premium: { alignSelf: 'flex-start', color: colors.text, fontSize: 12, fontWeight: '900', backgroundColor: colors.warning, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, marginTop: 6, overflow: 'hidden' },
  member: { color: colors.muted, marginTop: 7 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  stat: { flex: 1, alignItems: 'center', borderRadius: 8, paddingVertical: 14, backgroundColor: colors.panel },
  statValue: { color: colors.text, fontSize: 17, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 10, marginTop: 4, textAlign: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, padding: 15, marginBottom: 8, backgroundColor: colors.panel },
  menuText: { flex: 1, color: colors.text, fontWeight: '800' },
  languageValue: { color: colors.primary, fontWeight: '900' },
  partner: { borderRadius: 8, padding: 16, marginTop: 8, backgroundColor: colors.panelLight, borderWidth: 1, borderColor: colors.border },
  partnerTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  partnerText: { color: colors.muted, marginTop: 5 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 8, paddingVertical: 15, marginTop: 14, backgroundColor: colors.danger },
  logoutText: { color: colors.text, fontWeight: '900' },
});
