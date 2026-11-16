import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { inviteChildren, Profile, searchUsersForChildren } from '@/lib/profile-api';
import { getCurrentUser } from '@/lib/session';

export default function InviteChildrenScreen() {
  const { t } = useTranslation();
  const userId = getCurrentUser().id;
  const [word, setWord] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const term = word.trim();
    if (term.length < 2) { setResults([]); setError(''); return; }
    const timer = setTimeout(() => {
      setSearching(true);
      searchUsersForChildren(userId, term).then(users => { setResults(users); setError(''); }).catch(e => { setResults([]); setError(e instanceof Error ? e.message : t('requestFailed')); }).finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [word, userId, t]);
  const toggle = (id: string) => setSelectedIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const invite = async () => {
    if (!selectedIds.length) return;
    try {
      setInviting(true);
      await inviteChildren(selectedIds);
      Alert.alert(t('invitationSentTitle'), t('invitationSentBody'));
      router.back();
    } catch (e) { Alert.alert(t('actionImpossible'), e instanceof Error ? e.message : t('requestFailed')); }
    finally { setInviting(false); }
  };
  return <SafeAreaView style={styles.container}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Feather name="arrow-left" size={23} color={colors.text}/></Pressable><Text style={styles.title}>{t('inviteChildren')}</Text><View style={{ width: 23 }}/></View>
    <View style={styles.searchWrap}><Feather name="search" size={19} color={colors.muted}/><TextInput value={word} onChangeText={setWord} autoFocus placeholder={t('searchChildren')} placeholderTextColor={colors.muted} style={styles.search}/>{!!word && <Pressable onPress={() => setWord('')}><Feather name="x" size={19} color={colors.muted}/></Pressable>}</View>
    <View style={styles.list}>{searching && <ActivityIndicator color={colors.primary}/>} {!!error && <Text style={styles.error}>{error}</Text>}{!searching && word.trim().length >= 2 && !error && !results.length && <Text style={styles.empty}>{t('noUserTitle')}</Text>}{results.map(user => <Pressable key={user.id} style={[styles.row, selectedIds.includes(user.id) && styles.rowSelected]} onPress={() => toggle(user.id)}>{user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={styles.avatar}/> : <View style={styles.avatar}><Text style={styles.initial}>{user.name[0] || 'T'}</Text></View>}<View style={styles.flex}><Text style={styles.name}>{user.name || user.username}</Text><Text style={styles.username}>@{user.username}</Text></View><Feather name={selectedIds.includes(user.id) ? 'check-circle' : 'circle'} size={22} color={selectedIds.includes(user.id) ? colors.primary : colors.muted}/></Pressable>)}</View>
    {!!selectedIds.length && <View style={styles.footer}><Pressable style={styles.invite} disabled={inviting} onPress={invite}>{inviting ? <ActivityIndicator color={colors.text}/> : <Text style={styles.inviteText}>{t('inviteSelected', { count: selectedIds.length })}</Text>}</Pressable></View>}
  </SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: colors.text, fontSize: 20, fontWeight: '900' }, searchWrap: { marginHorizontal: 16, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, backgroundColor: colors.panel }, search: { flex: 1, color: colors.text, paddingVertical: 13 }, list: { flex: 1, padding: 16, gap: 9 }, row: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderWidth: 1, borderColor: 'transparent', borderRadius: 10, backgroundColor: colors.panel }, rowSelected: { borderColor: colors.primary, backgroundColor: colors.panelLight }, avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight }, initial: { color: colors.text, fontWeight: '900' }, flex: { flex: 1 }, name: { color: colors.text, fontWeight: '900' }, username: { color: colors.muted, marginTop: 3, fontSize: 12 }, empty: { color: colors.muted, textAlign: 'center', padding: 24 }, error: { color: colors.danger, textAlign: 'center', padding: 16 }, footer: { padding: 16, borderTopWidth: 1, borderColor: colors.border }, invite: { padding: 15, borderRadius: 10, alignItems: 'center', backgroundColor: colors.primary }, inviteText: { color: colors.text, fontWeight: '900' } });
