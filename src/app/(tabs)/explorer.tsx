import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppHeader from '@/components/AppHeader';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import { ApiUserProfile, getEntrepreneurs } from '@/lib/api';

const defaultCategories = ['Développement Web', 'Développement Mobile', 'Design Graphique', 'Montage Vidéo', 'Marketing Digital', 'Rédaction'];
const defaultCountries = ['RDC', 'Congo', 'Cameroun', 'Sénégal', 'Gabon', 'France'];
const defaultCities = ['Kinshasa', 'Brazzaville', 'Douala', 'Dakar', 'Libreville', 'Paris'];

export default function BusinessPlusScreen() {
  const { t } = useTranslation();
  const [entrepreneurs, setEntrepreneurs] = useState<ApiUserProfile[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const categoryOptions = useMemo(() => unique([...defaultCategories, ...entrepreneurs.map((item) => item.category || '').filter(Boolean)]), [entrepreneurs]);
  const countryOptions = useMemo(() => unique([...defaultCountries, ...entrepreneurs.map((item) => item.country || '').filter(Boolean)]), [entrepreneurs]);
  const cityOptions = useMemo(() => unique([...defaultCities, ...entrepreneurs.map((item) => item.city || '').filter(Boolean)]), [entrepreneurs]);
  const badges = [
    ...categories.map((value) => ({ type: 'category' as const, value })),
    ...countries.map((value) => ({ type: 'country' as const, value })),
    ...cities.map((value) => ({ type: 'city' as const, value })),
  ];
  const visibleEntrepreneurs = entrepreneurs.filter((item) => (
    (!categories.length || categories.includes(item.category || '')) &&
    (!countries.length || countries.includes(item.country || '')) &&
    (!cities.length || cities.includes(item.city || ''))
  ));

  useEffect(() => {
    loadEntrepreneurs(1, true);
  }, [categories, countries, cities]);

  const loadEntrepreneurs = (nextPage: number, reset = false) => {
    if (loading || (!reset && nextPage > lastPage)) return;

    setLoading(true);
    getEntrepreneurs({ categoryIds: categories, countries, cities, page: nextPage })
      .then((result) => {
        setEntrepreneurs((current) => reset ? result.items : [...current, ...result.items]);
        setPage(nextPage);
        setLastPage(result.lastPage);
      })
      .catch(() => {
        if (reset) setEntrepreneurs([]);
      })
      .finally(() => setLoading(false));
  };

  const removeBadge = (badge: { type: 'category' | 'country' | 'city'; value: string }) => {
    if (badge.type === 'category') setCategories((items) => items.filter((item) => item !== badge.value));
    if (badge.type === 'country') setCountries((items) => items.filter((item) => item !== badge.value));
    if (badge.type === 'city') setCities((items) => items.filter((item) => item !== badge.value));
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showLogo showAvatar searchType="product" />
      <FlatList
        data={visibleEntrepreneurs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <>
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Business<Text style={styles.plus}>+</Text></Text>
              <Text style={styles.heroSubtitle}>{t('businessSubtitle')}</Text>
            </View>

            <Pressable style={styles.filterButton} onPress={() => setFilterVisible(true)}>
              <Feather name="sliders" size={18} color={colors.text} />
              <Text style={styles.filterButtonText}>{t('sort')}</Text>
            </Pressable>

            {!!badges.length && (
              <View style={styles.badges}>
                {badges.map((badge) => (
                  <Pressable key={`${badge.type}-${badge.value}`} style={styles.filterBadge} onPress={() => removeBadge(badge)}>
                    <Text style={styles.filterBadgeText}>{badge.value}</Text>
                    <Feather name="x" size={14} color={colors.text} />
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.entrepreneurHeader}>
              <View style={styles.sectionHeading}>
                <FontAwesome6 name="user-group" size={18} color="#FF7A00" />
                <Text style={styles.sectionTitle}>{t('entrepreneursAvailable')}</Text>
              </View>
            </View>
          </>
        )}
        renderItem={({ item }) => <EntrepreneurCard entrepreneur={item} />}
        ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title={t('noUserTitle')} body={t('noUserBody')} />}
        ListFooterComponent={loading && visibleEntrepreneurs.length ? <LoadingState compact /> : null}
        onEndReached={() => loadEntrepreneurs(page + 1)}
        onEndReachedThreshold={0.4}
      />

      <Modal transparent visible={filterVisible} animationType="slide" onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('sort')}</Text>
              <Pressable onPress={() => setFilterVisible(false)}><Feather name="x" size={22} color={colors.text} /></Pressable>
            </View>
            <ScrollView>
              <FilterGroup title={t('categories')} options={categoryOptions} selected={categories} onToggle={(value) => toggleValue(categories, setCategories, value)} />
              <FilterGroup title={t('countries')} options={countryOptions} selected={countries} onToggle={(value) => toggleValue(countries, setCountries, value)} />
              <FilterGroup title={t('cities')} options={cityOptions} selected={cities} onToggle={(value) => toggleValue(cities, setCities, value)} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function EntrepreneurCard({ entrepreneur }: { entrepreneur: ApiUserProfile }) {
  const { t } = useTranslation();

  return (
    <View style={styles.proCard}>
      {entrepreneur.avatarUrl ? <Image source={{ uri: entrepreneur.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.initial}>{entrepreneur.name.charAt(0)}</Text></View>}
      <View style={styles.proInfo}>
        <Text style={styles.proName} numberOfLines={1}>{entrepreneur.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>{[entrepreneur.country, entrepreneur.city, entrepreneur.category].filter(Boolean).join(' · ')}</Text>
        <Text style={styles.rating}>★ {entrepreneur.rating?.toFixed(1) ?? '4.5'} ({entrepreneur.reviews ?? 0} {t('reviews')})</Text>
        <Text style={styles.description} numberOfLines={2}>{entrepreneur.description || t('businessSubtitle')}</Text>
        <View style={styles.actions}>
          <Pressable style={styles.squareAction}><Feather name="message-circle" size={18} color={colors.text} /></Pressable>
          <Pressable style={styles.squareAction}><Feather name="phone" size={17} color={colors.text} /></Pressable>
          <Pressable style={styles.profileButton}><Text style={styles.profileText}>{t('viewProfile')}</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

function FilterGroup({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.filterOptions}>
        {options.map((option) => (
          <Pressable key={option} style={[styles.filterOption, selected.includes(option) && styles.filterOptionActive]} onPress={() => onToggle(option)}>
            <Text style={styles.filterOptionText}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function toggleValue(items: string[], setter: (items: string[]) => void, value: string) {
  setter(items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 96 },
  hero: { paddingTop: 16, paddingBottom: 14 },
  heroTitle: { color: colors.text, fontSize: 36, fontWeight: '900', letterSpacing: 0 },
  plus: { color: colors.primary },
  heroSubtitle: { color: '#D8DEE7', fontSize: 15, marginTop: 4 },
  filterButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, paddingVertical: 13, backgroundColor: colors.primary },
  filterButtonText: { color: colors.text, fontWeight: '900' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  filterBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.panel },
  filterBadgeText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  entrepreneurHeader: { paddingTop: 20, marginBottom: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  proCard: { flexDirection: 'row', gap: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, padding: 12, marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  initial: { color: colors.text, fontWeight: '900' },
  proInfo: { flex: 1, minWidth: 0 },
  proName: { color: colors.text, fontSize: 17, fontWeight: '900' },
  meta: { color: colors.muted, marginTop: 5, fontSize: 12, fontWeight: '700' },
  rating: { color: colors.text, marginTop: 6, fontSize: 12, fontWeight: '800' },
  description: { color: colors.text, lineHeight: 19, marginTop: 7, fontSize: 13 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  squareAction: { width: 42, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#2B6DB5', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1624' },
  profileButton: { flex: 1, minHeight: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  profileText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  modalSheet: { maxHeight: '82%', borderTopLeftRadius: 8, borderTopRightRadius: 8, padding: 16, backgroundColor: colors.background, borderTopWidth: 1, borderColor: colors.border },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  filterGroup: { marginBottom: 18 },
  filterTitle: { color: colors.text, fontWeight: '900', marginBottom: 10 },
  filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterOption: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.panel },
  filterOptionActive: { backgroundColor: colors.primary },
  filterOptionText: { color: colors.text, fontSize: 12, fontWeight: '800' },
});
