import { Image, ImageStyle, StyleProp, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';

/** Keeps media without a cover identifiable instead of rendering an empty tile. */
const audioCover = require('../../assets/covers/cover-audio.png');
const videoCover = require('../../assets/covers/cover-video.png');

export default function MediaCover({ uri, isAudio, style }: { uri?: string; isAudio?: boolean; style?: StyleProp<ImageStyle> }) {
  if (uri) return <Image source={{ uri }} style={style} />;
  return <Image source={isAudio ? audioCover : videoCover} style={style} resizeMode="cover" />;
}
