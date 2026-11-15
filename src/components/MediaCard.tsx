import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Media } from '@/types/types';
import { colors } from '@/constants/theme';
import MediaCover from '@/components/MediaCover';

type MediaCardProps = {
  media: Media;
  compact?: boolean;
};

export default function MediaCard({ media, compact }: MediaCardProps) {
  return (
    <Pressable style={[styles.card, compact && styles.compact]} onPress={() => router.push(`/mediaDetails/${media.id}`)}>
      <MediaCover uri={media.thumbnail} isAudio={(media as Media & { isAudio?: boolean }).isAudio} style={styles.image} />
      <View style={styles.caption}>
        <Text style={styles.title} numberOfLines={1}>{media.title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 112,
    marginRight: 12,
  },
  compact: {
    width: 92,
  },
  image: {
    width: '100%',
    aspectRatio: 0.72,
    borderRadius: 8,
    backgroundColor: colors.panelLight,
  },
  caption: {
    paddingTop: 7,
  },
  title: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
});
