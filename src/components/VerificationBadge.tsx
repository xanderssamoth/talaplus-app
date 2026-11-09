import { Pressable, StyleSheet, Text } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';

export default function VerificationBadge({ type, onPress, compact = false }: { type?: string; onPress?: () => void; compact?: boolean }) {
  const { t } = useTranslation();
  const verified = type === 'certified';
  const pending = type === 'certifying';
  if (compact && !verified) return null;
  return <Pressable disabled={!onPress || pending || verified} onPress={onPress} style={[styles.badge, verified && styles.verified, pending && styles.pending]}>
    {verified ? <MaterialCommunityIcons name="check-decagram" size={compact ? 18 : 17} color="#53B4FF"/> : <Feather name={pending ? 'clock' : 'shield'} size={15} color={colors.text} />}
    {!compact && <Text style={styles.label}>{t(verified ? 'verified' : pending ? 'verificationPending' : 'verifyAccount')}</Text>}
  </Pressable>;
}
const styles = StyleSheet.create({ badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.primary }, verified: { backgroundColor: 'transparent', paddingHorizontal: 0 }, pending: { backgroundColor: colors.panelLight }, label: { color: colors.text, fontSize: 12, fontWeight: '800' } });
