import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import LiveVerifiedMark from '@/components/LiveVerifiedMark';
import { normalizeProfile } from '@/lib/profile-api';

export default function UserRow({ user }: { user: Record<string, any> }) {
  const source = user.user ?? user.subscribed_user ?? user.followed_user ?? user;
  const profile = normalizeProfile(source);
  return <Pressable style={styles.row} onPress={() => profile.id && router.push(`/user/${profile.id}`)}>
    {profile.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.initial}>{profile.name[0] || 'T'}</Text></View>}
    <View style={styles.info}><View style={styles.nameRow}><Text style={styles.name}>{profile.name}</Text><LiveVerifiedMark userId={profile.id} initialType={profile.type}/></View><Text style={styles.username}>@{profile.username}</Text></View>
  </Pressable>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, marginBottom: 8, backgroundColor: colors.panel }, avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight }, initial: { color: colors.text, fontWeight: '900' }, info: { flex: 1 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 }, name: { color: colors.text, fontWeight: '900' }, username: { color: colors.muted, fontSize: 12, marginTop: 3 } });
