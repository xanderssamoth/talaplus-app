import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { Profile } from '@/lib/profile-api';
import VerificationBadge from '@/components/VerificationBadge';

export default function ProfileSummary({ profile, subscriptions, watchlist, editable, onAvatar, onVerify }: { profile: Profile; subscriptions: number; watchlist: number; editable?: boolean; onAvatar?: () => void; onVerify?: () => void }) {
  const { t, i18n } = useTranslation();
  const date = profile.createdAt ? new Date(profile.createdAt) : null;
  const memberDate = date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(i18n.language === 'ln' ? 'fr' : i18n.language, { month: 'short', year: 'numeric' }).format(date) : '';
  const stats = [[profile.views, 'mediaViewedOne', 'mediaViewedMany'], [profile.plays, 'mediaPlayedOne', 'mediaPlayedMany'], [subscriptions, 'subscriptionOne', 'subscriptionMany'], [watchlist, 'watchlist']];
  return <><View style={styles.identity}><View>{profile.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.initial}>{profile.name[0] || 'T'}</Text></View>}{editable && <Pressable style={styles.editAvatar} onPress={onAvatar}><Feather name="camera" size={17} color={colors.text}/></Pressable>}</View><View style={styles.info}><Text style={styles.name}>{profile.name}</Text><VerificationBadge type={profile.type} onPress={editable ? onVerify : undefined}/>{!!memberDate && <Text style={styles.member}>{t('memberSinceDynamic', { date: memberDate })}</Text>}</View></View><View style={styles.stats}>{stats.map(([value, one, many], index) => <View key={index} style={styles.stat}><Text style={styles.number}>{value}</Text><Text style={styles.caption}>{t(Number(value) > 1 ? String(many ?? one) : String(one))}</Text></View>)}</View></>;
}
const styles = StyleSheet.create({ identity: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 }, avatar: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight }, initial: { color: colors.text, fontSize: 28, fontWeight: '900' }, editAvatar: { position: 'absolute', right: -4, bottom: -2, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, info: { flex: 1, gap: 5 }, name: { color: colors.text, fontSize: 21, fontWeight: '900' }, member: { color: colors.muted, fontSize: 12 }, stats: { flexDirection: 'row', gap: 5 }, stat: { flex: 1, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', borderRadius: 8, backgroundColor: colors.panel }, number: { color: colors.text, fontSize: 18, fontWeight: '900' }, caption: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 4 } });
