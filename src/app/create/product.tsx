import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import LoadingState from '@/components/LoadingState';
import PublishingOverlay from '@/components/PublishingOverlay';
import { colors } from '@/constants/theme';
import { ApiCategory, buildProductForm, createProduct, getCategoriesForType } from '@/lib/api';
import { getCurrentUser } from '@/lib/session';

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

const mediaSlots = Array.from({ length: 12 }, (_, index) => index);
const videoMaxBytes = 20 * 1024 * 1024;

export default function CreateProductScreen() {
  const { t } = useTranslation();
  const user = getCurrentUser();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<(PickedFile | null)[]>(Array(12).fill(null));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [reductionRate, setReductionRate] = useState('');
  const [promotionStart, setPromotionStart] = useState('');
  const [promotionEnd, setPromotionEnd] = useState('');
  const [type, setType] = useState<'product' | 'service'>('product');
  const [mode, setMode] = useState<'sale' | 'rental'>('sale');
  const [promotionEnabled, setPromotionEnabled] = useState(false);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryLastPage, setCategoryLastPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [dateVisible, setDateVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const discountAmount = useMemo(() => {
    const numericPrice = Number(price);
    const discount = Number(reductionRate);
    if (!numericPrice || !discount) return 0;
    return numericPrice * (1 - discount / 100);
  }, [price, reductionRate]);

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

  const pickSlot = async (index: number) => {
    const isVideo = index === 11;
    const result = await DocumentPicker.getDocumentAsync({
      type: isVideo ? ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'] : ['image/png', 'image/jpeg', 'image/jpg'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;
    const file = toPickedFile(result.assets[0]);
    if (!file) return;

    if (isVideo && file.size && file.size > videoMaxBytes) {
      Alert.alert(t('fileTooLargeTitle'), t('video20MbLimit'));
      return;
    }

    setFiles((items) => items.map((item, itemIndex) => itemIndex === index ? file : item));
  };

  const togglePromotion = (value: boolean) => {
    setPromotionEnabled(value);
    if (value && !promotionStart) {
      setPromotionStart(new Date().toISOString());
    }
  };

  const goNext = () => {
    if (step === 2 && (!name.trim() || !price.trim())) {
      Alert.alert(t('missingFormTitle'), t('missingSignupFields'));
      return;
    }

    if (step === 3 && !selectedCategory) {
      Alert.alert(t('missingFormTitle'), t('chooseCategory'));
      return;
    }

    setStep((current) => Math.min(current + 1, 5));
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      const form = buildProductForm({
        product_name: name,
        product_description: description,
        type,
        quantity: quantity ? Number(quantity) : undefined,
        price: price ? Number(price) : undefined,
        currency,
        action: mode,
        is_shared: true,
        price_reduction_start: promotionEnabled ? promotionStart || new Date().toISOString() : undefined,
        price_reduction_end: promotionEnabled ? promotionEnd : undefined,
        reduction_rate: promotionEnabled && reductionRate ? Number(reductionRate) : undefined,
        category_id: selectedCategory,
        user_id: user.id,
      }, files.filter(Boolean).map((file) => toFormFile(file as PickedFile)));

      await createProduct(form);
      setStep(5);
    } catch (error) {
      Alert.alert(t('newProduct'), error instanceof Error ? error.message : t('loginFallbackError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PublishingOverlay visible={submitting} />
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
            <View style={styles.slotGrid}>
              {mediaSlots.map((slot) => {
                const file = files[slot];
                const isVideo = slot === 11;
                return (
                  <Pressable key={slot} style={styles.mediaSlot} onPress={() => pickSlot(slot)}>
                    {file && !isVideo ? <Image source={{ uri: file.uri }} style={styles.slotImage} /> : (
                      <View style={styles.slotEmpty}>
                        <Feather name={file ? 'play-circle' : 'plus'} size={24} color={colors.text} />
                        {isVideo && <Text style={styles.slotLabel}>{t('video')}</Text>}
                      </View>
                    )}
                    {!!file && (
                      <Pressable style={styles.removeMedia} onPress={() => setFiles((items) => items.map((item, index) => index === slot ? null : item))}>
                        <Feather name="x" size={13} color={colors.text} />
                      </Pressable>
                    )}
                  </Pressable>
                );
              })}
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
            <SettingSwitch label={t('makePromotion')} value={promotionEnabled} onValueChange={togglePromotion} />
            {promotionEnabled && (
              <View style={styles.row}>
                <TextInput value={reductionRate} onChangeText={setReductionRate} placeholder={t('reductionRate')} placeholderTextColor={colors.muted} keyboardType="numeric" style={[styles.input, styles.flex]} />
                <Pressable style={[styles.dateButton, styles.flex]} onPress={() => setDateVisible(true)}>
                  <Text style={promotionEnd ? styles.dateButtonText : styles.dateButtonMuted}>{promotionEnd || t('promotionEndDate')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>{t('categories')}</Text>
            <Text style={styles.helper}>{t('selectOneCategory')}</Text>
            {categoriesLoading && !categories.length ? <LoadingState compact /> : categories.slice(0, 6).map((category) => (
              <CategoryRow key={category.id} category={category} active={selectedCategory === category.id} onPress={() => setSelectedCategory(category.id)} />
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
              {files[0] ? <Image source={{ uri: files[0]?.uri }} style={styles.previewImage} /> : <View style={styles.previewImage} />}
              <PreviewLine label={t('type')} value={type === 'service' ? t('service') : t('productType')} />
              <PreviewLine label={t('productName')} value={name} />
              <PreviewLine label={t('unitPrice')} value={`${price} ${currency}`} />
              {!!quantity && <PreviewLine label={t('quantityStock')} value={quantity} />}
              <PreviewLine label={t('sale')} value={mode === 'sale' ? t('sale') : t('rental')} />
              {promotionEnabled && (
                <View style={styles.promoBadge}>
                  <Text style={styles.promoText}>-{reductionRate}%</Text>
                  <Text style={styles.promoAmount}>{currency} {discountAmount.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.chips}>
                {categories.find((item) => item.id === selectedCategory) ? <Text style={styles.chip}>{categories.find((item) => item.id === selectedCategory)?.name}</Text> : null}
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
            <Text style={styles.buttonText}>{step === 4 ? t('publishProduct') : t('next')}</Text>
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
              renderItem={({ item }) => <CategoryRow category={item} active={selectedCategory === item.id} onPress={() => { setSelectedCategory(item.id); setCategoryModalVisible(false); }} />}
            />
          </View>
        </View>
      </Modal>

      <Modal transparent visible={dateVisible} animationType="slide" onRequestClose={() => setDateVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('promotionEndDate')}</Text>
              <Pressable onPress={() => setDateVisible(false)}><Feather name="x" size={22} color={colors.text} /></Pressable>
            </View>
            <TextInput value={promotionEnd} onChangeText={setPromotionEnd} placeholder="2026-07-18 18:30" placeholderTextColor={colors.muted} style={styles.input} />
            <Pressable style={styles.button} onPress={() => { if (!promotionStart) setPromotionStart(new Date().toISOString()); setDateVisible(false); }}>
              <Text style={styles.buttonText}>{t('ok')}</Text>
            </Pressable>
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

function toPickedFile(asset?: DocumentPicker.DocumentPickerAsset): PickedFile | null {
  if (!asset?.uri || !asset.mimeType) return null;
  return { uri: asset.uri, name: asset.name ?? `file-${Date.now()}`, mimeType: asset.mimeType, size: asset.size };
}

function toFormFile(file: PickedFile) {
  return { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob;
}

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
      <Feather name={active ? 'check-circle' : 'circle'} size={20} color={active ? colors.primary : colors.muted} />
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
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mediaSlot: { width: '31.7%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  slotImage: { width: '100%', height: '100%' },
  slotEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5 },
  slotLabel: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  removeMedia: { position: 'absolute', right: 5, top: 5, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.62)' },
  segmented: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  choiceChip: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  choiceChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { color: colors.muted, fontWeight: '900' },
  choiceTextActive: { color: colors.text },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginBottom: 6 },
  settingLabel: { color: colors.text, fontWeight: '800' },
  dateButton: { minHeight: 48, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  dateButtonText: { color: colors.text, fontWeight: '800' },
  dateButtonMuted: { color: colors.muted },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  categoryName: { flex: 1, color: colors.text, fontWeight: '700' },
  inlineMoreButton: { alignItems: 'center', borderRadius: 8, paddingVertical: 12, marginTop: 10, backgroundColor: colors.panelLight, borderWidth: 1, borderColor: colors.border },
  inlineMoreText: { color: colors.primary, fontWeight: '900' },
  productPreview: { gap: 4 },
  previewImage: { width: '100%', height: 190, borderRadius: 8, backgroundColor: colors.panelLight, marginBottom: 12 },
  previewLine: { flexDirection: 'row', gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  previewLabel: { width: 128, color: colors.muted },
  previewValue: { flex: 1, color: colors.text, fontWeight: '800' },
  promoBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginTop: 10, backgroundColor: 'rgba(246,161,40,0.18)', borderWidth: 1, borderColor: '#F6A128' },
  promoText: { color: '#F6A128', fontWeight: '900' },
  promoAmount: { color: colors.text, fontWeight: '900' },
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
