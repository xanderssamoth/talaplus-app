import type React from 'react';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { buildPostForm, createPost } from '@/lib/api';
import { getCurrentUser } from '@/lib/session';

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

type Visibility = 'public' | 'followers' | 'private';

const emojiApiKey = '9a1e14f2e06ccf39ed1fef646e3f1c3ff1ee4357';
const visibilityKeys: { value: Visibility; labelKey: string }[] = [
  { value: 'public', labelKey: 'everyone' },
  { value: 'followers', labelKey: 'followersOnly' },
  { value: 'private', labelKey: 'onlyMe' },
];

export default function CreatePostScreen() {
  const { t } = useTranslation();
  const user = getCurrentUser();
  const [step, setStep] = useState(1);
  const [body, setBody] = useState('');
  const [images, setImages] = useState<PickedFile[]>([]);
  const [videoLink, setVideoLink] = useState('');
  const [videoFile, setVideoFile] = useState<PickedFile | null>(null);
  const [allowComments, setAllowComments] = useState(true);
  const [allowShares, setAllowShares] = useState(true);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [schedulePost, setSchedulePost] = useState(false);
  const [publishAt, setPublishAt] = useState('');
  const [emojiVisible, setEmojiVisible] = useState(false);
  const [emojis, setEmojis] = useState<string[]>([]);
  const [visibilityVisible, setVisibilityVisible] = useState(false);
  const [dateVisible, setDateVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickImages = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/png', 'image/jpeg', 'image/jpg'],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      setImages((items) => [...items, ...result.assets.map(toPickedFile).filter(Boolean) as PickedFile[]]);
    }
  };

  const pickVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      setVideoFile(toPickedFile(result.assets[0]));
    }
  };

  const openEmojiPicker = async () => {
    setEmojiVisible(true);
    if (emojis.length) return;

    try {
      const response = await fetch(`https://emoji-api.com/emojis?access_key=${emojiApiKey}`);
      const data = await response.json();
      const list = Array.isArray(data) ? data.slice(0, 72).map((item) => item.character).filter(Boolean) : [];
      setEmojis(list);
    } catch {
      setEmojis(['😀', '😂', '😍', '🔥', '🙏', '🎉', '💪', '❤️', '👍', '✨', '😎', '🥳']);
    }
  };

  const goNext = () => {
    if (step === 1 && !body.trim()) {
      Alert.alert(t('missingFormTitle'), t('missingSignupFields'));
      return;
    }

    setStep((current) => Math.min(current + 1, 5));
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      const form = buildPostForm({
        comment_content: body,
        type: 'post',
        user_id: user.id,
        allow_comment: allowComments,
        allow_share: allowShares,
        visibility,
        publish_at: schedulePost ? publishAt : undefined,
        video_url: videoLink.trim() || undefined,
      }, [...images.map(toFormFile), ...(videoFile ? [toFormFile(videoFile)] : [])]);

      await createPost(form);
      setStep(5);
    } catch (error) {
      Alert.alert(t('newPost'), error instanceof Error ? error.message : t('loginFallbackError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => step === 1 ? router.back() : setStep((current) => current - 1)}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t('newPost')}</Text>
            <Text style={styles.stepText}>{step}. {t(postStepKeys[step])}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 1 && (
            <View style={styles.stepPanel}>
              <TextInput value={body} onChangeText={setBody} placeholder={t('whatsNew')} placeholderTextColor={colors.muted} style={[styles.input, styles.postInput]} multiline maxLength={500} />
              <View style={styles.toolRow}>
                <ToolButton icon="image" label={t('addImages')} onPress={pickImages} />
                <ToolButton icon="face-smile" label={t('emoji')} onPress={openEmojiPicker} />
                <ToolButton icon="film" label={t('gif')} onPress={() => Alert.alert(t('comingSoonTitle'), t('gifPickerComingSoon'))} />
              </View>
              {!!images.length && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailRow}>
                  {images.map((image, index) => (
                    <View key={`${image.uri}-${index}`} style={styles.thumbnailWrap}>
                      <Image source={{ uri: image.uri }} style={styles.thumbnail} />
                      <Pressable style={styles.removeMedia} onPress={() => setImages((items) => items.filter((_, itemIndex) => itemIndex !== index))}>
                        <Feather name="x" size={13} color={colors.text} />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              )}
              <Text style={styles.counter}>{body.length}/500</Text>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepPanel}>
              <Text style={styles.panelTitle}>{t('addMediaOptionalStep')}</Text>
              <TextInput value={videoLink} onChangeText={setVideoLink} placeholder={t('videoLink')} placeholderTextColor={colors.muted} style={styles.input} autoCapitalize="none" />
              <Pressable style={styles.mediaPicker} onPress={pickVideo}>
                <FontAwesome6 name={videoFile ? 'circle-play' : 'clapperboard'} size={34} color={colors.primary} />
                <Text style={styles.pickerTitle}>{videoFile ? videoFile.name : t('chooseVideo')}</Text>
                <Text style={styles.pickerHint}>{t('fromYourDevice')}</Text>
              </Pressable>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepPanel}>
              <SettingSwitch label={t('allowComments')} value={allowComments} onValueChange={setAllowComments} />
              <SettingSwitch label={t('allowShares')} value={allowShares} onValueChange={setAllowShares} />
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t('whoCanSeePost')}</Text>
                <Pressable onPress={() => setVisibilityVisible(true)}>
                  <Text style={styles.settingLink}>{t(visibilityKeys.find((item) => item.value === visibility)?.labelKey ?? 'everyone')}</Text>
                </Pressable>
              </View>
              <SettingSwitch label={t('schedulePost')} value={schedulePost} onValueChange={(value) => { setSchedulePost(value); if (value) setDateVisible(true); }} />
              {schedulePost && !!publishAt && <Text style={styles.scheduleText}>{publishAt}</Text>}
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepPanel}>
              <Text style={styles.panelTitle}>{t('postPreviewStep')}</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{(user.firstname || user.username || 'T').charAt(0)}</Text></View>
                  <View>
                    <Text style={styles.previewName}>{[user.firstname, user.lastname].filter(Boolean).join(' ') || user.username || 'TALA+'}</Text>
                    <Text style={styles.previewMeta}>@{user.username || 'talaplus'}</Text>
                  </View>
                </View>
                <Text style={styles.previewBody}>{body}</Text>
                {!!images.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewMediaRow}>{images.map((image, index) => <Image key={`${image.uri}-${index}`} source={{ uri: image.uri }} style={styles.previewMedia} />)}</ScrollView>}
                {!!videoFile && <Text style={styles.previewLink}>{videoFile.name}</Text>}
                {!!videoLink && <Text style={styles.previewLink}>{videoLink}</Text>}
              </View>
            </View>
          )}

          {step === 5 && (
            <View style={[styles.stepPanel, styles.successPanel]}>
              <View style={styles.successCircle}><Feather name="check" size={42} color={colors.text} /></View>
              <Text style={styles.successTitle}>{t('postPublishedTitle')}</Text>
              <Text style={styles.successText}>{t('postPublishedBody')}</Text>
              <Pressable style={styles.button} onPress={() => router.replace('/posts')}>
                <Text style={styles.buttonText}>{t('viewPost')}</Text>
              </Pressable>
            </View>
          )}

          {step < 5 && (
            <Pressable style={[styles.button, submitting && styles.disabled]} onPress={step === 4 ? submit : goNext} disabled={submitting}>
              <Text style={styles.buttonText}>{step === 4 ? t('publishPost') : t('next')}</Text>
            </Pressable>
          )}
        </ScrollView>

        <OptionModal visible={visibilityVisible} title={t('whoCanSeePost')} onClose={() => setVisibilityVisible(false)}>
          {visibilityKeys.map((item) => (
            <Pressable key={item.value} style={styles.modalRow} onPress={() => { setVisibility(item.value); setVisibilityVisible(false); }}>
              <Text style={styles.modalRowText}>{t(item.labelKey)}</Text>
              <Feather name={visibility === item.value ? 'check-circle' : 'circle'} size={20} color={visibility === item.value ? colors.primary : colors.muted} />
            </Pressable>
          ))}
        </OptionModal>

        <OptionModal visible={emojiVisible} title={t('emoji')} onClose={() => setEmojiVisible(false)}>
          <View style={styles.emojiGrid}>
            {emojis.map((emoji, index) => (
              <Pressable key={`${emoji}-${index}`} style={styles.emojiButton} onPress={() => setBody((text) => `${text}${emoji}`)}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </OptionModal>

        <OptionModal visible={dateVisible} title={t('publishAt')} onClose={() => setDateVisible(false)}>
          <TextInput value={publishAt} onChangeText={setPublishAt} placeholder="2026-07-18 18:30" placeholderTextColor={colors.muted} style={styles.input} />
          <Pressable style={styles.button} onPress={() => setDateVisible(false)}>
            <Text style={styles.buttonText}>{t('ok')}</Text>
          </Pressable>
        </OptionModal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const postStepKeys: Record<number, string> = {
  1: 'createPostStep',
  2: 'addMediaOptionalStep',
  3: 'postSettingsStep',
  4: 'postPreviewStep',
  5: 'postPublishedStep',
};

function toPickedFile(asset?: DocumentPicker.DocumentPickerAsset): PickedFile | null {
  if (!asset?.uri || !asset.mimeType) return null;
  return { uri: asset.uri, name: asset.name ?? `file-${Date.now()}`, mimeType: asset.mimeType, size: asset.size };
}

function toFormFile(file: PickedFile) {
  return { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob;
}

function ToolButton({ icon, label, onPress }: { icon: keyof typeof FontAwesome6.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.toolButton} onPress={onPress}>
      <FontAwesome6 name={icon} size={17} color={colors.text} />
      <Text style={styles.toolText}>{label}</Text>
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

function OptionModal({ visible, title, children, onClose }: { visible: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose}><Feather name="x" size={22} color={colors.text} /></Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
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
  input: { color: colors.text, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  postInput: { minHeight: 150, textAlignVertical: 'top' },
  counter: { color: colors.muted, textAlign: 'right', marginTop: 8, fontSize: 12 },
  toolRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  toolButton: { flex: 1, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 8, backgroundColor: colors.panelLight },
  toolText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  thumbnailRow: { gap: 8, marginTop: 12 },
  thumbnailWrap: { width: 70, height: 70, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.panelLight },
  thumbnail: { width: '100%', height: '100%' },
  removeMedia: { position: 'absolute', right: 5, top: 5, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.62)' },
  mediaPicker: { minHeight: 170, alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, marginTop: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  pickerTitle: { color: colors.text, fontWeight: '900', textAlign: 'center', paddingHorizontal: 12 },
  pickerHint: { color: colors.muted, fontSize: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  settingLabel: { flex: 1, color: colors.text, fontWeight: '800' },
  settingLink: { color: colors.primary, fontWeight: '900' },
  scheduleText: { color: colors.muted, marginTop: 10, fontWeight: '800' },
  previewCard: { borderRadius: 8, padding: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  avatarText: { color: colors.text, fontWeight: '900' },
  previewName: { color: colors.text, fontWeight: '900' },
  previewMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  previewBody: { color: colors.text, lineHeight: 21, marginTop: 12 },
  previewMediaRow: { gap: 8, marginTop: 12 },
  previewMedia: { width: 86, height: 86, borderRadius: 8, backgroundColor: colors.panelLight },
  previewLink: { color: colors.primary, marginTop: 10, fontWeight: '800' },
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
  modalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalRowText: { color: colors.text, fontWeight: '800' },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.panelLight },
  emojiText: { fontSize: 24 },
});
