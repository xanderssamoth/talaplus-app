import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { sendAiMessage } from '@/lib/api';

type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

const promptKeys = ['aiPromptWatch', 'aiPromptLearn', 'aiPromptBusiness', 'aiPromptSupport'];

export default function AiScreen() {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [message, setMessage] = useState('');
  const [items, setItems] = useState<ChatItem[]>([
    { id: 'hello', role: 'assistant', text: t('aiGreeting') },
  ]);
  const [sending, setSending] = useState(false);

  const send = async (text = message) => {
    const next = text.trim();
    if (!next || sending) return;

    setMessage('');
    const userItem = { id: `${Date.now()}-user`, role: 'user' as const, text: next };
    setItems((current) => [...current, userItem]);

    try {
      setSending(true);
      const answer = await sendAiMessage(next);
      setItems((current) => [...current, { id: `${Date.now()}-ai`, role: 'assistant', text: answer || t('aiFallbackAnswer') }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (error) {
      Alert.alert(t('talaAi'), error instanceof Error ? error.message : t('loginFallbackError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Feather name="x" size={23} color={colors.text} /></Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('talaAi')}</Text>
            <Text style={styles.status}>{t('online')}</Text>
          </View>
          <Feather name="more-vertical" size={22} color={colors.text} />
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.robotPanel}>
            <FontAwesome5 name="robot" size={70} color={colors.text} />
          </View>

          {items.map((item) => (
            <View key={item.id} style={[styles.bubble, item.role === 'user' && styles.userBubble]}>
              <Text style={styles.bubbleText}>{item.text}</Text>
            </View>
          ))}

          {promptKeys.map((promptKey) => (
            <Pressable key={promptKey} style={styles.prompt} onPress={() => send(t(promptKey))}>
              <Text style={styles.promptText}>{t(promptKey)}</Text>
              <Feather name="chevron-right" size={18} color={colors.text} />
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={t('writeMessage')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
            autoFocus
            onSubmitEditing={() => send()}
          />
          <Pressable style={[styles.send, sending && styles.disabled]} onPress={() => send()} disabled={sending}>
            <Feather name="send" size={18} color={colors.text} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  robotPanel: { height: 154, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel, marginBottom: 12 },
  bubble: { alignSelf: 'flex-start', maxWidth: '86%', borderRadius: 8, padding: 13, marginTop: 8, backgroundColor: colors.panel },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleText: { color: colors.text, lineHeight: 21 },
  prompt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, padding: 13, marginTop: 8, backgroundColor: colors.panel },
  promptText: { color: colors.text, fontWeight: '800' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, minHeight: 46, maxHeight: 130, color: colors.text, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.panel },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  disabled: { opacity: 0.65 },
});
