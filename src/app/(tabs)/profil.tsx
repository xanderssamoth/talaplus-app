import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppHeader from '@/components/AppHeader';
import { colors } from '@/constants/theme';
import { getCurrentUser, signOut } from '@/lib/session';
import { getAvatarSource } from '@/utils/user';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const user = getCurrentUser();
  const languageName = i18n.language === 'ln' ? 'Lingala' : i18n.language === 'en' ? 'English' : 'Francais';
  const avatarSource = getAvatarSource(user);

  const menu = [
    ['clock', t('history')],
    ['heart', t('watchlist')],
    ['credit-card', t('subscriptions')],
    ['share-2', t('referral')],
    ['settings', t('settings')],
  ];

  const logout = () => {
    signOut();
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={t('profile')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          {avatarSource ? (
            <Image source={avatarSource} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{user.firstname.charAt(0) || 'T'}</Text>
            </View>
          )}
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{user.firstname} {user.lastname.charAt(0)}.</Text>
            <Text style={styles.premium}>Premium</Text>
            <Text style={styles.member}>{t('memberSince')}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          {[
            ['120', t('videosWatched')],
            ['45', t('subscriptions')],
            ['12', t('watchlist')],
          ].map(([value, label]) => (
            <View key={label} style={styles.stat}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {menu.map(([icon, label]) => (
          <Pressable key={label} style={styles.menuItem} onPress={() => label === t('subscriptions') && router.push('/subscription')}>
            <Feather name={icon as keyof typeof Feather.glyphMap} size={18} color={colors.text} />
            <Text style={styles.menuText}>{label}</Text>
            <Feather name="chevron-right" size={18} color={colors.muted} />
          </Pressable>
        ))}

        <Pressable style={styles.menuItem} onPress={() => router.push('/language')}>
          <Feather name="globe" size={18} color={colors.text} />
          <Text style={styles.menuText}>{t('language')}</Text>
          <Text style={styles.languageValue}>{languageName}</Text>
        </Pressable>

        <Pressable style={styles.partner} onPress={() => router.push('/partner')}>
          <Text style={styles.partnerTitle}>{t('partnerTitle')}</Text>
          <Text style={styles.partnerText}>{t('partnerText')}</Text>
        </Pressable>

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
