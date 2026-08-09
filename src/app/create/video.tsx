import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTranslation } from 'react-i18next';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import MediaCover from '@/components/MediaCover';
import PublishingOverlay from '@/components/PublishingOverlay';
import { ApiCategory, ApiMedia, createMedia, getCategoriesForType, getUserMedia } from '@/lib/api';
import { getCurrentUser } from '@/lib/session';

type PickedAsset = {
  uri: string;
  name: string;
  mimeType: string;
};

type ThumbnailModule = {
  getThumbnailAsync?: (uri: string, options?: { time?: number }) => Promise<{ uri: string }>;
};

const videoThumbnails: ThumbnailModule | null = (() => {
  try {
    return require('expo-video-thumbnails') as ThumbnailModule;
  } catch {
    return null;
  }
})();

const mediaTypes = [
  { labelKey: 'filmsAndSeries', value: 'film_series', icon: 'clapperboard', color: '#2677D7' },
  { labelKey: 'comedy', value: 'comedy', icon: 'face-laugh-beam', color: '#F36A25' },
  { labelKey: 'music', value: 'music', icon: 'music', color: '#7B2FF7' },
  { labelKey: 'education', value: 'education', icon: 'graduation-cap', color: '#38A35A' },
  { labelKey: 'business', value: 'business', icon: 'briefcase', color: '#F6A128' },
  { labelKey: 'crafts', value: 'crafts_diy', icon: 'screwdriver-wrench', color: '#287AC0' },
  { labelKey: 'simulatedSport', value: 'sports', icon: 'futbol', color: '#37A33B' },
  { labelKey: 'documentaries', value: 'documentary', icon: 'file-video', color: '#127B8F' },
] as const;

export default function CreateVideoScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [video, setVideo] = useState<PickedAsset | null>(null);
  const [cover, setCover] = useState<PickedAsset | null>(null);
  const [type, setType] = useState<string>('film_series');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationText, setDurationText] = useState('');
  const [premium, setPremium] = useState(false);
  const [price, setPrice] = useState('');
  const [forYouth, setForYouth] = useState(false);
  const [belongsTo, setBelongsTo] = useState('');
  const [userMedia, setUserMedia] = useState<ApiMedia[]>([]);
  const [userMediaPage, setUserMediaPage] = useState(1);
  const [userMediaLastPage, setUserMediaLastPage] = useState(1);
  const [userMediaLoading, setUserMediaLoading] = useState(false);
  const [parentModalVisible, setParentModalVisible] = useState(false);
  const [isAuthor, setIsAuthor] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryLastPage, setCategoryLastPage] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [generatedCover, setGeneratedCover] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedType = useMemo(() => mediaTypes.find((item) => item.value === type) ?? mediaTypes[0], [type]);
  const nextDisabled = (step === 1 && !video) || submitting;
  const previewPlayer = useVideoPlayer(video?.uri ?? '', (player) => {
    player.loop = true;
    player.muted = true;
  });

  useEffect(() => {
    if (step === 4) {
      loadCategories(1, true);
    }
  }, [step, type]);

  useEffect(() => {
    const user = getCurrentUser();
    if (step === 3 && user.id) {
      loadUserMedia(1, true);
    }
  }, [step, type]);

  useEffect(() => {
    if (video) {
      previewPlayer.loop = true;
      previewPlayer.muted = true;
      previewPlayer.play();
      if (!cover) {
        generateCoverFromVideo(video);
      }
    } else {
      previewPlayer.pause();
    }
  }, [previewPlayer, video]);

  const generateCoverFromVideo = async (asset: PickedAsset) => {
    if (!videoThumbnails?.getThumbnailAsync) {
      return null;
    }

    try {
      setGeneratingCover(true);
      const result = await videoThumbnails.getThumbnailAsync(asset.uri, { time: 3000 });
      const nextCover = {
        uri: result.uri,
        name: `talaplus-cover-${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
      };
      setCover(nextCover);
      setGeneratedCover(true);
      return nextCover;
    } catch {
      return null;
    } finally {
      setGeneratingCover(false);
    }
  };

  const loadUserMedia = (nextPage: number, reset = false) => {
    const user = getCurrentUser();
    if (!user.id || userMediaLoading || (!reset && nextPage > userMediaLastPage)) return;

    setUserMediaLoading(true);
    getUserMedia(user.id, nextPage, type)
      .then((result) => {
        const typedItems = result.items.filter((item) => !item.type || item.type === type);
        setUserMedia((current) => reset ? typedItems : [...current, ...typedItems]);
        setUserMediaPage(nextPage);
        setUserMediaLastPage(result.lastPage);
      })
      .catch(() => {
        if (reset) setUserMedia([]);
      })
      .finally(() => setUserMediaLoading(false));
  };

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

  const pickVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'video/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setCover(null);
      setGeneratedCover(false);
      setVideo({
        uri: asset.uri,
        name: asset.name ?? `talaplus-video-${Date.now()}.mp4`,
        mimeType: asset.mimeType ?? 'video/mp4',
      });
    }
  };

  const pickCover = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/png', 'image/jpeg'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const extension = (asset.name ?? asset.uri).split('.').pop()?.toLowerCase();
      setCover({
        uri: asset.uri,
        name: asset.name ?? `talaplus-cover-${Date.now()}.${extension === 'png' ? 'png' : 'jpg'}`,
        mimeType: asset.mimeType ?? (extension === 'png' ? 'image/png' : 'image/jpeg'),
      });
      setGeneratedCover(false);
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  };

  const updateDuration = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6).padStart(6, '0');
    const hours = digits.slice(0, 2);
    const minutes = digits.slice(2, 4);
    const seconds = digits.slice(4, 6);
    setDurationText(`${hours}:${minutes}:${seconds}`);
  };

  const durationSeconds = useMemo(() => {
    const [hours = '0', minutes = '0', seconds = '0'] = durationText.split(':');
    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  }, [durationText]);

  const goNext = () => {
    if (step === 1 && !video) {
      Alert.alert(t('requiredVideoTitle'), t('requiredVideoBody'));
      return;
    }

    if (step === 3 && (!title.trim() || !description.trim() || (!isAuthor && !authorName.trim()))) {
      Alert.alert(t('incompleteInfoTitle'), t('incompleteVideoInfoBody'));
      return;
    }

    setStep((current) => Math.min(current + 1, 5));
  };

  const submit = async () => {
    if (!video) {
      Alert.alert(t('incompleteInfoTitle'), t('requiredVideoBody'));
      return;
    }

    const coverToUpload = cover ?? await generateCoverFromVideo(video);

    const form = new FormData();
    form.append('type', type);
    form.append('is_audio', '0');
    form.append('media_title', title);
    form.append('title', title);
    form.append('media_description', description);
    form.append('description', description);
    form.append('media_length', String(durationSeconds));
    form.append('is_free', premium ? '0' : '1');
    form.append('price', premium ? price || '0' : '0');
    form.append('for_youth', forYouth ? '1' : '0');
    form.append('user_id', getCurrentUser().id);
    if (belongsTo) {
      form.append('belongs_to', belongsTo);
    }
    form.append('author_names', isAuthor ? '' : authorName);
    form.append('is_author', isAuthor ? '1' : '0');
    selectedCategories.forEach((id) => {
      form.append('category_ids[]', id);
      form.append('categories[]', id);
    });
    form.append('media_file', { uri: video.uri, name: video.name, type: video.mimeType } as unknown as Blob);
    if (coverToUpload) {
      form.append('cover_file', { uri: coverToUpload.uri, name: coverToUpload.name, type: coverToUpload.mimeType } as unknown as Blob);
    }

    try {
      setSubmitting(true);
      console.log('[create-video] request', {
        fields: {
          type,
          media_title: title,
          title,
          media_description: description,
          description,
          author_names: isAuthor ? '' : authorName,
          is_author: isAuthor ? '1' : '0',
          category_ids: selectedCategories,
          categories: selectedCategories,
          media_length: durationSeconds,
          is_free: premium ? '0' : '1',
          price: premium ? price || '0' : '0',
          for_youth: forYouth ? '1' : '0',
          belongs_to: belongsTo,
          user_id: getCurrentUser().id,
        },
        files: {
          media_file: video,
          cover_file: coverToUpload,
        },
      });
      const response = await createMedia(form);
      console.log('[create-video] response', response);
      Alert.alert(t('videoPublished'), t('videoPublishedBody'), [{ text: t('ok'), onPress: () => router.back() }]);
    } catch (error) {
      console.log('[create-video] error', error);
      Alert.alert(t('publicationImpossible'), error instanceof Error ? error.message : t('publicationFallbackError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PublishingOverlay visible={submitting} />
      <View style={styles.header}>
        <Pressable onPress={() => step === 1 ? router.back() : setStep((current) => current - 1)}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('publishVideo')}</Text>
          <Text style={styles.stepText}>{step}. {t(stepTitleKeys[step])}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>{t('selectVideo')}</Text>
            <Pressable style={styles.mediaPicker} onPress={pickVideo}>
              {video ? (
                <>
                  <View pointerEvents="none" style={styles.videoPreviewLayer}>
                    <VideoView
                      player={previewPlayer}
                      style={styles.videoPreview}
                      allowsFullscreen={false}
                      allowsPictureInPicture={false}
                      nativeControls={false}
                      contentFit="cover"
                    />
                  </View>
                  <View style={styles.videoPreviewOverlay}>
                    <View style={styles.videoPreviewBadge}>
                      <FontAwesome name="play" size={14} color={colors.text} />
                      <Text style={styles.videoPreviewBadgeText}>{t('videoPreview')}</Text>
                    </View>
                    <Text style={styles.changeVideoText}>{t('tapToChangeVideo')}</Text>
                  </View>
                </>
              ) : (
                <>
                  <FontAwesome6 name="clapperboard" size={42} color={colors.primary} />
                  <Text style={styles.pickerTitle}>{t('chooseVideo')}</Text>
                  <Text style={styles.pickerHint}>{t('fromYourDevice')}</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>{t('chooseChannel')}</Text>
            <View style={styles.typeGrid}>
              {mediaTypes.map((item) => {
                const active = item.value === type;
                return (
                  <Pressable key={item.value} style={[styles.typeCard, { backgroundColor: item.color }, active && styles.typeCardActive]} onPress={() => setType(item.value)}>
                    <FontAwesome6 name={item.icon as keyof typeof FontAwesome6.glyphMap} size={28} color={colors.text} />
                    <Text style={styles.typeLabel}>{t(item.labelKey)}</Text>
                    {active && <Feather name="check-circle" size={18} color={colors.text} style={styles.typeCheck} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>{t('videoInfo')}</Text>
            <Pressable style={styles.coverPicker} onPress={pickCover}>
              {cover ? <Image source={{ uri: cover.uri }} style={styles.coverImage} /> : <FontAwesome6 name="image" size={34} color={colors.primary} />}
              <Text style={styles.coverText}>{cover ? t('changeCover') : t('chooseCover')}</Text>
            </Pressable>
            <Text style={styles.helper}>{generatingCover ? t('generatingCover') : generatedCover ? t('generatedCover') : t('coverOptionalHint')}</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder={t('videoTitle')} placeholderTextColor={colors.muted} style={styles.input} />
            <TextInput value={description} onChangeText={setDescription} placeholder={t('description')} placeholderTextColor={colors.muted} style={[styles.input, styles.textarea]} multiline />
            <TextInput value={durationText} onChangeText={updateDuration} placeholder={t('videoLength')} placeholderTextColor={colors.muted} keyboardType="number-pad" style={styles.input} />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('premiumVideo')}</Text>
              <Switch value={premium} onValueChange={setPremium} thumbColor={colors.text} trackColor={{ false: colors.border, true: colors.primary }} />
            </View>
            {premium && <TextInput value={price} onChangeText={setPrice} placeholder={t('price')} placeholderTextColor={colors.muted} keyboardType="numeric" style={styles.input} />}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('forKids')}</Text>
              <Switch value={forYouth} onValueChange={setForYouth} thumbColor={colors.text} trackColor={{ false: colors.border, true: colors.primary }} />
            </View>
            <Text style={styles.dropdownLabel}>{t('belongsTo')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.parentList}>
              <Pressable style={[styles.parentChip, !belongsTo && styles.parentChipActive]} onPress={() => setBelongsTo('')}>
                <Text style={styles.parentChipText}>{t('none')}</Text>
              </Pressable>
              {userMedia.slice(0, 5).map((item) => (
                <Pressable key={item.id} style={[styles.parentChip, belongsTo === item.id && styles.parentChipActive]} onPress={() => setBelongsTo(item.id)}>
                  <Text style={styles.parentChipText} numberOfLines={1}>{item.title}</Text>
                </Pressable>
              ))}
              <Pressable style={styles.parentChip} onPress={() => setParentModalVisible(true)}>
                <Text style={styles.parentChipText}>{t('viewAll')}</Text>
              </Pressable>
            </ScrollView>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('iAmAuthor')}</Text>
              <Switch value={isAuthor} onValueChange={setIsAuthor} thumbColor={colors.text} trackColor={{ false: colors.border, true: colors.primary }} />
            </View>
            {!isAuthor && <TextInput value={authorName} onChangeText={setAuthorName} placeholder={t('authorFullName')} placeholderTextColor={colors.muted} style={styles.input} />}
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>{t('categories')}</Text>
            <Text style={styles.helper}>{t('selectOneOrMoreCategories')}</Text>
            {categoriesLoading && !categories.length ? <LoadingState compact /> : categories.slice(0, 6).map((category) => {
              const active = selectedCategories.includes(category.id);
              return (
                <Pressable key={category.id} style={styles.categoryRow} onPress={() => toggleCategory(category.id)}>
                  <FontAwesome6 name={category.icon as keyof typeof FontAwesome6.glyphMap} size={18} color={category.color} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Feather name={active ? 'check-square' : 'square'} size={21} color={active ? colors.primary : colors.muted} />
                </Pressable>
              );
            })}
            <Pressable style={styles.inlineMoreButton} onPress={() => setCategoryModalVisible(true)}>
              <Text style={styles.inlineMoreText}>{t('viewAll')}</Text>
            </Pressable>
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>{t('videoPreviewTitle')}</Text>
            <View style={styles.previewCard}>
              {cover && <Image source={{ uri: cover.uri }} style={styles.previewImage} />}
              <View style={styles.playOverlay}>
                <FontAwesome name="play" size={30} color={colors.text} />
              </View>
            </View>
            <PreviewLine label={t('channels')} value={t(selectedType.labelKey)} />
            <PreviewLine label={t('title')} value={title} />
            <PreviewLine label={t('description')} value={description} />
            <View style={styles.chips}>
              {selectedCategories.map((id) => {
                const category = categories.find((item) => item.id === id);
                return category ? <Text key={id} style={styles.chip}>{category.name}</Text> : null;
              })}
            </View>
          </View>
        )}

        <Pressable style={[styles.button, nextDisabled && styles.buttonDisabled]} onPress={step === 5 ? submit : goNext} disabled={nextDisabled}>
          <Text style={[styles.buttonText, nextDisabled && styles.buttonTextDisabled]}>{step === 5 ? t('publishVideoButton') : step === 1 && video ? t('nextWithVideo') : t('next')}</Text>
        </Pressable>
      </ScrollView>

      <Modal transparent visible={parentModalVisible} animationType="slide" onRequestClose={() => setParentModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('chooseParentVideo')}</Text>
              <Pressable onPress={() => setParentModalVisible(false)}><Feather name="x" size={22} color={colors.text} /></Pressable>
            </View>
            <FlatList
              data={userMedia}
              keyExtractor={(item) => item.id}
              onEndReached={() => loadUserMedia(userMediaPage + 1)}
              onEndReachedThreshold={0.4}
              ListFooterComponent={userMediaLoading ? <LoadingState compact /> : null}
              renderItem={({ item }) => (
                <Pressable style={[styles.modalRow, belongsTo === item.id && styles.modalRowActive]} onPress={() => { setBelongsTo(item.id); setParentModalVisible(false); }}>
                  <MediaCover uri={item.thumbnail} isAudio={item.isAudio} style={styles.modalThumb} />
                  <View style={styles.modalRowBody}>
                    <Text style={styles.modalRowTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.modalRowMeta}>{t(selectedType.labelKey)}</Text>
                  </View>
                  <Feather name={belongsTo === item.id ? 'check-circle' : 'circle'} size={20} color={belongsTo === item.id ? colors.primary : colors.muted} />
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

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
              renderItem={({ item }) => {
                const active = selectedCategories.includes(item.id);
                return (
                  <Pressable style={styles.modalRow} onPress={() => toggleCategory(item.id)}>
                    <FontAwesome6 name={item.icon as keyof typeof FontAwesome6.glyphMap} size={18} color={item.color} />
                    <Text style={styles.modalRowTitle}>{item.name}</Text>
                    <Feather name={active ? 'check-square' : 'square'} size={21} color={active ? colors.primary : colors.muted} />
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const stepTitleKeys: Record<number, string> = {
  1: 'chooseVideo',
  2: 'chooseChannel',
  3: 'videoInfo',
  4: 'chooseCategoriesStep',
  5: 'previewAndPublish',
};

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
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '900', textTransform: 'uppercase' },
  stepText: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 4 },
  content: { padding: 16, paddingBottom: 34 },
  stepPanel: { borderRadius: 8, padding: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  panelTitle: { color: colors.text, fontSize: 17, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  helper: { color: colors.muted, fontSize: 12, textAlign: 'center', marginBottom: 12 },
  mediaPicker: { minHeight: 260, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  videoPreviewLayer: { ...StyleSheet.absoluteFillObject },
  videoPreview: { width: '100%', height: '100%' },
  videoPreviewOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 12, backgroundColor: 'rgba(0,0,0,0.18)' },
  videoPreviewBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.62)' },
  videoPreviewBadgeText: { color: colors.text, fontSize: 12, fontWeight: '900' },
  changeVideoText: { alignSelf: 'center', color: colors.text, fontSize: 12, fontWeight: '900', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.62)' },
  pickerTitle: { color: colors.text, fontWeight: '900', marginTop: 14 },
  pickerHint: { color: colors.muted, marginTop: 5 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: { width: '48%', minHeight: 94, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 10 },
  typeCardActive: { borderWidth: 2, borderColor: colors.text },
  typeCheck: { position: 'absolute', top: 8, right: 8 },
  typeLabel: { color: colors.text, fontWeight: '900', textAlign: 'center', fontSize: 12 },
  coverPicker: { minHeight: 160, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight, borderWidth: 1, borderColor: colors.border, marginBottom: 12, overflow: 'hidden' },
  coverImage: { width: '100%', height: 160 },
  coverText: { color: colors.text, fontWeight: '800', marginTop: 8 },
  input: { color: colors.text, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginBottom: 12 },
  switchLabel: { color: colors.text, fontWeight: '800' },
  dropdownLabel: { color: colors.text, fontWeight: '900', marginBottom: 8 },
  parentList: { gap: 8, paddingBottom: 12 },
  parentChip: { maxWidth: 180, height: 38, justifyContent: 'center', borderRadius: 8, paddingHorizontal: 12, backgroundColor: colors.panelLight, borderWidth: 1, borderColor: colors.border },
  parentChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  parentChipText: { color: colors.text, fontWeight: '800' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  categoryName: { flex: 1, color: colors.text, fontWeight: '700' },
  inlineMoreButton: { alignItems: 'center', borderRadius: 8, paddingVertical: 12, marginTop: 10, backgroundColor: colors.panelLight, borderWidth: 1, borderColor: colors.border },
  inlineMoreText: { color: colors.primary, fontWeight: '900' },
  previewCard: { height: 210, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight, marginBottom: 12 },
  previewImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  playOverlay: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.54)' },
  previewLine: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  previewLabel: { width: 92, color: colors.muted },
  previewValue: { flex: 1, color: colors.text, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { color: colors.text, backgroundColor: colors.panelLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, overflow: 'hidden' },
  button: { alignItems: 'center', borderRadius: 8, paddingVertical: 15, marginTop: 14, backgroundColor: colors.primary },
  buttonDisabled: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  buttonText: { color: colors.text, fontWeight: '900' },
  buttonTextDisabled: { color: colors.muted },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  modalSheet: { maxHeight: '78%', borderTopLeftRadius: 8, borderTopRightRadius: 8, padding: 16, backgroundColor: colors.background, borderTopWidth: 1, borderColor: colors.border },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalRowActive: { backgroundColor: colors.panel },
  modalThumb: { width: 58, height: 42, borderRadius: 8, backgroundColor: colors.panelLight },
  modalRowBody: { flex: 1 },
  modalRowTitle: { flex: 1, color: colors.text, fontWeight: '800' },
  modalRowMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
});
