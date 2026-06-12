import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import { ApiMedia, getMedia, saveMediaProgress } from '@/lib/api';

export default function PlayerScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const [media, setMedia] = useState<ApiMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [centerIcon, setCenterIcon] = useState<'play' | 'pause' | null>(null);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [progressWidth, setProgressWidth] = useState(1);
  const [volumeWidth, setVolumeWidth] = useState(1);

  useEffect(() => {
    if (params.id) {
      setLoading(true);
      getMedia(params.id).then(setMedia).catch(() => setMedia(null)).finally(() => setLoading(false));
    }
  }, [params.id]);

  const videoSource = media?.videoUrl || '';
  const player = useVideoPlayer(videoSource, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.volume = 1;
    if (videoSource) {
      videoPlayer.play();
    }
  });

  const duration = useMemo(() => media?.duration || player.duration || 0, [media?.duration, player.duration]);
  const progress = duration ? Math.min(currentTime / duration, 1) : 0;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(player.currentTime || 0), 500);
    return () => clearInterval(timer);
  }, [player]);

  useEffect(() => {
    if (!media?.id || !duration) return;

    const timer = setInterval(() => {
      const percentage = duration ? ((player.currentTime || 0) / duration) * 100 : 0;
      saveMediaProgress(media.id, percentage).catch(() => undefined);
    }, 10000);

    return () => clearInterval(timer);
  }, [duration, media?.id, player]);

  const flashIcon = (icon: 'play' | 'pause', autoHide = true) => {
    setCenterIcon(icon);
    setOverlayVisible(true);
    if (autoHide) {
      setTimeout(() => {
        setCenterIcon(null);
        setOverlayVisible(false);
      }, 1000);
    }
  };

  const togglePlayback = () => {
    if (player.playing) {
      player.pause();
      flashIcon('pause', false);
    } else {
      player.play();
      flashIcon('play');
    }
  };

  const seekFromX = (x: number) => {
    if (!duration) return;
    const ratio = Math.max(0, Math.min(x / progressWidth, 1));
    player.currentTime = duration * ratio;
    setCurrentTime(duration * ratio);
  };

  const setVolumeFromX = (x: number) => {
    const next = Math.max(0, Math.min(x / volumeWidth, 1));
    player.volume = next;
    setVolume(next);
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.emptyWrap}><LoadingState /></View></SafeAreaView>;
  }

  if (!media || !videoSource) {
    return <SafeAreaView style={styles.container}><View style={styles.emptyWrap}><EmptyState title="Vid\u00e9o indisponible" body="La vid\u00e9o sera lue depuis son URL API d\u00e8s qu'elle sera disponible." /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.videoShell} onPress={togglePlayback}>
        <VideoView player={player} style={styles.video} allowsFullscreen={false} allowsPictureInPicture={false} nativeControls={false} contentFit="contain" />

        <View style={styles.topOverlay}>
          <Pressable style={styles.roundButton} onPress={() => router.back()}>
            <Feather name="x" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.volumeWrap}>
            <Feather name="volume-2" size={18} color={colors.text} />
            <Pressable style={styles.volumeTrack} onLayout={(event) => setVolumeWidth(event.nativeEvent.layout.width)} onPress={(event) => setVolumeFromX(event.nativeEvent.locationX)}>
              <View style={[styles.volumeFill, { width: `${volume * 100}%` }]} />
            </Pressable>
          </View>
        </View>

        {centerIcon && (
          <View style={styles.centerControl}>
            <FontAwesome name={centerIcon} size={34} color={colors.background} />
          </View>
        )}

        <View style={styles.bottomOverlay}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.playerTitle}>{media.title}</Text>
          </ScrollView>
          <Text style={styles.playerSubtitle}>{channelLabel(media.type)}</Text>
          <Pressable style={styles.progressTrack} onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)} onPress={(event) => seekFromX(event.nativeEvent.locationX)}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
          </Pressable>
          <View style={styles.times}>
            <Text style={styles.time}>{formatTime(Math.max(duration - currentTime, 0))}</Text>
            <Text style={styles.time}>{formatTime(duration)}</Text>
          </View>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

function formatTime(totalSeconds: number) {
  const safe = Math.max(Math.floor(totalSeconds), 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  return [hours, minutes, seconds].map((item) => String(item).padStart(2, '0')).join(':');
}

function channelLabel(type?: string) {
  const labels: Record<string, string> = {
    film_series: 'Films & Series',
    comedy: 'Com\u00e9die',
    music: 'Musique',
    education: 'Education',
    business: 'Business',
    crafts_diy: 'M\u00e9tiers & Bricolage',
    sports: 'Sport Simul\u00e9',
    documentary: 'Documentaires',
  };

  return type ? labels[type] ?? type : 'TALA+';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  emptyWrap: { padding: 16 },
  videoShell: { flex: 1, justifyContent: 'center', backgroundColor: '#000000' },
  video: { ...StyleSheet.absoluteFillObject },
  topOverlay: { position: 'absolute', left: 14, right: 14, top: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bottomOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.45)' },
  roundButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  volumeWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, width: 150, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.5)' },
  volumeTrack: { flex: 1, height: 5, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.35)' },
  volumeFill: { height: 5, borderRadius: 5, backgroundColor: colors.text },
  centerControl: { position: 'absolute', alignSelf: 'center', width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.86)' },
  playerTitle: { color: colors.text, fontSize: 20, fontWeight: '900', paddingRight: 40 },
  playerSubtitle: { color: colors.text, fontSize: 13, marginTop: 4, marginBottom: 12 },
  progressTrack: { height: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.35)' },
  progressFill: { height: 6, borderRadius: 6, backgroundColor: colors.primary },
  progressThumb: { position: 'absolute', top: -4, width: 14, height: 14, marginLeft: -7, borderRadius: 7, backgroundColor: colors.text },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  time: { color: colors.text, fontSize: 12, fontWeight: '800' },
});
