import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import { ApiCategory, createProduct, getCategoriesForType } from '@/lib/api';

export default function CreateProductScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [imageInput, setImageInput] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [reductionRate, setReductionRate] = useState('');
  const [promotionEndDate, setPromotionEndDate] = useState('');
  const [type, setType] = useState<'product' | 'service'>('product');
  const [mode, setMode] = useState<'sale' | 'rental'>('sale');
  const [promotionEnabled, setPromotionEnabled] = useState(false);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryLastPage, setCategoryLastPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (step === 3) {
      loadCategories(1, true);
    }
  }, [step, type]);

  const loadCategories = (nextPage: number, reset = false) => {
    if (categoriesLoading || (!reset && nextPage > categoryLastPage)) return;

    setCategoriesLoading(true);
    getCategoriesForType(type, nextPage)
      .then((result) => {
        setCategories((current) => reset ? result.items : [...current, ...result.items]);
        setCategoryPage(nextPage);
        setCategoryLastPage(result.lastPage);
      })
      .catch(() => {
        if (reset) setCategories([]);
      })
      .finally(() => setCategoriesLoading(false));
  };

  const addImageUrl = () => {
    const next = imageInput.trim();
    if (!next) return;
    setImageUrls((items) => [...items, next]);
    setImageInput('');
  };

  const toggle = (id: string) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  const goNext = () => {
    if (step === 1) {
      addImageUrl();
    }

    if (step === 2 && (!name.trim() || !price.trim())) {
      Alert.alert(t('missingFormTitle'), t('missingSignupFields'));
      return;
    }

    setStep((current) => Math.min(current + 1, 5));
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      await createProduct({
        name,
        description,
        image_url: imageUrls[0] ?? '',
        price: Number(price),
        currency,
        quantity: quantity ? Number(quantity) : undefined,
        reduction_rate: promotionEnabled && reductionRate ? Number(reductionRate) : undefined,
        promotion_end_date: promotionEnabled ? promotionEndDate : undefined,
        type,
        mode,
        category_ids: selected,
      });
      setStep(5);
    } catch (error) {
      Alert.alert(t('newProduct'), error instanceof Error ? error.message : t('loginFallbackError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => step === 1 ? router.back() : setStep((current) => current - 1)}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('newProduct')}</Text>
          <Text style={styles.stepText}>{step}. {t(productStepKeys[step])}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>{t('selectMedia')}</Text>
            <TextInput value={imageInput} onChangeText={setImageInput} placeholder={t('imageUrl')} placeholderTextColor={colors.muted} style={styles.input} autoCapitalize="none" />
            <Pressable style={styles.secondaryButton} onPress={addImageUrl}>
              <Feather name="plus" size={18} color={colors.text} />
              <Text style={styles.secondaryButtonText}>{t('addMedia')}</Text>
            </Pressable>
            <View style={styles.mediaGrid}>
              {imageUrls.map((url, index) => (
                <View key={`${url}-${index}`} style={styles.mediaTile}>
                  <Image source={{ uri: url }} style={styles.mediaImage} />
                  <Pressable style={styles.removeMedia} onPress={() => setImageUrls((items) => items.filter((_, itemIndex) => itemIndex !== index))}>
                    <Feather name="x" size={14} color={colors.text} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>{t('productServiceInfo')}</Text>
            <View style={styles.segmented}>
              <ChoiceChip label={t('productType')} active={type === 'product'} onPress={() => setType('product')} />
              <ChoiceChip label={t('service')} active={type === 'service'} onPress={() => setType('service')} />
            </View>
            <TextInput value={name} onChangeText={setName} placeholder={t('productName')} placeholderTextColor={colors.muted} style={styles.input} />
            <TextInput value={description} onChangeText={setDescription} placeholder={t('description')} placeholderTextColor={colors.muted} style={[styles.input, styles.textarea]} multiline />
            <TextInput value={quantity} onChangeText={setQuantity} placeholder={t('quantityStock')} placeholderTextColor={colors.muted} keyboardType="numeric" style={styles.input} />
            <View style={styles.row}>
              <TextInput value={price} onChangeText={setPrice} placeholder={t('unitPrice')} placeholderTextColor={colors.muted} keyboardType="numeric" style={[styles.input, styles.flex]} />
              <TextInput value={currency} onChangeText={setCurrency} placeholder={t('currency')} placeholderTextColor={colors.muted} style={[styles.input, styles.currency]} autoCapitalize="characters" />
            </View>
            <View style={styles.segmented}>
              <ChoiceChip label={t('sale')} active={mode === 'sale'} onPress={() => setMode('sale')} />
              <ChoiceChip label={t('rental')} active={mode === 'rental'} onPress={() => setMode('rental')} />
            </View>
            <SettingSwitch label={t('makePromotion')} value={promotionEnabled} onValueChange={setPromotionEnabled} />
            {promotionEnabled && (
              <View style={styles.row}>
                <TextInput value={reductionRate} onChangeText={setReductionRate} placeholder={t('reductionRate')} placeholderTextColor={colors.muted} keyboardType="numeric" style={[styles.input, styles.flex]} />
                <TextInput value={promotionEndDate} onChangeText={setPromotionEndDate} placeholder={t('promotionEndDate')} placeholderTextColor={colors.muted} style={[styles.input, styles.flex]} />
              </View>
            )}
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>{t('categories')}</Text>
            <Text style={styles.helper}>{t('selectOneOrMoreCategories')}</Text>
            {categoriesLoading && !categories.length ? <LoadingState compact /> : categories.slice(0, 6).map((category) => (
              <CategoryRow key={category.id} category={category} active={selected.includes(category.id)} onPress={() => toggle(category.id)} />
            ))}
            <Pressable style={styles.inlineMoreButton} onPress={() => setCategoryModalVisible(true)}>
              <Text style={styles.inlineMoreText}>{t('viewAll')}</Text>
            </Pressable>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>{t('previewProduct')}</Text>
            <View style={styles.productPreview}>
              {imageUrls[0] ? <Image source={{ uri: imageUrls[0] }} style={styles.previewImage} /> : <View style={styles.previewImage} />}
              <PreviewLine label={t('type')} value={type === 'service' ? t('service') : t('productType')} />
              <PreviewLine label={t('productName')} value={name} />
              <PreviewLine label={t('unitPrice')} value={`${price} ${currency}`} />
              {!!quantity && <PreviewLine label={t('quantityStock')} value={quantity} />}
              <PreviewLine label={t('sale')} value={mode === 'sale' ? t('sale') : t('rental')} />
              {promotionEnabled && <PreviewLine label={t('promotion')} value={`-${reductionRate}% ${promotionEndDate}`} />}
              <View style={styles.chips}>
                {selected.map((id) => {
                  const category = categories.find((item) => item.id === id);
                  return category ? <Text key={id} style={styles.chip}>{category.name}</Text> : null;
                })}
              </View>
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={[styles.stepPanel, styles.successPanel]}>
            <View style={styles.successCircle}><Feather name="check" size={42} color={colors.text} /></View>
            <Text style={styles.successTitle}>{t('productPublishedTitle')}</Text>
            <Text style={styles.successText}>{t('productPublishedBody')}</Text>
            <Pressable style={styles.button} onPress={() => router.replace('/marketplace')}>
              <Text style={styles.buttonText}>{t('viewProduct')}</Text>
            </Pressable>
          </View>
        )}

        {step < 5 && (
          <Pressable style={[styles.button, submitting && styles.disabled]} onPress={step === 4 ? submit : goNext} disabled={submitting}>
            <Text style={styles.buttonText}>{step === 4 ? t('publishProduct') : imageUrls.length && step === 1 ? `${t('next')} (${imageUrls.length})` : t('next')}</Text>
          </Pressable>
        )}
      </ScrollView>

      <Modal transparent visible={categoryModalVisible} animationType="slide" onRequestClose={() => setCategoryModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('seeAllCategories')}</Text>
              <Pressable onPress={() => setCategoryModalVisible(false)}><Feather name="x" size={22} color={colors.text} /></Pressable>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              onEndReached={() => loadCategories(categoryPage + 1)}
              onEndReachedThreshold={0.4}
              ListFooterComponent={categoriesLoading ? <LoadingState compact /> : null}
              renderItem={({ item }) => <CategoryRow category={item} active={selected.includes(item.id)} onPress={() => toggle(item.id)} />}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const productStepKeys: Record<number, string> = {
  1: 'productImagesStep',
  2: 'productInfoStep',
  3: 'productCategoriesStep',
  4: 'productPreviewStep',
  5: 'productPublishedStep',
};

function ChoiceChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.choiceChip, active && styles.choiceChipActive]} onPress={onPress}>
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SettingSwitch({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} thumbColor={colors.text} trackColor={{ false: colors.border, true: colors.primary }} />
    </View>
  );
}

function CategoryRow({ category, active, onPress }: { category: ApiCategory; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.categoryRow} onPress={onPress}>
      <FontAwesome6 name={category.icon as keyof typeof FontAwesome6.glyphMap} size={18} color={category.color} />
      <Text style={styles.categoryName}>{category.name}</Text>
      <Feather name={active ? 'check-square' : 'square'} size={20} color={active ? colors.primary : colors.muted} />
    </Pressable>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewLine}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={styles.previewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  stepText: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 4 },
  content: { padding: 16, gap: 12, paddingBottom: 34 },
  stepPanel: { borderRadius: 8, padding: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  panelTitle: { color: colors.text, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  helper: { color: colors.muted, fontSize: 12, textAlign: 'center', marginBottom: 12 },
  input: { color: colors.text, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  currency: { width: 96 },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, paddingVertical: 12, marginTop: 10, backgroundColor: colors.panelLight },
  secondaryButtonText: { color: colors.text, fontWeight: '900' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  mediaTile: { width: '30%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.panelLight },
  mediaImage: { width: '100%', height: '100%' },
  removeMedia: { position: 'absolute', right: 5, top: 5, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.62)' },
  segmented: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  choiceChip: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  choiceChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { color: colors.muted, fontWeight: '900' },
  choiceTextActive: { color: colors.text },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginBottom: 6 },
  settingLabel: { color: colors.text, fontWeight: '800' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  categoryName: { flex: 1, color: colors.text, fontWeight: '700' },
  inlineMoreButton: { alignItems: 'center', borderRadius: 8, paddingVertical: 12, marginTop: 10, backgroundColor: colors.panelLight, borderWidth: 1, borderColor: colors.border },
  inlineMoreText: { color: colors.primary, fontWeight: '900' },
  productPreview: { gap: 4 },
  previewImage: { width: '100%', height: 190, borderRadius: 8, backgroundColor: colors.panelLight, marginBottom: 12 },
  previewLine: { flexDirection: 'row', gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  previewLabel: { width: 128, color: colors.muted },
  previewValue: { flex: 1, color: colors.text, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { color: colors.text, backgroundColor: colors.panelLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, overflow: 'hidden' },
  successPanel: { alignItems: 'center', gap: 12, paddingVertical: 34 },
  successCircle: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  successTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  successText: { color: colors.muted, textAlign: 'center' },
  button: { alignItems: 'center', borderRadius: 8, paddingVertical: 15, backgroundColor: colors.primary },
  disabled: { opacity: 0.7 },
  buttonText: { color: colors.text, fontWeight: '900' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  modalSheet: { maxHeight: '78%', borderTopLeftRadius: 8, borderTopRightRadius: 8, padding: 16, backgroundColor: colors.background, borderTopWidth: 1, borderColor: colors.border },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
});
