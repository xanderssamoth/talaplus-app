import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import { ApiNotification, getNotifications, markNotificationAsRead, muteUser } from '@/lib/api';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const load = (nextPage: number) => {
    if ((loading && items.length) || nextPage > lastPage) return;
    setLoading(true);
    getNotifications(nextPage)
      .then((result) => {
        setItems((current) => nextPage === 1 ? result.items : [...current, ...result.items]);
        setPage(nextPage);
        setLastPage(result.lastPage);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
  }, []);

  const markRead = async (notification: ApiNotification) => {
    setOpenMenuId(null);
    setItems((current) => current.map((item) => item.id === notification.id ? { ...item, unread: false } : item));
    await markNotificationAsRead(notification.id).catch(() => undefined);
  };

  const mute = async (notification: ApiNotification) => {
    setOpenMenuId(null);
    if (notification.fromUserId) {
      setItems((current) => current.filter((item) => item.fromUserId !== notification.fromUserId));
      await muteUser(notification.fromUserId).catch(() => undefined);
    }
  };

  const openNotification = (notification: ApiNotification) => {
    if (notification.route) {
      markRead(notification);
      router.push(notification.route as never);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{t('notifications')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        onEndReached={() => load(page + 1)}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={loading ? <LoadingState /> : <EmptyState title={t('noNotificationTitle')} body={t('noNotificationBody')} />}
        ListFooterComponent={loading && items.length ? <LoadingState compact /> : null}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            menuOpen={openMenuId === item.id}
            t={t}
            onOpen={() => openNotification(item)}
            onToggleMenu={() => setOpenMenuId((current) => current === item.id ? null : item.id)}
            onMarkRead={() => markRead(item)}
            onMute={() => mute(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function NotificationItem({ notification, menuOpen, t, onOpen, onToggleMenu, onMarkRead, onMute }: {
  notification: ApiNotification;
  menuOpen: boolean;
  t: (key: string) => string;
  onOpen: () => void;
  onToggleMenu: () => void;
  onMarkRead: () => void;
  onMute: () => void;
}) {
  return (
    <Pressable style={[styles.item, notification.unread && styles.itemUnread]} onPress={onOpen}>
      {notification.image ? (
        <Image source={{ uri: notification.image }} style={styles.image} />
      ) : notification.icon ? (
        <View style={[styles.iconImage, { backgroundColor: notification.iconColor ?? colors.primary }]}>
          <Feather name={notification.icon as keyof typeof Feather.glyphMap} size={24} color={colors.text} />
        </View>
      ) : (
        <Image source={require('../../assets/icon.png')} style={styles.image} />
      )}

      <View style={styles.body}>
        <NotificationText text={notification.text} strongText={notification.strongText} />
        {!!notification.time && <Text style={styles.time}>{notification.time}</Text>}
      </View>

      <Pressable style={styles.menuButton} onPress={onToggleMenu}>
        <Feather name="more-vertical" size={20} color={colors.muted} />
      </Pressable>
      {menuOpen && (
        <View style={styles.menu}>
          {notification.canMute && (
            <Pressable style={styles.menuItem} onPress={onMute}>
              <Text style={styles.menuText}>{t('hideThis')}</Text>
            </Pressable>
          )}
          <Pressable style={styles.menuItem} onPress={onMarkRead}>
            <Text style={styles.menuText}>{t('markAsRead')}</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

function NotificationText({ text, strongText }: { text: string; strongText?: string }) {
  if (!strongText || !text.includes(strongText)) {
    return <Text style={styles.text}>{text}</Text>;
  }

  const [before, after] = text.split(strongText);
  return (
    <Text style={styles.text}>
      {before}
      <Text style={styles.strong}>{strongText}</Text>
      {after}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  content: { padding: 16, paddingBottom: 30 },
  item: { position: 'relative', flexDirection: 'row', gap: 12, borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  itemUnread: { borderColor: colors.primary },
  image: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.panelLight },
  iconImage: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  text: { color: colors.text, lineHeight: 20 },
  strong: { fontWeight: '900' },
  time: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 6 },
  menuButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  menu: { position: 'absolute', top: 42, right: 12, zIndex: 5, minWidth: 160, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.panelLight, borderWidth: 1, borderColor: colors.border },
  menuItem: { paddingHorizontal: 12, paddingVertical: 11 },
  menuText: { color: colors.text, fontWeight: '800' },
});
