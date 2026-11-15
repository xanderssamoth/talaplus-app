import { Episode } from "@/types/types";
import { ImageBackground, View, StyleSheet, Text, Pressable, ActivityIndicator } from "react-native";
import { FontAwesome } from '@expo/vector-icons';

type EpisodeListItemProps = {
  episode: Episode;
  onPlayMediaPressed: (video?: string, episodeId?: string) => Promise<void>;
  isEpisodeLoading: boolean;
};

export default function EpisodeListItem({ episode, onPlayMediaPressed, isEpisodeLoading }: EpisodeListItemProps) {
  const { id, episodeThumbnail, episodeDescription, episodeTitle, episodeNumber, duration, videoUrl } = episode;
  return (
    <Pressable style={styles.container} onPress={() => onPlayMediaPressed(videoUrl, id)}>
      <View style={styles.episodeContainer}>
        <ImageBackground source={{ uri: episodeThumbnail }} style={styles.imageBackground}>
          {isEpisodeLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <FontAwesome name="play" size={12} color="white" style={{ marginLeft: 2 }} />
          )}
        </ImageBackground>
        <View style={{ gap: 2 }}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.episodeText}>{episodeNumber}. </Text>
            <Text style={styles.episodeText}>{episodeTitle}</Text>
          </View>

          <Text style={styles.duration}>{duration}m</Text>
        </View>
      </View>
      <Text style={styles.description}>{episodeDescription}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    marginBottom: 15,
    gap: 5
  },
  imageBackground: {
    width: 100,
    aspectRatio: 3 / 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  episodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  episodeText: {
    color: '#ADADAD',
    fontWeight: '700',
  },
  duration: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    color: '#ADADAD',
    fontWeight: '500',
  }
});