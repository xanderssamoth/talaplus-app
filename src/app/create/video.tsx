import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import { ApiCategory, ApiMedia, createMedia, getCategoriesForType, getUserMedia } from '@/lib/api';
import { getCurrentUser } from '@/lib/session';

type PickedAsset = {
  uri: string;
  name: string;
  mimeType: string;
};

const mediaTypes = [
  { label: 'Films & Series', value: 'film_series', icon: 'clapperboard', color: '#2677D7' },
  { label: 'Com\u00e9die', value: 'comedy', icon: 'face-laugh-beam', color: '#F36A25' },
  { label: 'Musique', value: 'music', icon: 'music', color: '#7B2FF7' },
  { label: 'Education', value: 'education', icon: 'graduation-cap', color: '#38A35A' },
  { label: 'Business', value: 'business', icon: 'briefcase', color: '#F6A128' },
  { label: 'M\u00e9tiers & Bricolage', value: 'crafts_diy', icon: 'screwdriver-wrench', color: '#287AC0' },
  { label: 'Sport Simul\u00e9', value: 'sports', icon: 'futbol', color: '#37A33B' },
  { label: 'Documentaires', value: 'documentary', icon: 'file-video', color: '#127B8F' },
] as const;

export default function CreateVideoScreen() {
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
  const [isAuthor, setIsAuthor] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedType = useMemo(() => mediaTypes.find((item) => item.value === type) ?? mediaTypes[0], [type]);
  const nextDisabled = (step === 1 && !video) || submitting;
  const previewPlayer = useVideoPlayer(video?.uri ?? '', (player) => {
    player.loop = true;
    player.muted = true;
  });

  useEffect(() => {
    if (step === 4) {
      setCategoriesLoading(true);
      getCategoriesForType(type).then(({ items }) => setCategories(items)).catch(() => setCategories([])).finally(() => setCategoriesLoading(false));
    }
  }, [step, type]);

  useEffect(() => {
    const user = getCurrentUser();
    if (step === 3 && user.id) {
      getUserMedia(user.id).then(({ items }) => setUserMedia(items)).catch(() => setUserMedia([]));
    }
  }, [step]);

  useEffect(() => {
    if (video) {
      previewPlayer.loop = true;
      previewPlayer.muted = true;
      previewPlayer.play();
    } else {
      previewPlayer.pause();
    }
  }, [previewPlayer, video]);

  const pickVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'video/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
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
      Alert.alert('Vid\u00e9o requise', 'Choisis une vid\u00e9o depuis ton appareil.');
      return;
    }

    if (step === 3 && (!cover || !title.trim() || !description.trim() || (!isAuthor && !authorName.trim()))) {
      Alert.alert('Informations incompl\u00e8tes', 'Ajoute la couverture, le titre, la description et les informations auteur.');
      return;
    }

    setStep((current) => Math.min(current + 1, 5));
  };

  const submit = async () => {
    if (!video || !cover) {
      Alert.alert('Informations incompl\u00e8tes', 'Choisis la vid\u00e9o et la couverture.');
      return;
    }

    const form = new FormData();
    form.append('type', type);
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
    form.append('cover_file', { uri: cover.uri, name: cover.name, type: cover.mimeType } as unknown as Blob);

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
          cover_file: cover,
        },
      });
      const response = await createMedia(form);
      console.log('[create-video] response', response);
      Alert.alert('Vid\u00e9o publi\u00e9e', 'Votre vid\u00e9o a \u00e9t\u00e9 envoy\u00e9e au serveur.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      console.log('[create-video] error', error);
      Alert.alert('Publication impossible', error instanceof Error ? error.message : 'La publication a \u00e9chou\u00e9.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => step === 1 ? router.back() : setStep((current) => current - 1)}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Publier une vid\u00e9o</Text>
          <Text style={styles.stepText}>{step}. {stepTitles[step]}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>S\u00e9lectionner une vid\u00e9o</Text>
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
                      <Text style={styles.videoPreviewBadgeText}>Aper\u00e7u vid\u00e9o</Text>
                    </View>
                    <Text style={styles.changeVideoText}>Toucher pour changer la vid\u00e9o</Text>
                  </View>
                </>
              ) : (
                <>
                  <FontAwesome6 name="clapperboard" size={42} color={colors.primary} />
                  <Text style={styles.pickerTitle}>Choisir une vid\u00e9o</Text>
                  <Text style={styles.pickerHint}>Depuis votre appareil</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>Choisir une chaine</Text>
            <View style={styles.typeGrid}>
              {mediaTypes.map((item) => {
                const active = item.value === type;
                return (
                  <Pressable key={item.value} style={[styles.typeCard, { backgroundColor: item.color }, active && styles.typeCardActive]} onPress={() => setType(item.value)}>
                    <FontAwesome6 name={item.icon as keyof typeof FontAwesome6.glyphMap} size={28} color={colors.text} />
                    <Text style={styles.typeLabel}>{item.label}</Text>
                    {active && <Feather name="check-circle" size={18} color={colors.text} style={styles.typeCheck} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>Informations de la vid\u00e9o</Text>
            <Pressable style={styles.coverPicker} onPress={pickCover}>
              {cover ? <Image source={{ uri: cover.uri }} style={styles.coverImage} /> : <FontAwesome6 name="image" size={34} color={colors.primary} />}
              <Text style={styles.coverText}>{cover ? 'Changer la couverture' : 'Choisir une photo PNG ou JPG'}</Text>
            </Pressable>
            <TextInput value={title} onChangeText={setTitle} placeholder="Titre de la vid\u00e9o" placeholderTextColor={colors.muted} style={styles.input} />
            <TextInput value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor={colors.muted} style={[styles.input, styles.textarea]} multiline />
            <TextInput value={durationText} onChangeText={updateDuration} placeholder="Longueur de la vid\u00e9o (HH:MM:SS)" placeholderTextColor={colors.muted} keyboardType="number-pad" style={styles.input} />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Vid\u00e9o premium</Text>
              <Switch value={premium} onValueChange={setPremium} thumbColor={colors.text} trackColor={{ false: colors.border, true: colors.primary }} />
            </View>
            {premium && <TextInput value={price} onChangeText={setPrice} placeholder="Prix" placeholderTextColor={colors.muted} keyboardType="numeric" style={styles.input} />}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Pour enfant</Text>
              <Switch value={forYouth} onValueChange={setForYouth} thumbColor={colors.text} trackColor={{ false: colors.border, true: colors.primary }} />
            </View>
            <Text style={styles.dropdownLabel}>Appartient a</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.parentList}>
              <Pressable style={[styles.parentChip, !belongsTo && styles.parentChipActive]} onPress={() => setBelongsTo('')}>
                <Text style={styles.parentChipText}>Aucun</Text>
              </Pressable>
              {userMedia.map((item) => (
                <Pressable key={item.id} style={[styles.parentChip, belongsTo === item.id && styles.parentChipActive]} onPress={() => setBelongsTo(item.id)}>
                  <Text style={styles.parentChipText} numberOfLines={1}>{item.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Je suis l auteur</Text>
              <Switch value={isAuthor} onValueChange={setIsAuthor} thumbColor={colors.text} trackColor={{ false: colors.border, true: colors.primary }} />
            </View>
            {!isAuthor && <TextInput value={authorName} onChangeText={setAuthorName} placeholder="Nom complet de l'auteur" placeholderTextColor={colors.muted} style={styles.input} />}
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>Cat\u00e9gories</Text>
            <Text style={styles.helper}>Selectionnez une ou plusieurs categories</Text>
            {categoriesLoading ? <LoadingState compact /> : categories.map((category) => {
              const active = selectedCategories.includes(category.id);
              return (
                <Pressable key={category.id} style={styles.categoryRow} onPress={() => toggleCategory(category.id)}>
                  <FontAwesome6 name={category.icon as keyof typeof FontAwesome6.glyphMap} size={18} color={category.color} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Feather name={active ? 'check-square' : 'square'} size={21} color={active ? colors.primary : colors.muted} />
                </Pressable>
              );
            })}
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>Aper\u00e7u de votre vid\u00e9o</Text>
            <View style={styles.previewCard}>
              {cover && <Image source={{ uri: cover.uri }} style={styles.previewImage} />}
              <View style={styles.playOverlay}>
                <FontAwesome name="play" size={30} color={colors.text} />
              </View>
            </View>
            <PreviewLine label="Chaine" value={selectedType.label} />
            <PreviewLine label="Titre" value={title} />
            <PreviewLine label="Description" value={description} />
            <View style={styles.chips}>
              {selectedCategories.map((id) => {
                const category = categories.find((item) => item.id === id);
                return category ? <Text key={id} style={styles.chip}>{category.name}</Text> : null;
              })}
            </View>
          </View>
        )}

        <Pressable style={[styles.button, nextDisabled && styles.buttonDisabled]} onPress={step === 5 ? submit : goNext} disabled={nextDisabled}>
          <Text style={[styles.buttonText, nextDisabled && styles.buttonTextDisabled]}>{step === 5 ? 'Publier la vid\u00e9o' : `Suivant${step === 1 && video ? ' (1)' : ''}`}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const stepTitles: Record<number, string> = {
  1: 'Choisir une vid\u00e9o',
  2: 'Choisir une chaine',
  3: 'Informations de la vid\u00e9o',
  4: 'Choisir les categories',
  5: 'Aper\u00e7u et publication',
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
});
