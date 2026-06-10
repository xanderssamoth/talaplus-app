import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';

const languages = [
  { code: 'fr', labelKey: 'french', nativeName: 'Francais' },
  { code: 'en', labelKey: 'english', nativeName: 'English' },
  { code: 'ln', labelKey: 'lingala', nativeName: 'Lingala' },
];

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();

  const selectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{t('chooseLanguage')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {languages.map((language) => {
          const isActive = i18n.language === language.code;

          return (
            <Pressable key={language.code} style={[styles.item, isActive && styles.activeItem]} onPress={() => selectLanguage(language.code)}>
              <View>
                <Text style={styles.itemTitle}>{t(language.labelKey)}</Text>
                <Text style={styles.itemSubtitle}>{language.nativeName}</Text>
              </View>
              {isActive && <Feather name="check" size={22} color={colors.primary} />}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  content: { padding: 16 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, padding: 16, marginBottom: 10, backgroundColor: colors.panel },
  activeItem: { borderWidth: 1, borderColor: colors.primary },
  itemTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  itemSubtitle: { color: colors.muted, marginTop: 4 },
});
