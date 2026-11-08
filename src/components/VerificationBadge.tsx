import { Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';

export default function VerificationBadge({ type, onPress }: { type?: string; onPress?: () => void }) {
  const { t } = useTranslation();
  const verified = type === 'certified';
  const pending = type === 'certifying';
  return <Pressable disabled={!onPress || pending || verified} onPress={onPress} style={[styles.badge, verified && styles.verified, pending && styles.pending]}>
    <Feather name={verified ? 'check-circle' : pending ? 'clock' : 'shield'} size={15} color={colors.text} />
    <Text style={styles.label}>{t(verified ? 'verified' : pending ? 'verificationPending' : 'verifyAccount')}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({ badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.primary }, verified: { backgroundColor: '#166fc6' }, pending: { backgroundColor: colors.panelLight }, label: { color: colors.text, fontSize: 12, fontWeight: '800' } });
