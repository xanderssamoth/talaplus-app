import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { createPost } from '@/lib/api';
import { getCurrentUser } from '@/lib/session';

export default function CreatePostScreen() {
  const { t } = useTranslation();
  const user = getCurrentUser();
  const [step, setStep] = useState(1);
  const [body, setBody] = useState('');
  const [mediaInput, setMediaInput] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [allowComments, setAllowComments] = useState(true);
  const [allowShares, setAllowShares] = useState(true);
  const [schedulePost, setSchedulePost] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const addMediaUrl = () => {
    const next = mediaInput.trim();
    if (!next) return;
    setMediaUrls((items) => [...items, next]);
    setMediaInput('');
  };

  const goNext = () => {
    if (step === 1 && !body.trim()) {
      Alert.alert(t('missingFormTitle'), t('missingSignupFields'));
      return;
    }

    if (step === 2) {
      addMediaUrl();
    }

    setStep((current) => Math.min(current + 1, 5));
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      await createPost({
        body,
        comment: body,
        description: body,
        image_url: mediaUrls[0] ?? '',
        allow_comments: allowComments,
        allow_shares: allowShares,
        scheduled: schedulePost,
      });
      setStep(5);
    } catch (error) {
      Alert.alert(t('newPost'), error instanceof Error ? error.message : t('loginFallbackError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => step === 1 ? router.back() : setStep((current) => current - 1)}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('newPost')}</Text>
          <Text style={styles.stepText}>{step}. {t(postStepKeys[step])}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <View style={styles.stepPanel}>
            <TextInput value={body} onChangeText={setBody} placeholder={t('whatsNew')} placeholderTextColor={colors.muted} style={[styles.input, styles.postInput]} multiline maxLength={500} />
            <Text style={styles.counter}>{body.length}/500</Text>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepPanel}>
            <Text style={styles.panelTitle}>{t('addMediaOptionalStep')}</Text>
            <TextInput value={mediaInput} onChangeText={setMediaInput} placeholder={t('imageUrl')} placeholderTextColor={colors.muted} style={styles.input} autoCapitalize="none" />
            <Pressable style={styles.secondaryButton} onPress={addMediaUrl}>
              <Feather name="plus" size={18} color={colors.text} />
              <Text style={styles.secondaryButtonText}>{t('addMedia')}</Text>
            </Pressable>
            <View style={styles.mediaGrid}>
              {mediaUrls.map((url, index) => (
                <View key={`${url}-${index}`} style={styles.mediaTile}>
                  <Image source={{ uri: url }} style={styles.mediaImage} />
                  <Pressable style={styles.removeMedia} onPress={() => setMediaUrls((items) => items.filter((_, itemIndex) => itemIndex !== index))}>
                    <Feather name="x" size={14} color={colors.text} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepPanel}>
            <SettingSwitch label={t('allowComments')} value={allowComments} onValueChange={setAllowComments} />
            <SettingSwitch label={t('allowShares')} value={allowShares} onValueChange={setAllowShares} />
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t('whoCanSeePost')}</Text>
              <Text style={styles.settingValue}>{t('everyone')}</Text>
            </View>
            <SettingSwitch label={t('schedulePost')} value={schedulePost} onValueChange={setSchedulePost} />
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
              {!!mediaUrls.length && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewMediaRow}>
                  {mediaUrls.map((url, index) => <Image key={`${url}-${index}`} source={{ uri: url }} style={styles.previewMedia} />)}
                </ScrollView>
              )}
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
            <Text style={styles.buttonText}>{step === 4 ? t('publishPost') : mediaUrls.length && step === 2 ? `${t('next')} (${mediaUrls.length})` : t('next')}</Text>
          </Pressable>
        )}
      </ScrollView>
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

function SettingSwitch({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} thumbColor={colors.text} trackColor={{ false: colors.border, true: colors.primary }} />
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
  input: { color: colors.text, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  postInput: { minHeight: 180, textAlignVertical: 'top' },
  counter: { color: colors.muted, textAlign: 'right', marginTop: 8, fontSize: 12 },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, paddingVertical: 12, marginTop: 10, backgroundColor: colors.panelLight },
  secondaryButtonText: { color: colors.text, fontWeight: '900' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  mediaTile: { width: '30%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.panelLight },
  mediaImage: { width: '100%', height: '100%' },
  removeMedia: { position: 'absolute', right: 5, top: 5, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.62)' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  settingLabel: { flex: 1, color: colors.text, fontWeight: '800' },
  settingValue: { color: colors.muted, fontWeight: '800' },
  previewCard: { borderRadius: 8, padding: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  avatarText: { color: colors.text, fontWeight: '900' },
  previewName: { color: colors.text, fontWeight: '900' },
  previewMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  previewBody: { color: colors.text, lineHeight: 21, marginTop: 12 },
  previewMediaRow: { gap: 8, marginTop: 12 },
  previewMedia: { width: 86, height: 86, borderRadius: 8, backgroundColor: colors.panelLight },
  successPanel: { alignItems: 'center', gap: 12, paddingVertical: 34 },
  successCircle: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  successTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  successText: { color: colors.muted, textAlign: 'center' },
  button: { alignItems: 'center', borderRadius: 8, paddingVertical: 15, backgroundColor: colors.primary },
  disabled: { opacity: 0.7 },
  buttonText: { color: colors.text, fontWeight: '900' },
});
