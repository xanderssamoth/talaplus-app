import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import { ApiPost } from '@/lib/api';
import { fetchProfile } from '@/lib/profile-api';
import VerificationBadge from '@/components/VerificationBadge';

const cache = new Map<string, { type: string; checkedAt: number }>();
export default function PostIdentity({ post }: { post: ApiPost }) {
  const [type, setType] = useState(post.userType ?? '');
  useEffect(() => {
    if (!post.userId) return;
    const cached = cache.get(post.userId);
    if (cached) setType(cached.type);
    if (cached && Date.now() - cached.checkedAt < 15000) return;
    let active = true;
    fetchProfile(post.userId).then(profile => { cache.set(post.userId!, { type: profile.type, checkedAt: Date.now() }); if (active) setType(profile.type); }).catch(() => undefined);
    return () => { active = false; };
  }, [post.userId]);
  return <Pressable style={styles.row} onPress={() => post.userId && router.push(`/user/${post.userId}`)} disabled={!post.userId}>
    {post.avatarUrl ? <Image source={{ uri: post.avatarUrl }} style={styles.avatar}/> : <View style={styles.avatar}><Text style={styles.initial}>{post.author.charAt(0)}</Text></View>}
    <View style={styles.body}><Text style={styles.name}>{post.author}</Text><Text style={styles.username}>@{post.username}</Text></View>
    {type === 'certified' && <VerificationBadge type="certified"/>}
  </Pressable>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }, avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.panelLight, alignItems: 'center', justifyContent: 'center' }, initial: { color: colors.text, fontWeight: '900' }, body: { flex: 1 }, name: { color: colors.text, fontWeight: '900' }, username: { color: colors.muted, fontSize: 12 } });
