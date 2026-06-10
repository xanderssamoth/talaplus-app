import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

type SectionTitleProps = {
  title: string;
  action?: string;
  onActionPress?: () => void;
};

export default function SectionTitle({ title, action, onActionPress }: SectionTitleProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {!!action && (
        <Pressable onPress={onActionPress}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  action: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
});
