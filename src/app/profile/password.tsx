import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { updatePassword } from '@/lib/profile-api';
import { getCurrentUser } from '@/lib/session';

const fields = { former_password: 'formerPassword', new_password: 'newPassword', password_confirmation: 'confirmPassword' } as const;
export default function PasswordScreen() {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const save = async () => { try { setBusy(true); await updatePassword(getCurrentUser().id, values); router.back(); } catch (e) { Alert.alert(t('actionImpossible'), e instanceof Error ? e.message : t('requestFailed')); } finally { setBusy(false); } };
  return <SafeAreaView style={styles.container}><View style={styles.header}><Pressable onPress={() => router.back()}><Feather name="arrow-left" size={23} color={colors.text}/></Pressable><Text style={styles.title}>{t('changePassword')}</Text><View style={{ width: 23 }}/></View><ScrollView contentContainerStyle={styles.content}>{Object.entries(fields).map(([key, label]) => <View key={key}><Text style={styles.label}>{t(label)}</Text><TextInput secureTextEntry style={styles.input} value={values[key] ?? ''} onChangeText={value => setValues(current => ({ ...current, [key]: value }))} placeholder={t(label)} placeholderTextColor={colors.muted}/></View>)}<Pressable style={styles.button} disabled={busy} onPress={save}><Text style={styles.buttonText}>{busy ? t('sending') : t('saveChanges')}</Text></Pressable></ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { color: colors.text, fontSize: 20, fontWeight: '900' }, content: { padding: 16, gap: 14 }, label: { color: colors.text, marginBottom: 6 }, input: { backgroundColor: colors.panel, color: colors.text, borderRadius: 8, padding: 12 }, button: { backgroundColor: colors.primary, borderRadius: 8, padding: 15, alignItems: 'center' }, buttonText: { color: colors.text, fontWeight: '900' } });
