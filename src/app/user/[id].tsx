import { useEffect, useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import { ApiUserProfile, getUserProfile } from '@/lib/api';

export default function UserProfileScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<ApiUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;

    setLoading(true);
    getUserProfile(params.id)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.center}><LoadingState /></View></SafeAreaView>;
  }

  if (!profile) {
    return <SafeAreaView style={styles.container}><View style={styles.center}><EmptyState title={t('profileUnavailableTitle')} body={t('profileUnavailableBody')} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={profile.coverUrl ? { uri: profile.coverUrl } : undefined} style={styles.cover}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
      </ImageBackground>
      <View style={styles.content}>
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{profile.name.charAt(0) || 'T'}</Text>
          </View>
        )}
        <Text style={styles.name}>{profile.name}</Text>
        {!!profile.username && <Text style={styles.username}>@{profile.username}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, padding: 16, justifyContent: 'center' },
  cover: { height: 180, backgroundColor: colors.panel },
  backButton: { width: 42, height: 42, margin: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  content: { alignItems: 'center', padding: 18 },
  avatar: { width: 112, height: 112, borderRadius: 56, marginTop: -74, borderWidth: 4, borderColor: colors.background, backgroundColor: colors.panelLight },
  avatarFallback: { width: 112, height: 112, borderRadius: 56, marginTop: -74, borderWidth: 4, borderColor: colors.background, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  avatarText: { color: colors.text, fontSize: 34, fontWeight: '900' },
  name: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 12 },
  username: { color: colors.muted, marginTop: 4, fontWeight: '800' },
});
