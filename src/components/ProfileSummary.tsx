import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { Profile } from '@/lib/profile-api';
import VerificationBadge from '@/components/VerificationBadge';

export default function ProfileSummary({ profile, followers, subscriptions = 0, mediaCount = 0, watchlist = 0, editable, onAvatar, onVerify }: { profile: Profile; followers: number; subscriptions?: number; mediaCount?: number; watchlist?: number; editable?: boolean; onAvatar?: () => void; onVerify?: () => void }) {
  const { t, i18n } = useTranslation();
  const date = profile.createdAt ? new Date(profile.createdAt) : null;
  const memberDate = date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(i18n.language === 'ln' ? 'fr' : i18n.language, { month: 'short', year: 'numeric' }).format(date) : '';
  const stats = editable
    ? [[profile.views, 'mediaViewedOne', 'mediaViewedMany'], [profile.plays, 'mediaPlayedOne', 'mediaPlayedMany'], [followers, 'followerOne', 'followerMany'], [watchlist, 'watchlist', 'watchlist']]
    : [[mediaCount, 'videosAudios', 'videosAudios'], [subscriptions, 'subscriptionOne', 'subscriptionMany'], [followers, 'followerOne', 'followerMany']];
  return <>
    <View style={styles.identity}>
      <View>{profile.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatar}/> : <View style={styles.avatar}><Text style={styles.initial}>{profile.name[0] || 'T'}</Text></View>}{editable && <Pressable style={styles.editAvatar} onPress={onAvatar}><Feather name="camera" size={17} color={colors.text}/></Pressable>}</View>
      <View style={styles.info}>
        <View style={styles.nameRow}><Text style={styles.name}>{profile.name}</Text>{profile.type === 'certified' && <VerificationBadge type="certified" compact/>}</View>
        {editable && profile.type === 'certified' && <Text style={styles.verifiedText}>{t('verified')}</Text>}
        {editable && profile.type !== 'certified' && <VerificationBadge type={profile.type} onPress={onVerify}/>}
        {!!memberDate && <Text style={styles.member}>{t('memberSinceDynamic', { date: memberDate })}</Text>}
      </View>
    </View>
    <View style={styles.stats}>{stats.map(([value, one, many], index) => <View key={index} style={styles.stat}><Text style={styles.number}>{value}</Text><Text style={styles.caption}>{t(Number(value) > 1 ? String(many ?? one) : String(one))}</Text></View>)}</View>
  </>;
}
const styles = StyleSheet.create({ identity: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 }, avatar: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight }, initial: { color: colors.text, fontSize: 28, fontWeight: '900' }, editAvatar: { position: 'absolute', right: -4, bottom: -2, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, info: { flex: 1, gap: 5 }, nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }, name: { color: colors.text, fontSize: 21, fontWeight: '900' }, verifiedText: { color: '#53B4FF', fontSize: 12, fontWeight: '800' }, member: { color: colors.muted, fontSize: 12 }, stats: { flexDirection: 'row', gap: 5 }, stat: { flex: 1, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', borderRadius: 8, backgroundColor: colors.panel }, number: { color: colors.text, fontSize: 18, fontWeight: '900' }, caption: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 4 } });
