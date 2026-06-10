import { Pressable, Text, View, StyleSheet } from "react-native";
import { FontAwesome } from '@expo/vector-icons';

type MediaInfoProps = {
  title: string;
  releaseYear: number;
  ageRestriction: string;
  duration?: number;
  description: string;
  type: string;
  nrOfSeasons?: number;
  onPlayMediaPressed: (video?: string, episodeId?: string) => Promise<void>;
}

export default function MediaInfo(props: MediaInfoProps) {
  const {
    title,
    releaseYear,
    ageRestriction,
    duration,
    description,
    type,
    nrOfSeasons,
    onPlayMediaPressed
  } = props;

  return (
    <View>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.headerContainer}>
        <Text style={styles.metaInfoText}>{releaseYear}</Text>
        <Text style={styles.age}>{ageRestriction}</Text>
        <Text style={styles.metaInfoText}>{type === "MOVIE" ? `${duration}min` : `${nrOfSeasons} seasons`}</Text>
      </View>

      <Pressable
        style={styles.playButton}
        onPress={() => onPlayMediaPressed()}
      >
        <FontAwesome name="play" size={20} color="black" />
        <Text style={{ fontWeight: '600' }}>Play</Text>
      </Pressable>

      <Text style={{ color: 'white' }}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  headerContainer: {
    flexDirection: 'row',
    gap: 5
  },
  metaInfoText: {
    color: 'white',
    fontSize: 12
  },
  age: {
    color: 'white',
    fontSize: 9,
    padding: 2,
    backgroundColor: '#636363',
    borderRadius: 2
  },
  playButton: {
    backgroundColor: 'lightgrey',
    borderRadius: 3,
    padding: 7,
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
    alignItems: 'center'
  }
});