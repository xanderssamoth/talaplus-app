import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import AuthLogo from '@/components/AuthLogo';
import { colors } from '@/constants/theme';
import { signIn, signInAsVisitor } from '@/lib/session';

type LoginMode = 'account' | 'visitor';

function sanitizeUsername(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 15);
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<LoginMode>('account');
  const [identifier, setIdentifier] = useState('');
  const [visitorUsername, setVisitorUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (mode === 'visitor') {
      if (!visitorUsername.trim()) {
        Alert.alert(t('missingFormTitle'), t('missingUsername'));
        return;
      }

      try {
        setIsSubmitting(true);
        await signInAsVisitor(visitorUsername);
        router.replace('/(tabs)');
      } catch (error) {
        Alert.alert(t('loginFailed'), error instanceof Error ? error.message : t('loginFallbackError'));
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (!identifier.trim() || !password) {
      Alert.alert(t('missingFormTitle'), t('missingLoginFields'));
      return;
    }

    try {
      setIsSubmitting(true);
      await signIn(identifier, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(t('loginFailed'), error instanceof Error ? error.message : t('loginFallbackError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={['#1E7BFF', '#0047C7', '#071C78']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24} style={styles.keyboard}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={22} color={colors.text} />
            </Pressable>

            <AuthLogo />
            <Text style={styles.title}>{t('login')}</Text>
            <Text style={styles.subtitle}>{mode === 'visitor' ? t('visitorLoginSubtitle') : t('loginSubtitle')}</Text>

            <View style={styles.modeRow}>
              <Pressable style={[styles.modeButton, mode === 'visitor' && styles.modeButtonActive]} onPress={() => setMode('visitor')}>
                <Feather name="user" size={16} color={colors.text} />
                <Text style={styles.modeButtonText}>{t('visitorMode')}</Text>
              </Pressable>
              <Pressable style={[styles.modeButton, mode === 'account' && styles.modeButtonActive]} onPress={() => setMode('account')}>
                <Feather name="log-in" size={16} color={colors.text} />
                <Text style={styles.modeButtonText}>{t('signIn')}</Text>
              </Pressable>
            </View>

            <View style={styles.form}>
              {mode === 'visitor' ? (
                <TextInput value={visitorUsername} onChangeText={(value) => setVisitorUsername(sanitizeUsername(value))} placeholder={t('username')} placeholderTextColor={colors.muted} autoCapitalize="none" style={styles.input} />
              ) : (
                <>
                  <TextInput value={identifier} onChangeText={setIdentifier} placeholder={t('loginIdentifierPlaceholder')} placeholderTextColor={colors.muted} autoCapitalize="none" style={styles.input} />

                  <View style={styles.passwordField}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder={t('password')}
                      placeholderTextColor={colors.muted}
                      secureTextEntry={!passwordVisible}
                      style={styles.passwordInput}
                    />
                    <Pressable onPress={() => setPasswordVisible((visible) => !visible)} style={styles.eyeButton}>
                      <Feather name={passwordVisible ? 'eye-off' : 'eye'} size={20} color={colors.muted} />
                    </Pressable>
                  </View>
                </>
              )}

              <Pressable style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={handleLogin} disabled={isSubmitting}>
                <Text style={styles.buttonText}>{isSubmitting ? t('signingIn') : mode === 'visitor' ? t('continue') : t('signIn')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, backgroundColor: 'transparent' },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 16, left: 16, width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(5,11,18,0.46)' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: colors.text, opacity: 0.82, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8, marginBottom: 18 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  modeButton: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(5,11,18,0.34)' },
  modeButtonActive: { borderColor: colors.text, backgroundColor: 'rgba(255,255,255,0.16)' },
  modeButtonText: { color: colors.text, fontWeight: '800' },
  form: { gap: 12 },
  input: { color: colors.text, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: 'rgba(5,11,18,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  passwordField: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, backgroundColor: 'rgba(5,11,18,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  passwordInput: { flex: 1, color: colors.text, paddingHorizontal: 14, paddingVertical: 14 },
  eyeButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 15,
    marginTop: 6,
    backgroundColor: colors.primary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.text, fontWeight: '800', fontSize: 16 },
});
