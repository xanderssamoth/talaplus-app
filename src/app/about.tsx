import { useEffect } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

const aboutUrl = 'https://talaplus.tv/about';

export default function AboutScreen() {
  useEffect(() => {
    Linking.openURL(aboutUrl).catch(() => undefined);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title}>TALA+</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>La page à propos de TALA+ s’ouvre dans votre navigateur.</Text>
        <Pressable style={styles.button} onPress={() => Linking.openURL(aboutUrl)}>
          <Text style={styles.buttonText}>Ouvrir la page</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { color: colors.text, textAlign: 'center', lineHeight: 22 },
  button: { marginTop: 18, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: colors.primary },
  buttonText: { color: colors.text, fontWeight: '900' },
});
