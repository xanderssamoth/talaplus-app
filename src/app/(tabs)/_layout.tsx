import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Tabs } from 'expo-router';
import { Feather, FontAwesome5, FontAwesome6, Foundation, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  const { t } = useTranslation();
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text,
          tabBarStyle: {
            height: 64,
            paddingTop: 6,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: t('home'),
            tabBarIcon: ({ color }) => <Foundation name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chaines"
          options={{
            title: t('channels'),
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="television-play" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="explorer"
          options={{
            title: t('explore'),
            tabBarIcon: ({ color }) => <Feather name="search" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="communaute"
          options={{
            title: t('community'),
            tabBarIcon: ({ color }) => <Feather name="users" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profil"
          options={{
            title: t('profile'),
            tabBarIcon: ({ color }) => <FontAwesome5 name="user-circle" size={21} color={color} />,
          }}
        />
        <Tabs.Screen name="chat" options={{ href: null }} />
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="my_tala" options={{ href: null }} />
      </Tabs>

      <Pressable style={styles.fab} onPress={() => setFabOpen(true)}>
        <Feather name="plus" size={26} color={colors.text} />
      </Pressable>

      <Modal transparent visible={fabOpen} animationType="fade" onRequestClose={() => setFabOpen(false)}>
        <Pressable style={styles.fabBackdrop} onPress={() => setFabOpen(false)}>
          <View style={styles.fabMenu}>
            <FabAction icon="clapperboard" label={t('newVideo')} onPress={() => { setFabOpen(false); router.push('/create/video'); }} />
            <FabAction icon="pen-to-square" label={t('newPost')} onPress={() => { setFabOpen(false); router.push('/create/post'); }} />
            <FabAction icon="bag-shopping" label={t('newProduct')} onPress={() => { setFabOpen(false); router.push('/create/product'); }} />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function FabAction({ icon, label, onPress }: { icon: keyof typeof FontAwesome6.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.fabAction} onPress={onPress}>
      <FontAwesome6 name={icon} size={20} color={colors.text} />
      <Text style={styles.fabLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 78,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  fabBackdrop: { flex: 1, justifyContent: 'flex-end', padding: 18, paddingBottom: 146, backgroundColor: 'rgba(0,0,0,0.42)' },
  fabMenu: { alignSelf: 'flex-end', width: 240, borderRadius: 8, padding: 8, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  fabAction: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8, padding: 14 },
  fabLabel: { color: colors.text, fontWeight: '800' },
});
