import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';

const plans = [
  { nameKey: 'free', price: '0 $', featureKeys: ['accessLimited', 'ads', 'standardQuality'] },
  { nameKey: 'premium', price: '5 $', featured: true, featureKeys: ['fullAccess', 'noAds', 'highQuality', 'download'] },
  { nameKey: 'premiumPlus', price: '10 $', featureKeys: ['allPremium', 'multiScreens', 'exclusiveContent'] },
];

export default function SubscriptionScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title}>{t('subscriptions')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.toggle}>
          <Text style={styles.toggleActive}>{t('monthly')}</Text>
          <Text style={styles.toggleText}>{t('yearly')}</Text>
          <Text style={styles.discount}>-20%</Text>
        </View>

        <View style={styles.plans}>
          {plans.map((plan) => (
            <View key={plan.nameKey} style={[styles.plan, plan.featured && styles.planFeatured]}>
              <Text style={styles.planName}>{t(plan.nameKey)}</Text>
              <Text style={styles.price}>{plan.price}<Text style={styles.month}>{t('perMonth')}</Text></Text>
              <View style={styles.features}>
                {plan.featureKeys.map((featureKey) => <Text key={featureKey} style={styles.feature}>✓ {t(featureKey)}</Text>)}
              </View>
              <Pressable style={[styles.choose, plan.featured && styles.chooseFeatured]}>
                <Text style={styles.chooseText}>{plan.featured ? t('choosePremium') : t('choose')}</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.secure}>
          <Feather name="lock" size={17} color={colors.muted} />
          <Text style={styles.secureText}>{t('securePayment')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  content: { padding: 16, paddingBottom: 30 },
  toggle: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, padding: 4, backgroundColor: colors.panel, marginBottom: 24 },
  toggleActive: { flex: 1, color: colors.text, textAlign: 'center', fontWeight: '900', paddingVertical: 11, borderRadius: 8, backgroundColor: colors.primary },
  toggleText: { flex: 1, color: colors.text, textAlign: 'center', fontWeight: '800' },
  discount: { color: colors.text, fontSize: 10, fontWeight: '900', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, marginRight: 8, backgroundColor: colors.danger, overflow: 'hidden' },
  plans: { flexDirection: 'row', gap: 8 },
  plan: { flex: 1, minHeight: 294, borderRadius: 8, padding: 12, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  planFeatured: { borderColor: colors.primary, backgroundColor: '#17152D' },
  planName: { color: colors.text, fontSize: 18, fontWeight: '900' },
  price: { color: colors.text, fontSize: 27, fontWeight: '900', marginTop: 16 },
  month: { color: colors.text, fontSize: 12 },
  features: { gap: 9, marginTop: 20, flex: 1 },
  feature: { color: colors.text, fontSize: 10, lineHeight: 14 },
  choose: { alignItems: 'center', borderRadius: 8, paddingVertical: 11, backgroundColor: colors.panelLight },
  chooseFeatured: { backgroundColor: colors.primary },
  chooseText: { color: colors.text, fontSize: 11, fontWeight: '900' },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 30 },
  secureText: { color: colors.muted, fontWeight: '700' },
});
