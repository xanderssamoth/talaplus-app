import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { ApiUserProfile, getUserConnections, shareEntity } from '@/lib/api';

export type ShareEntity = 'media' | 'post' | 'product';

type ShareSheetProps = {
  visible: boolean;
  entity: ShareEntity;
  entityId: string;
  onClose: () => void;
};

const shareIcons = {
  post: require('../../assets/share-icons/logo-share.png'),
  message: require('../../assets/share-icons/logo-users.png'),
  facebook: require('../../assets/share-icons/logo-facebook.png'),
  x: require('../../assets/share-icons/logo-x.png'),
  whatsapp: require('../../assets/share-icons/logo-whatsapp.png'),
  snapchat: require('../../assets/share-icons/logo-snapchat.png'),
};

const copies = {
  fr: {
    sendTo: 'Envoyer à :',
    shareOn: 'Partager sur :',
    post: 'Post',
    message: 'Message',
    facebook: 'Facebook',
    x: 'X',
    whatsapp: 'Whatsapp',
    snapchat: 'Snapchat',
    report: 'Signaler',
    download: 'Télécharger',
    cancel: 'Annuler',
    sent: 'Partage envoyé',
    sentBody: 'Le contenu a été partagé.',
    unavailable: 'Action indisponible',
  },
  en: {
    sendTo: 'Send to:',
    shareOn: 'Share on:',
    post: 'Post',
    message: 'Message',
    facebook: 'Facebook',
    x: 'X',
    whatsapp: 'Whatsapp',
    snapchat: 'Snapchat',
    report: 'Report',
    download: 'Download',
    cancel: 'Cancel',
    sent: 'Shared',
    sentBody: 'The content has been shared.',
    unavailable: 'Action unavailable',
  },
  ln: {
    sendTo: 'Tindela:',
    shareOn: 'Kabola na:',
    post: 'Post',
    message: 'Message',
    facebook: 'Facebook',
    x: 'X',
    whatsapp: 'Whatsapp',
    snapchat: 'Snapchat',
    report: 'Signaler',
    download: 'Télécharger',
    cancel: 'Kanga',
    sent: 'Ekabolami',
    sentBody: 'Contenu ekabolami.',
    unavailable: 'Likambo oyo ezali naino te',
  },
};

export default function ShareSheet({ visible, entity, entityId, onClose }: ShareSheetProps) {
  const { i18n } = useTranslation();
  const [connections, setConnections] = useState<ApiUserProfile[]>([]);
  const language = (i18n.language || 'fr').split('-')[0] as keyof typeof copies;
  const copy = copies[language] ?? copies.fr;
  const link = useMemo(() => `https://talaplus.tv/${entity}/${entityId}`, [entity, entityId]);

  useEffect(() => {
    if (!visible) return;
    getUserConnections(1)
      .then((result) => setConnections(result.items.slice(0, 8)))
      .catch(() => setConnections([]));
  }, [visible]);

  const openConnections = () => {
    onClose();
    router.push({ pathname: '/share/connections', params: { entity, entityId, link } });
  };

  const shareAsPost = async () => {
    try {
      await shareEntity(entity, entityId);
      Alert.alert(copy.sent, copy.sentBody);
      onClose();
    } catch (error) {
      Alert.alert(copy.unavailable, error instanceof Error ? error.message : copy.unavailable);
    }
  };

  const openExternal = async (url: string) => {
    try {
      await Linking.openURL(url);
      onClose();
    } catch {
      Alert.alert(copy.unavailable, copy.unavailable);
    }
  };

  const encoded = encodeURIComponent(link);
  const shareOptions = [
    { key: 'post', label: copy.post, icon: shareIcons.post, onPress: shareAsPost },
    { key: 'message', label: copy.message, icon: shareIcons.message, onPress: openConnections },
    { key: 'facebook', label: copy.facebook, icon: shareIcons.facebook, onPress: () => openExternal(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`) },
    { key: 'x', label: copy.x, icon: shareIcons.x, onPress: () => openExternal(`https://twitter.com/intent/tweet?url=${encoded}`) },
    { key: 'whatsapp', label: copy.whatsapp, icon: shareIcons.whatsapp, onPress: () => openExternal(`https://wa.me/?text=${encoded}`) },
    { key: 'snapchat', label: copy.snapchat, icon: shareIcons.snapchat, onPress: () => openExternal(`https://www.snapchat.com/scan?attachmentUrl=${encoded}`) },
  ];

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <Text style={styles.sectionTitle}>{copy.sendTo}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleRow}>
            {connections.map((user) => (
              <Pressable key={user.id} style={styles.person} onPress={openConnections}>
                {user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarText}>{user.name.charAt(0) || 'T'}</Text></View>}
                <Text style={styles.personName} numberOfLines={2}>{user.username || user.name}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.person} onPress={openConnections}>
              <View style={styles.moreCircle}>
                <Feather name="more-horizontal" size={26} color={colors.text} />
              </View>
              <Text style={styles.personName}>Plus</Text>
            </Pressable>
          </ScrollView>

          <Text style={styles.sectionTitle}>{copy.shareOn}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shareRow}>
            {shareOptions.map((option) => (
              <Pressable key={option.key} style={styles.shareOption} onPress={option.onPress}>
                <Image source={option.icon} style={styles.shareIcon} />
                <Text style={styles.shareLabel} numberOfLines={1}>{option.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.toolsRow}>
            <Pressable style={styles.tool} onPress={() => Alert.alert(copy.report, copy.unavailable)}>
              <View style={styles.toolIcon}><Feather name="flag" size={24} color={colors.text} /></View>
              <Text style={styles.toolLabel}>{copy.report}</Text>
            </Pressable>
            <Pressable style={styles.tool} onPress={() => Alert.alert(copy.download, copy.unavailable)}>
              <View style={styles.toolIcon}><Feather name="download" size={24} color={colors.text} /></View>
              <Text style={styles.toolLabel}>{copy.download}</Text>
            </Pressable>
          </View>

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>{copy.cancel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.62)' },
  sheet: { maxHeight: '82%', borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingTop: 18, backgroundColor: colors.background, borderTopWidth: 1, borderColor: colors.border },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 14 },
  peopleRow: { gap: 18, paddingHorizontal: 18, paddingBottom: 22 },
  person: { width: 78, alignItems: 'center', gap: 8 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.panelLight },
  avatarFallback: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  avatarText: { color: colors.text, fontSize: 20, fontWeight: '900' },
  moreCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight, borderWidth: 1, borderColor: colors.border },
  personName: { color: colors.text, textAlign: 'center', fontSize: 12, lineHeight: 16, fontWeight: '700' },
  shareRow: { gap: 18, paddingHorizontal: 18, paddingBottom: 22 },
  shareOption: { width: 78, alignItems: 'center', gap: 8 },
  shareIcon: { width: 58, height: 58, borderRadius: 29 },
  shareLabel: { color: colors.text, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  toolsRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18, borderTopWidth: 1, borderTopColor: colors.border },
  tool: { flex: 1, alignItems: 'center', gap: 8 },
  toolIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  toolLabel: { color: colors.text, fontWeight: '800' },
  cancelButton: { alignItems: 'center', paddingVertical: 18, borderTopWidth: 1, borderTopColor: colors.border },
  cancelText: { color: colors.text, fontSize: 18, fontWeight: '900' },
});
