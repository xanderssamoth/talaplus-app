import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

const prompts = ['Que regarder ?', 'Apprendre un métier', 'Créer un business', 'Aide & Support'];

export default function AiScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="x" size={23} color={colors.text} /></Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>TALA+ IA</Text>
          <Text style={styles.status}>En ligne</Text>
        </View>
        <Feather name="more-vertical" size={22} color={colors.text} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.robotPanel}>
          <FontAwesome5 name="robot" size={80} color={colors.text} />
        </View>

        <View style={styles.bubble}>
          <Text style={styles.bubbleTitle}>Salut !</Text>
          <Text style={styles.bubbleText}>Je suis ton assistant TALA+. Que puis-je faire pour toi ?</Text>
        </View>

        {prompts.map((prompt) => (
          <Pressable key={prompt} style={styles.prompt}>
            <Text style={styles.promptText}>{prompt}</Text>
            <Feather name="chevron-right" size={18} color={colors.text} />
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput placeholder="Écris ton message..." placeholderTextColor={colors.muted} style={styles.input} />
        <Pressable style={styles.send}><Feather name="send" size={18} color={colors.text} /></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  headerText: { flex: 1 },
  title: { color: colors.text, fontSize: 21, fontWeight: '900' },
  status: { color: colors.muted, marginTop: 2 },
  content: { padding: 16, paddingBottom: 20 },
  robotPanel: { height: 210, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel },
  bubble: { borderRadius: 8, padding: 16, marginTop: 16, backgroundColor: colors.panel },
  bubbleTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  bubbleText: { color: colors.text, lineHeight: 21, marginTop: 5 },
  prompt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, padding: 15, marginTop: 10, backgroundColor: colors.panel },
  promptText: { color: colors.text, fontWeight: '800' },
  composer: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, color: colors.text, borderRadius: 8, paddingHorizontal: 14, backgroundColor: colors.panel },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
});
