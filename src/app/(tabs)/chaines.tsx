import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppHeader from '@/components/AppHeader';
import { colors } from '@/constants/theme';

const channels = [
  { id: 'films', titleKey: 'filmsAndSeries', icon: 'movie-open', color: '#2677D7' },
  { id: 'comedie', titleKey: 'comedy', icon: 'emoticon-excited', color: '#F36A25' },
  { id: 'musique', titleKey: 'music', icon: 'music', color: '#7D35D8' },
  { id: 'education', titleKey: 'education', icon: 'school', color: '#38A35A' },
  { id: 'business', titleKey: 'business', icon: 'briefcase', color: '#F6A128' },
  { id: 'metiers', titleKey: 'crafts', icon: 'tools', color: '#287AC0' },
  { id: 'sport', titleKey: 'simulatedSport', icon: 'soccer', color: '#37A33B' },
  { id: 'documentaires', titleKey: 'documentaries', icon: 'bag-suitcase', color: '#127B8F' },
];

export default function ChannelsScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={t('channels')} />
      <ScrollView contentContainerStyle={styles.grid}>
        {channels.map((item) => (
          <Pressable key={item.id} style={[styles.tile, { backgroundColor: item.color }]} onPress={() => router.push(`/channel/${item.id}`)}>
            <MaterialCommunityIcons name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={42} color={colors.text} />
            <Text style={styles.tileText}>{t(item.titleKey)}</Text>
          </Pressable>
        ))}

        <Pressable style={styles.aiCard} onPress={() => router.push('/ai')}>
          <FontAwesome5 name="robot" size={25} color={colors.primary} />
          <View style={styles.aiTextBlock}>
            <Text style={styles.aiTitle}>TALA+ IA</Text>
            <Text style={styles.aiText}>{t('askAi')}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16, paddingBottom: 30 },
  tile: {
    width: '48%',
    height: 122,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  tileText: { color: colors.text, fontWeight: '900', textAlign: 'center' },
  aiCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 8,
    padding: 16,
    marginTop: 6,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiTextBlock: { flex: 1 },
  aiTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  aiText: { color: colors.muted, marginTop: 3 },
});
