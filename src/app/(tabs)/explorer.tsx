import type React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome6 } from '@expo/vector-icons';
import AppHeader from '@/components/AppHeader';
import { colors } from '@/constants/theme';

type BusinessCountry = {
  code: string;
  name: string;
  flag: string;
};

type BusinessCategory = {
  name: string;
  icon: keyof typeof FontAwesome6.glyphMap;
};

type Entrepreneur = {
  id: string;
  name: string;
  country: string;
  flag: string;
  category: string;
  rating: string;
  reviews: number;
  description: string;
  missions: number;
  tags: string[];
  avatar: string;
};

const countries: BusinessCountry[] = [
  { code: 'CD', name: 'RDC', flag: 'https://flagcdn.com/w160/cd.png' },
  { code: 'CG', name: 'Congo', flag: 'https://flagcdn.com/w160/cg.png' },
  { code: 'CM', name: 'Cameroun', flag: 'https://flagcdn.com/w160/cm.png' },
  { code: 'NG', name: 'Nigeria', flag: 'https://flagcdn.com/w160/ng.png' },
  { code: 'KE', name: 'Kenya', flag: 'https://flagcdn.com/w160/ke.png' },
  { code: 'ZA', name: 'Afrique du Sud', flag: 'https://flagcdn.com/w160/za.png' },
  { code: 'FR', name: 'France', flag: 'https://flagcdn.com/w160/fr.png' },
];

const categories: BusinessCategory[] = [
  { name: 'Développement Web', icon: 'laptop-code' },
  { name: 'Développement Mobile', icon: 'mobile-screen-button' },
  { name: 'Design Graphique', icon: 'palette' },
  { name: 'Montage Vidéo', icon: 'clapperboard' },
  { name: 'Marketing Digital', icon: 'bullhorn' },
  { name: 'Rédaction', icon: 'pen-nib' },
  { name: 'Plus', icon: 'ellipsis' },
];

const entrepreneurs: Entrepreneur[] = [
  {
    id: 'jean',
    name: 'Jean Mbuyi',
    country: 'RDC',
    flag: '🇨🇩',
    category: 'Développement Mobile',
    rating: '4,9',
    reviews: 128,
    description: "Spécialiste en développement d'applications Android & iOS avec 5 ans d'expérience.",
    missions: 125,
    tags: ['Android', 'iOS', 'Flutter', 'API', '+2'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 'amina',
    name: 'Amina Diop',
    country: 'Sénégal',
    flag: '🇸🇳',
    category: 'Design Graphique',
    rating: '4,8',
    reviews: 96,
    description: 'Création d’identités visuelles modernes et designs percutants.',
    missions: 98,
    tags: ['Logo', 'Branding', 'Affiche', 'UI/UX', '+1'],
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 'jonathan',
    name: 'Jonathan K.',
    country: 'Cameroun',
    flag: '🇨🇲',
    category: 'Marketing Digital',
    rating: '4,7',
    reviews: 74,
    description: 'Expert en gestion de campagnes publicitaires et croissance des marques.',
    missions: 64,
    tags: ['Facebook Ads', 'Google Ads', 'SEO', 'Analytics', '+1'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 'grace',
    name: 'Grâce Nguema',
    country: 'Gabon',
    flag: '🇬🇦',
    category: 'Rédaction',
    rating: '4,9',
    reviews: 63,
    description: 'Rédaction web SEO, articles de blog et contenus optimisés.',
    missions: 52,
    tags: ['Rédaction SEO', 'Blog', 'Copywriting', 'Contenu Web', '+1'],
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&q=80',
  },
];

export default function BusinessPlusScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showLogo showAvatar searchType="product" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Business<Text style={styles.plus}>+</Text>
          </Text>
          <Text style={styles.heroSubtitle}>Trouvez le bon pro, développez sans limites.</Text>
        </View>

        <BusinessSection title="Choisissez un pays" icon="earth-africa" color={colors.primary}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {countries.map((country, index) => (
              <Pressable key={country.code} style={[styles.countryCard, index === 0 && styles.countryCardActive]}>
                <Image source={{ uri: country.flag }} style={styles.flag} />
                <Text style={styles.countryName} numberOfLines={2}>{country.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </BusinessSection>

        <BusinessSection title="Choisissez une catégorie" icon="grip" color={colors.success}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {categories.map((category, index) => (
              <Pressable key={category.name} style={[styles.categoryCard, index === 0 && styles.categoryCardActive]}>
                <FontAwesome6 name={category.icon} size={28} color="#A7F304" />
                <Text style={styles.categoryName} numberOfLines={2}>{category.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </BusinessSection>

        <View style={styles.entrepreneurHeader}>
          <View style={styles.sectionHeading}>
            <FontAwesome6 name="user-group" size={20} color="#FF7A00" />
            <Text style={styles.sectionTitle}>Entrepreneurs disponibles</Text>
          </View>
          <Pressable style={styles.sortButton}>
            <Text style={styles.sortText}>Trier</Text>
            <Feather name="sliders" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.entrepreneurs}>
          {entrepreneurs.map((entrepreneur) => (
            <EntrepreneurCard key={entrepreneur.id} entrepreneur={entrepreneur} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BusinessSection({ title, icon, color, children }: { title: string; icon: keyof typeof FontAwesome6.glyphMap; color: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeading}>
          <FontAwesome6 name={icon} size={20} color={color} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Pressable style={styles.viewAllButton}>
          <Text style={[styles.viewAllText, { color }]}>Voir tout</Text>
          <Feather name="chevron-right" size={22} color={color} />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function EntrepreneurCard({ entrepreneur }: { entrepreneur: Entrepreneur }) {
  return (
    <View style={styles.proCard}>
      <View style={styles.proMain}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: entrepreneur.avatar }} style={styles.avatar} />
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.proInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.proName} numberOfLines={1}>{entrepreneur.name}</Text>
            <FontAwesome6 name="certificate" size={15} color={colors.primary} />
          </View>
          <Text style={styles.meta} numberOfLines={1}>{entrepreneur.country}  {entrepreneur.flag}  |  {entrepreneur.category}</Text>
          <Text style={styles.rating}>
            <Text style={styles.star}>★</Text> {entrepreneur.rating} ({entrepreneur.reviews} avis)
          </Text>
          <Text style={styles.description} numberOfLines={2}>{entrepreneur.description}</Text>
          <View style={styles.tags}>
            {entrepreneur.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>{tag}</Text>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.proSide}>
        <View style={styles.verified}>
          <FontAwesome6 name="shield-halved" size={15} color={colors.success} />
          <Text style={styles.verifiedText}>Vérifié Business+</Text>
        </View>
        <View style={styles.missions}>
          <FontAwesome6 name="briefcase" size={14} color={colors.muted} />
          <Text style={styles.missionText}>{entrepreneur.missions} missions réalisées</Text>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.squareAction}>
            <Feather name="message-circle" size={20} color={colors.text} />
          </Pressable>
          <Pressable style={styles.squareAction}>
            <Feather name="phone" size={19} color={colors.text} />
          </Pressable>
          <Pressable style={styles.profileButton}>
            <Text style={styles.profileText}>Voir le profil</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 96 },
  hero: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 18 },
  heroTitle: { color: colors.text, fontSize: 42, fontWeight: '900', letterSpacing: 0 },
  plus: { color: colors.primary },
  heroSubtitle: { color: '#D8DEE7', fontSize: 18, marginTop: 4 },
  section: { paddingVertical: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.09)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, marginBottom: 18 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewAllText: { fontSize: 17, fontWeight: '800' },
  horizontalList: { gap: 12, paddingHorizontal: 18 },
  countryCard: {
    width: 108,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    padding: 10,
  },
  countryCardActive: { borderColor: colors.primary },
  flag: { width: 48, height: 34, borderRadius: 6, backgroundColor: colors.panelLight },
  countryName: { color: colors.text, fontSize: 15, lineHeight: 20, textAlign: 'center', fontWeight: '800' },
  categoryCard: {
    width: 120,
    minHeight: 134,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    padding: 10,
  },
  categoryCardActive: { borderColor: colors.success },
  categoryName: { color: colors.text, fontSize: 13, lineHeight: 18, textAlign: 'center', fontWeight: '800' },
  entrepreneurHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 22, marginBottom: 12 },
  sortButton: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sortText: { color: colors.text, fontSize: 17, fontWeight: '800' },
  entrepreneurs: { paddingHorizontal: 18, gap: 12 },
  proCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 14,
  },
  proMain: { flexDirection: 'row', gap: 14 },
  avatarWrap: { width: 92, height: 92 },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.panelLight },
  onlineDot: { position: 'absolute', right: 2, bottom: 8, width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.panel, backgroundColor: colors.success },
  proInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  proName: { flexShrink: 1, color: colors.text, fontSize: 21, fontWeight: '900' },
  meta: { color: colors.text, marginTop: 6, fontWeight: '700' },
  rating: { color: colors.text, marginTop: 8, fontWeight: '800' },
  star: { color: '#FFB000' },
  description: { color: colors.text, lineHeight: 20, marginTop: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  tag: { overflow: 'hidden', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5, color: colors.text, backgroundColor: '#10357D', fontSize: 12, fontWeight: '800' },
  proSide: { gap: 12 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  verifiedText: { color: colors.success, fontWeight: '900' },
  missions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  missionText: { color: colors.text, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  squareAction: { width: 50, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#2B6DB5', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1624' },
  profileButton: { flex: 1, minHeight: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  profileText: { color: colors.text, fontSize: 15, fontWeight: '900' },
});
