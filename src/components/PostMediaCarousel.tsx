import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { ApiPostFile } from '@/lib/api';

type Props = {
  files: ApiPostFile[];
  compact?: boolean;
};

export default function PostMediaCarousel({ files, compact = false }: Props) {
  const media = files.filter((file) => file.url);

  if (!media.length) {
    return null;
  }

  if (media.length === 1) {
    return <PostMediaTile file={media[0]} single compact={compact} />;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
      {media.map((file, index) => <PostMediaTile key={`${file.id}-${index}`} file={file} compact={compact} />)}
    </ScrollView>
  );
}

function PostMediaTile({ file, single = false, compact = false }: { file: ApiPostFile; single?: boolean; compact?: boolean }) {
  const { t } = useTranslation();
  const isPhoto = ['photo', 'image'].includes(file.type);

  return (
    <View style={[styles.tile, single && styles.singleTile, compact && styles.compactTile]}>
      {isPhoto ? (
        <Image source={{ uri: file.url }} style={styles.image} />
      ) : (
        <View style={styles.videoTile}>
          <Feather name="play-circle" size={compact ? 28 : 36} color={colors.text} />
          <Text style={styles.videoText}>{t('video')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carousel: { gap: 10, paddingRight: 12, marginTop: 12 },
  tile: { width: 250, height: 210, overflow: 'hidden', borderRadius: 8, backgroundColor: colors.panelLight, borderWidth: 1, borderColor: colors.border },
  singleTile: { width: '100%', marginTop: 12 },
  compactTile: { width: 210, height: 150 },
  image: { width: '100%', height: '100%' },
  videoTile: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.panelLight },
  videoText: { color: colors.text, fontWeight: '900' },
});
