import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppHeader from '@/components/AppHeader';
import { colors } from '@/constants/theme';

const discussions = [
  ['Passion Cinema', 'Discussion sur les derniers films', '32', '15 min'],
  ['Musique du moment', 'Partagez vos sons preferes', '24', '1 h'],
  ['Entrepreneurs de demain', 'Conseils et partage d experiences', '18', '2 h'],
  ['Apprenons ensemble', 'Cours, metiers et opportunites', '12', '3 h'],
  ['Sport & Performance', 'Simulations, resultats et analyses', '8', '5 h'],
];

export default function CommunityScreen() {
  const { t } = useTranslation();
  const tabs = [t('discussions'), t('groups'), t('publications')];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={t('community')}
        right={<Pressable style={styles.messageButton} onPress={() => router.push('/messages')}><Feather name="message-circle" size={20} color={colors.text} /></Pressable>}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.tabs}>
          {tabs.map((tab, index) => (
            <Text key={tab} style={[styles.tab, index === 0 && styles.activeTab]}>{tab}</Text>
          ))}
        </View>

        {discussions.map(([title, subtitle, count, time], index) => (
          <Pressable key={title} style={styles.thread} onPress={() => router.push('/messages')}>
            <View style={styles.threadAvatar}>
              <Text style={styles.threadInitial}>{title.charAt(0)}</Text>
            </View>
            <View style={styles.threadBody}>
              <Text style={styles.threadTitle}>{title}</Text>
              <Text style={styles.threadSubtitle}>{subtitle}</Text>
            </View>
            <View style={styles.threadMeta}>
              <Text style={styles.badge}>{count}</Text>
              <Text style={styles.time}>{time}</Text>
            </View>
          </Pressable>
        ))}

        <Pressable style={styles.newButton}>
          <Feather name="plus-circle" size={16} color={colors.text} />
          <Text style={styles.newButtonText}>{t('newDiscussion')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 30 },
  messageButton: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, color: colors.text, textAlign: 'center', fontSize: 12, fontWeight: '800', paddingVertical: 10, borderRadius: 8, backgroundColor: colors.panel },
  activeTab: { backgroundColor: colors.primary },
  thread: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: colors.panel },
  threadAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  threadInitial: { color: colors.text, fontWeight: '900' },
  threadBody: { flex: 1 },
  threadTitle: { color: colors.text, fontWeight: '900' },
  threadSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  threadMeta: { alignItems: 'flex-end', gap: 5 },
  badge: { color: colors.text, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, fontWeight: '900', overflow: 'hidden' },
  time: { color: colors.muted, fontSize: 11 },
  newButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, paddingVertical: 14, marginTop: 8, backgroundColor: colors.primary },
  newButtonText: { color: colors.text, fontWeight: '900' },
});
