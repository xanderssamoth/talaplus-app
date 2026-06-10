import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AppHeader from '@/components/AppHeader';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import SectionTitle from '@/components/SectionTitle';
import { colors } from '@/constants/theme';
import { ApiCategory, ApiMedia, getCategories, getPopularMedia, getRecentMedia } from '@/lib/api';
import { Country, fallbackCountries, fetchCountries } from '@/utils/countries';

export default function ExploreScreen() {
  const { t } = useTranslation();
  const [countries, setCountries] = useState<Country[]>(fallbackCountries);
  const [trends, setTrends] = useState<ApiMedia[]>([]);
  const [recent, setRecent] = useState<ApiMedia[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState({ trends: true, recent: true, categories: true });
  const filters = [t('all'), t('movies'), t('series'), t('music'), t('education')];

  useEffect(() => {
    fetchCountries()
      .then((items) => {
        const preferredCodes = ['CD', 'NG', 'CM', 'GH', 'FR', 'ZA', 'KE', 'US'];
        const preferred = preferredCodes
          .map((code) => items.find((country) => country.cca2 === code))
          .filter(Boolean) as Country[];

        setCountries(preferred.length ? preferred : items.slice(0, 8));
      })
      .catch(() => setCountries(fallbackCountries));

    getPopularMedia().then(({ items }) => setTrends(items)).catch(() => setTrends([])).finally(() => setLoading((state) => ({ ...state, trends: false })));
    getRecentMedia().then(({ items }) => setRecent(items)).catch(() => setRecent([])).finally(() => setLoading((state) => ({ ...state, recent: false })));
    getCategories().then(({ items }) => setCategories(items)).catch(() => setCategories([])).finally(() => setLoading((state) => ({ ...state, categories: false })));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={t('explore')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((filter, index) => (
            <Pressable key={filter} style={[styles.filter, index === 0 && styles.filterActive]}>
              <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>{filter}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <SectionTitle title={t('globalTrends')} />
        {loading.trends ? (
          <LoadingState compact />
        ) : trends.length ? (
          <FlatList horizontal data={trends.slice(0, 8)} keyExtractor={(item) => item.id} showsHorizontalScrollIndicator={false} renderItem={({ item }) => <MediaTile media={item} />} />
        ) : (
          <EmptyState title={t('noContentTitle')} body={t('noPopularMedia')} />
        )}

        <Text style={styles.blockTitle}>{t('byCategory')}</Text>
        {loading.categories ? (
          <LoadingState compact />
        ) : (
          <View style={styles.categories}>
            {categories.slice(0, 4).map((item) => (
              <View key={item.id} style={[styles.category, { backgroundColor: item.color }]}>
                <Text style={styles.categoryText}>{item.name}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.blockTitle}>{t('byCountry')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.countries}>
          {countries.map((country) => (
            <View key={country.cca2} style={styles.country}>
              <Image source={{ uri: country.flags.png ?? country.flags.svg }} style={styles.flag} />
              <Text style={styles.countryText} numberOfLines={1}>{country.name.common}</Text>
            </View>
          ))}
        </ScrollView>

        <SectionTitle title={t('newContent')} />
        {loading.recent ? (
          <LoadingState compact />
        ) : recent.length ? (
          <FlatList horizontal data={recent} keyExtractor={(item) => item.id} showsHorizontalScrollIndicator={false} renderItem={({ item }) => <MediaTile media={item} compact />} />
        ) : (
          <EmptyState title={t('noContentTitle')} body={t('noLatestMedia')} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MediaTile({ media, compact }: { media: ApiMedia; compact?: boolean }) {
  return (
    <Pressable style={[styles.mediaTile, compact && styles.mediaTileCompact]} onPress={() => router.push(`/mediaDetails/${media.id}`)}>
      {media.thumbnail ? <Image source={{ uri: media.thumbnail }} style={styles.mediaImage} /> : <View style={styles.mediaImage} />}
      <Text style={styles.mediaTitle} numberOfLines={1}>{media.title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 30 },
  filters: { gap: 8, paddingBottom: 18 },
  filter: { borderRadius: 8, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: colors.panel },
  filterActive: { backgroundColor: colors.primary },
  filterText: { color: colors.text, fontWeight: '800', fontSize: 12 },
  filterTextActive: { color: colors.text },
  blockTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 22, marginBottom: 12 },
  categories: { flexDirection: 'row', gap: 10 },
  category: { flex: 1, borderRadius: 8, alignItems: 'center', paddingVertical: 16 },
  categoryText: { color: colors.text, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  countries: { gap: 14, marginBottom: 22 },
  country: { width: 72, alignItems: 'center', gap: 6 },
  flag: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.panelLight },
  countryText: { color: colors.text, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  mediaTile: { width: 128, marginRight: 10 },
  mediaTileCompact: { width: 104 },
  mediaImage: { width: '100%', height: 138, borderRadius: 8, backgroundColor: colors.panelLight },
  mediaTitle: { color: colors.text, marginTop: 8, fontWeight: '700' },
});
