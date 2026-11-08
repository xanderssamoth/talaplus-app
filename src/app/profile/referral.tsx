import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { becomeReferrer, fetchProfile, fetchReferrees, Profile } from '@/lib/profile-api';
import { getCurrentUser } from '@/lib/session';
import UserRow from '@/components/UserRow';

export default function ReferralScreen() {
  const { t } = useTranslation();
  const id = getCurrentUser().id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => { fetchProfile(id).then(setProfile).catch(() => undefined); fetchReferrees(id).then(r => setItems(r.items)).catch(() => undefined); }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const join = async () => { try { setBusy(true); await becomeReferrer(id); load(); } catch (e) { Alert.alert(t('actionImpossible'), e instanceof Error ? e.message : t('requestFailed')); } finally { setBusy(false); } };
  return <SafeAreaView style={styles.container}><View style={styles.header}><Pressable onPress={() => router.back()}><Feather name="arrow-left" size={23} color={colors.text}/></Pressable><Text style={styles.title}>{t('referral')}</Text><View style={{ width: 23 }}/></View><ScrollView contentContainerStyle={styles.content}>
    {profile?.promoCode ? <View style={styles.card}><Text style={styles.muted}>{t('yourPartnerCode')}</Text><Text style={styles.code}>{profile.promoCode}</Text><Pressable style={styles.button} onPress={() => Share.share({ message: `https://talaplus.tv/referral?referral_code=${encodeURIComponent(profile.promoCode)}` })}><Text style={styles.buttonText}>{t('share')}</Text></Pressable><Pressable onPress={() => router.push('/partner')}><Text style={styles.link}>{t('partnerTitle')} →</Text></Pressable></View> : <Pressable style={styles.button} disabled={busy} onPress={join}><Text style={styles.buttonText}>{t('becomePartner')}</Text></Pressable>}
    <Text style={styles.title}>{t('signups')} ({items.length})</Text>{items.length ? items.map((item, index) => <UserRow key={String(item.id ?? index)} user={item}/>) : <Text style={styles.muted}>{t('noReferrees')}</Text>}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: colors.text, fontSize: 20, fontWeight: '900' }, content: { padding: 16, gap: 14 }, card: { padding: 18, borderRadius: 8, backgroundColor: colors.panel, gap: 10 }, muted: { color: colors.muted }, code: { color: colors.text, fontSize: 24, fontWeight: '900' }, button: { padding: 14, alignItems: 'center', borderRadius: 8, backgroundColor: colors.primary }, buttonText: { color: colors.text, fontWeight: '900' }, link: { color: colors.primary, fontWeight: '800' } });
