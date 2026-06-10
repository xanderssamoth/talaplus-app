import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

const notifications = [
  ['Nouvel épisode disponible', 'The Last of Us a un nouvel épisode prêt à regarder.', 'Maintenant'],
  ['Watchlist', 'Top Gun: Maverick est tendance aujourd’hui.', '12 min'],
  ['TALA+ Premium', 'Votre abonnement Premium est actif.', '1 h'],
];

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {notifications.map(([title, body, time], index) => (
          <View key={title} style={styles.item}>
            <View style={[styles.dot, index === 0 && styles.dotActive]} />
            <View style={styles.body}>
              <Text style={styles.itemTitle}>{title}</Text>
              <Text style={styles.itemBody}>{body}</Text>
              <Text style={styles.time}>{time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  content: { padding: 16, paddingBottom: 30 },
  item: { flexDirection: 'row', gap: 12, borderRadius: 8, padding: 14, marginBottom: 10, backgroundColor: colors.panel },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.danger },
  body: { flex: 1 },
  itemTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  itemBody: { color: colors.muted, lineHeight: 20, marginTop: 4 },
  time: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 8 },
});
