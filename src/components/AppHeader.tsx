import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import BrandLogo from '@/components/BrandLogo';
import SearchOverlay from '@/components/SearchOverlay';
import { colors } from '@/constants/theme';
import { getCurrentUser } from '@/lib/session';
import { getAvatarSource } from '@/utils/user';

type AppHeaderProps = {
  title?: string;
  showLogo?: boolean;
  showAvatar?: boolean;
  searchType?: 'media' | 'product';
  right?: React.ReactNode;
};

export default function AppHeader({ title, showLogo, showAvatar, searchType = 'media', right }: AppHeaderProps) {
  const [searchVisible, setSearchVisible] = useState(false);
  const user = getCurrentUser();
  const avatarSource = getAvatarSource(user);

  return (
    <>
      <View style={styles.header}>
        {showLogo ? (
          <BrandLogo size="sm" />
        ) : (
          <Text style={styles.title}>{title}</Text>
        )}

        <View style={styles.actions}>
          {right ?? (
            <>
              <Pressable style={styles.iconButton} onPress={() => router.push('/marketplace')}>
                <Feather name="shopping-cart" size={19} color={colors.text} />
              </Pressable>
              <Pressable style={styles.iconButton} onPress={() => setSearchVisible(true)}>
                <Feather name="search" size={19} color={colors.text} />
              </Pressable>
              <Pressable style={styles.iconButton} onPress={() => router.push('/notifications')}>
                <Feather name="bell" size={19} color={colors.text} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </Pressable>
              {showAvatar && (
                avatarSource ? (
                  <Image source={avatarSource} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{user.firstname.charAt(0) || 'T'}</Text>
                  </View>
                )
              )}
            </>
          )}
        </View>
      </View>

      <SearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} type={searchType} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 1,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  badgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '900',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panelLight,
  },
  avatarText: {
    color: colors.text,
    fontWeight: '900',
  },
});
