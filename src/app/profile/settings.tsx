import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { fetchProfile, updateProfile, updateStatus } from '@/lib/profile-api';
import { getCurrentUser, signOut } from '@/lib/session';

export default function ProfileSettings() {
  const { t } = useTranslation();
  const id = getCurrentUser().id;
  const [christian, setChristian] = useState(false);
  const [busy, setBusy] = useState(false);
  useFocusEffect(useCallback(() => { fetchProfile(id).then(p => setChristian(p.christianPreference)).catch(() => undefined); }, [id]));
  const fail = (e: unknown) => Alert.alert(t('actionImpossible'), e instanceof Error ? e.message : t('requestFailed'));
  const toggle = async (value: boolean) => {
    setChristian(value);
    try { setBusy(true); await updateProfile(id, { christian_preference: value }); }
    catch (e) { setChristian(!value); fail(e); }
    finally { setBusy(false); }
  };
  const changeStatus = (status: 'disabled' | 'deleted') => Alert.alert(t(status === 'deleted' ? 'deleteAccount' : 'disableAccount'), t(status === 'deleted' ? 'deleteWarning' : 'disableAccount'), [
    { text: t('cancel'), style: 'cancel' },
    { text: t(status === 'deleted' ? 'deleteNow' : 'disableAccount'), style: 'destructive', onPress: async () => { try { setBusy(true); await updateStatus(id, status); await signOut(); router.replace('/'); } catch (e) { fail(e); } finally { setBusy(false); } } },
  ]);
  return <SafeAreaView style={styles.container}><View style={styles.header}><Pressable onPress={() => router.back()}><Feather name="arrow-left" size={23} color={colors.text}/></Pressable><Text style={styles.title}>{t('settings')}</Text><View style={{ width: 23 }}/></View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.row}><Text style={styles.rowText}>{t('christianOnly')}</Text><Switch value={christian} onValueChange={toggle} disabled={busy}/></View>
      {([['personalData', '/profile/personal'], ['changePassword', '/profile/password']] as const).map(([key, route]) => <Pressable key={key} style={styles.row} onPress={() => router.push(route)}><Text style={styles.rowText}>{t(key)}</Text><Feather name="chevron-right" size={18} color={colors.muted}/></Pressable>)}
      <Pressable style={styles.row} disabled={busy} onPress={() => changeStatus('disabled')}><Text style={styles.danger}>{t('disableAccount')}</Text></Pressable>
      <Pressable style={styles.row} disabled={busy} onPress={() => changeStatus('deleted')}><Text style={styles.danger}>{t('deleteAccount')}</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: colors.text, fontSize: 20, fontWeight: '900' }, content: { padding: 16, gap: 10 }, row: { padding: 16, borderRadius: 8, backgroundColor: colors.panel, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, rowText: { color: colors.text, fontWeight: '800' }, danger: { color: '#f66', fontWeight: '800' } });
