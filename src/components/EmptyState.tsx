import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

type EmptyStateProps = {
  title: string;
  body: string;
};

export default function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.image}>
        <Feather name="inbox" size={32} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
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
  image: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: colors.panelLight,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  body: {
    color: colors.muted,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
});
