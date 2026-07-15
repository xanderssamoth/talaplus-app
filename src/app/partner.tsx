import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';

const statKeys = [
  ['signups', '256', '+12%'],
  ['subscriptions', '98', '+8%'],
  ['revenue', '245,50 $', '+16%'],
] as const;

export default function PartnerScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title}>{t('partner')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.codeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t('yourPartnerCode')}</Text>
            <Text style={styles.code}>TALA12345</Text>
          </View>
          <Pressable style={styles.share}><Text style={styles.shareText}>{t('share')}</Text></Pressable>
        </View>

        <View style={styles.statHeader}>
          <Text style={styles.blockTitle}>{t('statistics')}</Text>
          <Text style={styles.period}>{t('sevenDays')}</Text>
        </View>

        <View style={styles.stats}>
          {statKeys.map(([labelKey, value, trend]) => (
            <View key={labelKey} style={styles.stat}>
              <Text style={styles.statLabel}>{t(labelKey)}</Text>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.trend}>{trend}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chart}>
          <Text style={styles.blockTitle}>{t('revenueEvolution')}</Text>
          <View style={styles.chartArea}>
            {[80, 130, 100, 170, 180, 220, 160, 190, 250, 290].map((height, index) => (
              <View key={index} style={styles.chartBarWrap}>
                <View style={[styles.chartBar, { height }]} />
              </View>
            ))}
          </View>
          <View style={styles.days}>
            {['mondayShort', 'tuesdayShort', 'wednesdayShort', 'thursdayShort', 'fridayShort', 'saturdayShort', 'sundayShort'].map((dayKey) => <Text key={dayKey} style={styles.day}>{t(dayKey)}</Text>)}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  content: { padding: 16, paddingBottom: 30 },
  codeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, padding: 16, backgroundColor: colors.panel },
  label: { color: colors.muted, fontSize: 12 },
  code: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 9 },
  share: { borderRadius: 8, paddingHorizontal: 18, paddingVertical: 13, backgroundColor: colors.primary },
  shareText: { color: colors.text, fontWeight: '900' },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 12 },
  blockTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  period: { color: colors.text, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.panel },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, borderRadius: 8, padding: 12, backgroundColor: colors.panel },
  statLabel: { color: colors.muted, fontSize: 11 },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 10 },
  trend: { color: colors.success, fontWeight: '900', marginTop: 5 },
  chart: { borderRadius: 8, padding: 16, marginTop: 16, backgroundColor: colors.panel },
  chartArea: { height: 220, flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 16 },
  chartBarWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  chartBar: { width: 8, borderRadius: 8, backgroundColor: colors.primary },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  day: { color: colors.muted, fontSize: 11 },
});
