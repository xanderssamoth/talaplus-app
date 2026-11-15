import { Image, ImageStyle, StyleProp, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';

/** Covers are served by the API. Keep an empty, neutral area while a legacy
 * record has no cover_url rather than substituting a local image. */
export default function MediaCover({ uri, style }: { uri?: string; isAudio?: boolean; style?: StyleProp<ImageStyle> }) {
  if (uri) return <Image source={{ uri }} style={style} />;
  return <View style={[styles.empty, style]} />;
}

const styles = StyleSheet.create({ empty: { backgroundColor: colors.panelLight } });
