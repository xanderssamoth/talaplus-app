import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import { ApiPost } from '@/lib/api';
import LiveVerifiedMark from '@/components/LiveVerifiedMark';

export default function PostIdentity({ post }: { post: ApiPost }) {
  return <Pressable style={styles.row} onPress={() => post.userId && router.push(`/user/${post.userId}`)} disabled={!post.userId}>
    {post.avatarUrl ? <Image source={{ uri: post.avatarUrl }} style={styles.avatar}/> : <View style={styles.avatar}><Text style={styles.initial}>{post.author.charAt(0)}</Text></View>}
    <View style={styles.body}><View style={styles.nameRow}><Text style={styles.name}>{post.author}</Text><LiveVerifiedMark userId={post.userId} initialType={post.userType}/></View><Text style={styles.username}>@{post.username}</Text></View>
  </Pressable>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }, avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.panelLight, alignItems: 'center', justifyContent: 'center' }, initial: { color: colors.text, fontWeight: '900' }, body: { flex: 1 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 }, name: { color: colors.text, fontWeight: '900' }, username: { color: colors.muted, fontSize: 12 } });
