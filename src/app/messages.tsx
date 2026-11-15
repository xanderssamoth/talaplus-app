import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import SearchOverlay from '@/components/SearchOverlay';
import { colors } from '@/constants/theme';

const contacts = ['new', 'Grace', 'Junior', 'Anina', 'Mike'];
const messages = [
  ['Grace M.', 'demoSeeTomorrow', '10:30', '2'],
  ['Junior B.', 'demoThanks', '9:15', '1'],
  ['Amina K.', 'demoSendingThis', 'yesterday', ''],
  ['Mike L.', 'demoSeeYouLater', 'yesterday', ''],
  ['TALA+ Team', 'demoWelcome', 'yesterday', ''],
];

export default function MessagesScreen() {
  const { t } = useTranslation();
  const [searchVisible, setSearchVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={23} color={colors.text} /></Pressable>
        <Text style={styles.title}>{t('messages')}</Text>
        <Pressable onPress={() => setSearchVisible(true)}>
          <Feather name="search" size={21} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contacts}>
          {contacts.map((contact, index) => (
            <View key={contact} style={styles.contact}>
              <View style={[styles.contactAvatar, index === 0 && styles.addAvatar]}>
                {index === 0 ? <Feather name="plus" size={24} color={colors.text} /> : <Text style={styles.initials}>{contact.charAt(0)}</Text>}
              </View>
              <Text style={styles.contactName}>{index === 0 ? t(contact) : contact}</Text>
            </View>
          ))}
        </ScrollView>

        {messages.map(([name, previewKey, timeKey, count]) => (
          <View key={name} style={styles.message}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{name.charAt(0)}</Text>
            </View>
            <View style={styles.messageBody}>
              <Text style={styles.messageName}>{name}</Text>
              <Text style={styles.preview}>{t(previewKey)}</Text>
            </View>
            <View style={styles.meta}>
              <Text style={styles.time}>{timeKey === 'yesterday' ? t('yesterday') : timeKey}</Text>
              {!!count && <Text style={styles.count}>{count}</Text>}
            </View>
          </View>
        ))}
      </ScrollView>

      <SearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  content: { paddingHorizontal: 16, paddingBottom: 30 },
  contacts: { gap: 14, paddingBottom: 18 },
  contact: { alignItems: 'center', gap: 7 },
  contactAvatar: { width: 56, height: 56, borderRadius: 28, padding: 2, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  addAvatar: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel, borderColor: colors.border },
  initials: { color: colors.text, fontWeight: '900' },
  contactName: { color: colors.text, fontSize: 11, fontWeight: '800' },
  message: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: colors.panel },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  messageBody: { flex: 1 },
  messageName: { color: colors.text, fontWeight: '900' },
  preview: { color: colors.muted, marginTop: 4 },
  meta: { alignItems: 'flex-end', gap: 7 },
  time: { color: colors.muted, fontSize: 12 },
  count: { color: colors.text, backgroundColor: colors.primary, borderRadius: 9, minWidth: 19, paddingVertical: 2, textAlign: 'center', overflow: 'hidden', fontSize: 11, fontWeight: '900' },
});
