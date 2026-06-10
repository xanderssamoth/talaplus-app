import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { createPost } from '@/lib/api';

export default function CreatePostScreen() {
  const { t } = useTranslation();
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!body.trim()) {
      Alert.alert(t('missingFormTitle'), t('missingSignupFields'));
      return;
    }

    try {
      setSubmitting(true);
      await createPost({
        body,
        comment: body,
        description: body,
        image_url: imageUrl,
      });
      Alert.alert(t('publicationSuccess'), t('publicationSuccessBody'), [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert(t('newPost'), error instanceof Error ? error.message : t('loginFallbackError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
        <Text style={styles.headerTitle}>{t('newPost')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput value={body} onChangeText={setBody} placeholder="Quoi de neuf ?" placeholderTextColor={colors.muted} style={[styles.input, styles.textarea]} multiline maxLength={500} />
        <TextInput value={imageUrl} onChangeText={setImageUrl} placeholder={t('imageUrl')} placeholderTextColor={colors.muted} style={styles.input} autoCapitalize="none" />
        <View style={styles.preview}>
          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.previewImage} /> : <FontAwesome6 name="image" size={42} color={colors.primary} />}
        </View>
        <Pressable style={[styles.button, submitting && styles.disabled]} onPress={submit} disabled={submitting}>
          <Text style={styles.buttonText}>{t('publish')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  content: { padding: 16, gap: 12, paddingBottom: 34 },
  input: { color: colors.text, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  textarea: { minHeight: 170, textAlignVertical: 'top' },
  preview: { height: 190, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel },
  previewImage: { width: '100%', height: '100%', borderRadius: 8 },
  button: { alignItems: 'center', borderRadius: 8, paddingVertical: 15, backgroundColor: colors.primary },
  disabled: { opacity: 0.7 },
  buttonText: { color: colors.text, fontWeight: '900' },
});
