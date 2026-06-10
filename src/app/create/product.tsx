import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import { ApiCategory, createProduct, getCategoriesForType } from '@/lib/api';

export default function CreateProductScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [reductionRate, setReductionRate] = useState('');
  const [type, setType] = useState('product');
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCategoriesLoading(true);
    getCategoriesForType(type).then(({ items }) => setCategories(items)).catch(() => setCategories([])).finally(() => setCategoriesLoading(false));
  }, [type]);

  const toggle = (id: string) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  const submit = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert(t('missingFormTitle'), t('missingSignupFields'));
      return;
    }

    try {
      setSubmitting(true);
      await createProduct({
        name,
        description,
        image_url: imageUrl,
        price: Number(price),
        currency,
        reduction_rate: reductionRate ? Number(reductionRate) : undefined,
        type,
        category_ids: selected,
      });
      Alert.alert(t('publicationSuccess'), t('publicationSuccessBody'), [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert(t('newProduct'), error instanceof Error ? error.message : t('loginFallbackError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={t('newProduct')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.preview}>
          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.previewImage} /> : <FontAwesome6 name="bag-shopping" size={42} color={colors.primary} />}
        </View>
        <TextInput value={name} onChangeText={setName} placeholder={t('productName')} placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={description} onChangeText={setDescription} placeholder={t('description')} placeholderTextColor={colors.muted} style={[styles.input, styles.textarea]} multiline />
        <TextInput value={imageUrl} onChangeText={setImageUrl} placeholder={t('imageUrl')} placeholderTextColor={colors.muted} style={styles.input} autoCapitalize="none" />
        <View style={styles.row}>
          <TextInput value={price} onChangeText={setPrice} placeholder={t('price')} placeholderTextColor={colors.muted} keyboardType="numeric" style={[styles.input, styles.flex]} />
          <TextInput value={currency} onChangeText={setCurrency} placeholder={t('currency')} placeholderTextColor={colors.muted} style={[styles.input, styles.currency]} autoCapitalize="characters" />
        </View>
        <TextInput value={reductionRate} onChangeText={setReductionRate} placeholder={t('reductionRate')} placeholderTextColor={colors.muted} keyboardType="numeric" style={styles.input} />
        <TextInput value={type} onChangeText={setType} placeholder="Type" placeholderTextColor={colors.muted} style={styles.input} autoCapitalize="none" />
        <CategoryPicker title={t('chooseCategories')} categories={categories} loading={categoriesLoading} selected={selected} onToggle={toggle} />
        <Pressable style={[styles.button, submitting && styles.disabled]} onPress={submit} disabled={submitting}>
          <Text style={styles.buttonText}>{t('publish')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}

function CategoryPicker({ title, categories, loading, selected, onToggle }: { title: string; categories: ApiCategory[]; loading: boolean; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <View style={styles.categoryPanel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {loading ? <LoadingState compact /> : categories.map((category) => {
        const active = selected.includes(category.id);
        return (
          <Pressable key={category.id} style={styles.categoryRow} onPress={() => onToggle(category.id)}>
            <FontAwesome6 name={category.icon as keyof typeof FontAwesome6.glyphMap} size={18} color={category.color} />
            <Text style={styles.categoryName}>{category.name}</Text>
            <Feather name={active ? 'check-square' : 'square'} size={20} color={active ? colors.primary : colors.muted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  content: { padding: 16, gap: 12, paddingBottom: 34 },
  preview: { height: 190, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel },
  previewImage: { width: '100%', height: '100%', borderRadius: 8 },
  input: { color: colors.text, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  currency: { width: 96 },
  categoryPanel: { borderRadius: 8, padding: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  panelTitle: { color: colors.text, fontWeight: '900', marginBottom: 10 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  categoryName: { flex: 1, color: colors.text, fontWeight: '700' },
  button: { alignItems: 'center', borderRadius: 8, paddingVertical: 15, backgroundColor: colors.primary },
  disabled: { opacity: 0.7 },
  buttonText: { color: colors.text, fontWeight: '900' },
});
