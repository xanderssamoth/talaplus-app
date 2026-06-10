import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import AuthLogo from '@/components/AuthLogo';
import { colors } from '@/constants/theme';
import { signUp } from '@/lib/session';
import { Country, fallbackCountries, fetchCountries, getCallingCode } from '@/utils/countries';

type SignupMode = 'account' | 'visitor';

function sanitizeUsername(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 15);
}

function makeUsername(firstname: string, lastname: string) {
  return sanitizeUsername(`${firstname}${lastname}`);
}

export default function SignupScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<SignupMode>('account');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [countries, setCountries] = useState<Country[]>(fallbackCountries);
  const [selectedCountry, setSelectedCountry] = useState<Country>(fallbackCountries[0]);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCountries()
      .then((items) => {
        setCountries(items);
        setSelectedCountry(items.find((item) => item.cca2 === 'CD') ?? items[0] ?? fallbackCountries[0]);
      })
      .catch(() => setCountries(fallbackCountries));
  }, []);

  useEffect(() => {
    if (!usernameTouched) {
      setUsername(makeUsername(firstname, lastname));
    }
  }, [firstname, lastname, usernameTouched]);

  const switchMode = (nextMode: SignupMode) => {
    setMode(nextMode);
    setUsernameTouched(false);
    setUsername(makeUsername(firstname, lastname));

    if (nextMode === 'visitor') {
      setEmail('');
      setPhone('');
      setPassword('');
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsernameTouched(true);
    setUsername(sanitizeUsername(value));
  };

  const handleSignup = async () => {
    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      Alert.alert(t('missingFormTitle'), t('missingUsername'));
      return;
    }

    if (mode === 'account' && (!firstname || !lastname || !email || !phone || !password)) {
      Alert.alert(t('missingFormTitle'), t('missingSignupFields'));
      return;
    }

    try {
      setIsSubmitting(true);
      await signUp({
        firstname,
        lastname,
        email: mode === 'account' ? email : undefined,
        phone: mode === 'account' ? `${getCallingCode(selectedCountry)}${phone}` : undefined,
        username: normalizedUsername,
        password: mode === 'account' ? password : undefined,
      });
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(t('signupFailed'), error instanceof Error ? error.message : t('signupFallbackError'));
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
            <Text style={styles.title}>{t('signUpTitle')}</Text>
            <Text style={styles.subtitle}>{mode === 'visitor' ? t('visitorSignupSubtitle') : t('signupSubtitle')}</Text>

            <View style={styles.modeRow}>
              <Pressable style={[styles.modeButton, mode === 'visitor' && styles.modeButtonActive]} onPress={() => switchMode('visitor')}>
                <Feather name="user" size={16} color={colors.text} />
                <Text style={styles.modeButtonText}>{t('visitorMode')}</Text>
              </Pressable>
              <Pressable style={[styles.modeButton, mode === 'account' && styles.modeButtonActive]} onPress={() => switchMode('account')}>
                <Feather name="user-plus" size={16} color={colors.text} />
                <Text style={styles.modeButtonText}>{t('createAccount')}</Text>
              </Pressable>
            </View>

            <View style={styles.form}>
              <View style={styles.row}>
                <TextInput value={firstname} onChangeText={setFirstname} placeholder={t('firstName')} placeholderTextColor={colors.muted} style={[styles.input, styles.halfInput]} />
                <TextInput value={lastname} onChangeText={setLastname} placeholder={t('lastName')} placeholderTextColor={colors.muted} style={[styles.input, styles.halfInput]} />
              </View>

              <TextInput value={username} onChangeText={handleUsernameChange} placeholder={t('username')} placeholderTextColor={colors.muted} autoCapitalize="none" style={styles.input} />

              {mode === 'account' && (
                <>
                  <TextInput value={email} onChangeText={setEmail} placeholder={t('email')} placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" style={styles.input} />

                  <View style={styles.phoneRow}>
                    <Pressable style={styles.countryButton} onPress={() => setCountryModalVisible(true)}>
                      <Image source={{ uri: selectedCountry.flags.png ?? selectedCountry.flags.svg }} style={styles.flag} />
                      <Text style={styles.callingCode}>{getCallingCode(selectedCountry)}</Text>
                      <Feather name="chevron-down" size={16} color={colors.muted} />
                    </Pressable>
                    <TextInput value={phone} onChangeText={setPhone} placeholder={t('phone')} placeholderTextColor={colors.muted} keyboardType="phone-pad" style={[styles.input, styles.phoneInput]} />
                  </View>

                  <View style={styles.passwordField}>
                    <TextInput value={password} onChangeText={setPassword} placeholder={t('password')} placeholderTextColor={colors.muted} secureTextEntry={!passwordVisible} style={styles.passwordInput} />
                    <Pressable onPress={() => setPasswordVisible((visible) => !visible)} style={styles.eyeButton}>
                      <Feather name={passwordVisible ? 'eye-off' : 'eye'} size={20} color={colors.muted} />
                    </Pressable>
                  </View>
                </>
              )}

              <Pressable style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={handleSignup} disabled={isSubmitting}>
                <Text style={styles.buttonText}>{isSubmitting ? t('creating') : mode === 'visitor' ? t('continue') : t('createMyAccount')}</Text>
              </Pressable>

              <Pressable style={styles.linkButton} onPress={() => router.replace('/login')}>
                <Text style={styles.linkText}>{t('alreadyHaveAccount')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal transparent visible={countryModalVisible} animationType="slide" onRequestClose={() => setCountryModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalPanel}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('phoneCode')}</Text>
                <Pressable onPress={() => setCountryModalVisible(false)}>
                  <Feather name="x" size={22} color={colors.text} />
                </Pressable>
              </View>
              <ScrollView>
                {countries.slice(0, 80).map((country) => (
                  <Pressable
                    key={country.cca2}
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountry(country);
                      setCountryModalVisible(false);
                    }}
                  >
                    <Image source={{ uri: country.flags.png ?? country.flags.svg }} style={styles.countryFlag} />
                    <Text style={styles.countryName}>{country.name.common}</Text>
                    <Text style={styles.countryCode}>{getCallingCode(country)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, backgroundColor: 'transparent' },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, padding: 20, paddingTop: 70, paddingBottom: 34, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 16, left: 16, width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(5,11,18,0.46)' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: colors.text, opacity: 0.82, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8, marginBottom: 18 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  modeButton: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(5,11,18,0.34)' },
  modeButtonActive: { borderColor: colors.text, backgroundColor: 'rgba(255,255,255,0.16)' },
  modeButtonText: { color: colors.text, fontWeight: '800' },
  form: { gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
  input: { color: colors.text, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: 'rgba(5,11,18,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  halfInput: { flex: 1 },
  phoneRow: { flexDirection: 'row', gap: 10 },
  countryButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, backgroundColor: 'rgba(5,11,18,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  flag: { width: 24, height: 16, borderRadius: 2 },
  callingCode: { color: colors.text, fontWeight: '900' },
  phoneInput: { flex: 1 },
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
  linkButton: { alignItems: 'center', paddingVertical: 8 },
  linkText: { color: colors.text, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.64)' },
  modalPanel: { maxHeight: '74%', borderTopLeftRadius: 8, borderTopRightRadius: 8, padding: 16, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  countryItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  countryFlag: { width: 32, height: 22, borderRadius: 3 },
  countryName: { flex: 1, color: colors.text, fontWeight: '800' },
  countryCode: { color: colors.primary, fontWeight: '900' },
});
