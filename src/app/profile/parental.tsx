import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { acceptChildInvitation, ChildInvitation, fetchChildInvitations, fetchProfile, toggleChildLock } from '@/lib/profile-api';
import { getCurrentUser } from '@/lib/session';

export default function ParentalControlScreen() {
  const { t } = useTranslation();
  const userId = getCurrentUser().id;
  const [invitations, setInvitations] = useState<ChildInvitation[]>([]);
  const [hasPending, setHasPending] = useState(false);
  const [childLockCode, setChildLockCode] = useState('');
  const [codeVisible, setCodeVisible] = useState(false);
  const [invitationsOpen, setInvitationsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [lockBusy, setLockBusy] = useState(false);
  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchChildInvitations(userId), fetchProfile(userId)]).then(([result, profile]) => {
      setInvitations(result.invitations);
      setHasPending(result.hasPendingInvitations);
      setChildLockCode(profile.childLockCode);
      setCodeVisible(false);
    }).catch(() => undefined).finally(() => setLoading(false));
  }, [userId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const accept = async (invitation: ChildInvitation) => {
    try {
      setBusyId(invitation.id);
      await acceptChildInvitation(invitation.id);
      setInvitations(current => current.filter(item => item.id === invitation.id).map(item => ({ ...item, status: 'accepted' })));
      setHasPending(false);
    } catch (e) { Alert.alert(t('actionImpossible'), e instanceof Error ? e.message : t('requestFailed')); }
    finally { setBusyId(''); }
  };
  const changeLock = async () => {
    try {
      setLockBusy(true);
      await toggleChildLock(userId);
      const profile = await fetchProfile(userId);
      setChildLockCode(profile.childLockCode);
      setCodeVisible(false);
    } catch (e) { Alert.alert(t('actionImpossible'), e instanceof Error ? e.message : t('requestFailed')); }
    finally { setLockBusy(false); }
  };
  const lockEnabled = childLockCode.length > 0;
  const accepted = invitations.find(item => item.status === 'accepted');
  const visible = accepted ? [accepted] : invitations.filter(item => item.status === 'pending');
  return <SafeAreaView style={styles.container}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Feather name="arrow-left" size={23} color={colors.text}/></Pressable><Text style={styles.title}>{t('parentalControl')}</Text><View style={{ width: 23 }}/></View>
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable style={[styles.lock, lockEnabled ? styles.lockDeactivate : styles.lockActivate]} disabled={lockBusy} onPress={changeLock}><Feather name={lockEnabled ? 'x' : 'check'} size={25} color={colors.text}/><View style={styles.flex}><Text style={styles.actionTitle}>{t('childSecurity')}</Text><Text style={styles.lockText}>{t(lockEnabled ? 'deactivateChildSecurity' : 'activateChildSecurity')}</Text></View>{lockBusy && <ActivityIndicator color={colors.text}/>}</Pressable>
      {lockEnabled ? <View style={styles.codeBlock}><View style={styles.codeIcon}><Feather name="lock" size={21} color={colors.primary}/></View><View style={styles.flex}><Text style={styles.codeLabel}>{t('parentalCode')}</Text><Text style={styles.codeValue}>{codeVisible ? childLockCode : '•'.repeat(Math.max(childLockCode.length, 4))}</Text></View><Pressable style={styles.eyeButton} onPress={() => setCodeVisible(current => !current)} accessibilityRole="button" accessibilityLabel={t(codeVisible ? 'hideParentalCode' : 'showParentalCode')}><Feather name={codeVisible ? 'eye-off' : 'eye'} size={22} color={colors.text}/></Pressable></View> : null}
      <Pressable style={styles.action} onPress={() => router.push('/profile/invite-children')}><View style={styles.actionIcon}><Feather name="user-plus" size={22} color={colors.text}/></View><View style={styles.flex}><Text style={styles.actionTitle}>{t('inviteChildren')}</Text><Text style={styles.muted}>{t('inviteChildrenHint')}</Text></View><Feather name="chevron-right" size={20} color={colors.muted}/></Pressable>
      <Pressable style={styles.invitationsButton} onPress={() => setInvitationsOpen(current => !current)}><Feather name="mail" size={20} color={colors.text}/><Text style={styles.actionTitle}>{t('parentInvitations')}</Text><Feather name={invitationsOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted}/></Pressable>
      {invitationsOpen && (loading ? <ActivityIndicator color={colors.primary}/> : !hasPending && !accepted ? <Text style={styles.empty}>{t('noParentInvitation')}</Text> : visible.map(invitation => <InvitationRow key={invitation.id} invitation={invitation} accepting={busyId === invitation.id} onAccept={() => accept(invitation)}/>))}
    </ScrollView>
  </SafeAreaView>;
}
function InvitationRow({ invitation, accepting, onAccept }: { invitation: ChildInvitation; accepting: boolean; onAccept: () => void }) {
  const { t } = useTranslation();
  const parent = invitation.parent;
  return <View style={styles.invitation}>
    {parent.avatarUrl ? <Image source={{ uri: parent.avatarUrl }} style={styles.avatar}/> : <View style={styles.avatar}><Text style={styles.initial}>{parent.name[0] || 'T'}</Text></View>}
    <View style={styles.flex}><Text style={styles.parentName}>{parent.name || parent.username}</Text><Text style={styles.muted}>@{parent.username}</Text></View>
    {invitation.status === 'accepted' ? <View style={styles.accepted}><Feather name="check" size={15} color={colors.text}/><Text style={styles.acceptedText}>{t('accepted')}</Text></View> : <Pressable style={styles.accept} disabled={accepting} onPress={onAccept}>{accepting ? <ActivityIndicator color={colors.text}/> : <Text style={styles.acceptText}>{t('accept')}</Text>}</Pressable>}
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: colors.text, fontSize: 20, fontWeight: '900' }, content: { padding: 16, gap: 12, paddingBottom: 36 }, flex: { flex: 1 }, action: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, backgroundColor: colors.panel }, actionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, actionTitle: { flex: 1, color: colors.text, fontWeight: '900', fontSize: 16 }, muted: { color: colors.muted, fontSize: 12, marginTop: 3 }, lock: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12 }, lockActivate: { backgroundColor: colors.success }, lockDeactivate: { backgroundColor: colors.danger }, lockText: { color: colors.text, marginTop: 3 }, codeBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.panel }, codeIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight }, codeLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' }, codeValue: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: 4, marginTop: 4 }, eyeButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: colors.panelLight }, invitationsButton: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 16, borderRadius: 12, backgroundColor: colors.panel }, empty: { color: colors.muted, textAlign: 'center', paddingVertical: 25 }, invitation: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 12, backgroundColor: colors.panel }, avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight }, initial: { color: colors.text, fontWeight: '900' }, parentName: { color: colors.text, fontWeight: '900' }, accept: { paddingHorizontal: 13, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 8, minWidth: 72, alignItems: 'center' }, acceptText: { color: colors.text, fontWeight: '900' }, accepted: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.success }, acceptedText: { color: colors.text, fontWeight: '900', fontSize: 12 } });
