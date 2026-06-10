import { VideoPlayer, VideoView } from "expo-video";
import { ImageBackground, Text, View, StyleSheet, ActivityIndicator } from "react-native";
import { useState } from "react";

type MediaHeaderProps = {
  thumbnail: string;
  trailerPlayer: VideoPlayer;
  mediaPlayer: VideoPlayer;
  videoViewRef: React.RefObject<VideoView | null>;
};

export default function MediaHeader(props: MediaHeaderProps) {
  const [isTrailerLoading, setIsTrailerLoading] = useState(true);
  const { thumbnail, trailerPlayer, mediaPlayer, videoViewRef } = props;
  return (
    <View style={styles.container}>
      {isTrailerLoading && (
        <ImageBackground source={{ uri: thumbnail }} style={[StyleSheet.absoluteFill, styles.imageBackground]}>
          <ActivityIndicator size="large" color="white" />
        </ImageBackground>
      )}
      <VideoView
        style={StyleSheet.absoluteFill}
        player={trailerPlayer}
        onFirstFrameRender={() => setIsTrailerLoading(false)}
      />
      <VideoView 
        ref={videoViewRef}
        player={mediaPlayer}
        onFullscreenExit={() => {
          mediaPlayer.pause();
          trailerPlayer.play();
        }}
      />
    </View>
  )
};

const styles = StyleSheet.create({
  container: {
    height: 226,
    width: '100%'
  },
  imageBackground: {
    justifyContent: 'center',
    opacity: 0.6
  },
  closeIcon: {
    zIndex: 3,
    alignSelf: 'flex-end',
    padding: 10
  }
})