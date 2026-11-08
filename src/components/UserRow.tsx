import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import VerificationBadge from '@/components/VerificationBadge';
import { fetchProfile, normalizeProfile } from '@/lib/profile-api';

export default function UserRow({ user }: { user: Record<string, any> }) {
  const source = user.user ?? user.subscribed_user ?? user.followed_user ?? user;
  const profile = normalizeProfile(source);
  const [verified, setVerified] = useState(profile.type === 'certified');
  useEffect(() => { if (!profile.id) return; let active = true; fetchProfile(profile.id).then(fresh => { if (active) setVerified(fresh.type === 'certified'); }).catch(() => undefined); return () => { active = false; }; }, [profile.id]);
  return <Pressable style={styles.row} onPress={() => profile.id && router.push(`/user/${profile.id}`)}>
    {profile.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.initial}>{profile.name[0] || 'T'}</Text></View>}
    <View style={styles.info}><Text style={styles.name}>{profile.name}</Text><Text style={styles.username}>@{profile.username}</Text></View>
    {verified && <VerificationBadge type="certified" />}
  </Pressable>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, marginBottom: 8, backgroundColor: colors.panel }, avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight }, initial: { color: colors.text, fontWeight: '900' }, info: { flex: 1 }, name: { color: colors.text, fontWeight: '900' }, username: { color: colors.muted, fontSize: 12, marginTop: 3 } });
