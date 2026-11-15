import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

type LoadingStateProps = {
  label?: string;
  compact?: boolean;
};

export default function LoadingState({ label = 'Chargement...', compact }: LoadingStateProps) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <ActivityIndicator size={compact ? 'small' : 'large'} color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 18,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compact: {
    minHeight: 86,
  },
  label: {
    color: colors.muted,
    fontWeight: '800',
    marginTop: 10,
  },
});
