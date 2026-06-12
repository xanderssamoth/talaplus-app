import { useEffect, useMemo, useState } from 'react';
import { Alert, GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import ShareSheet from '@/components/ShareSheet';
import { addToWatchlist, ApiMedia, getMedia, getUserWatchlist, likeMedia, removeFromWatchlist, saveMediaProgress } from '@/lib/api';

export default function PlayerScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const [media, setMedia] = useState<ApiMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [centerIcon, setCenterIcon] = useState<'play' | 'pause' | null>(null);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [progressWidth, setProgressWidth] = useState(1);
  const [volumeWidth, setVolumeWidth] = useState(1);
  const [volumeVisible, setVolumeVisible] = useState(false);
  const [landscapeFit, setLandscapeFit] = useState(false);
  const [liked, setLiked] = useState(false);
  const [watchlisted, setWatchlisted] = useState(false);
  const [titleExpanded, setTitleExpanded] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);

  useEffect(() => {
    if (!params.id) return;

    setLoading(true);
    getMedia(params.id)
      .then(async (nextMedia) => {
        const watchlist = await getUserWatchlist().catch(() => ({ items: [] }));
        setMedia(nextMedia);
        setLiked(Boolean(nextMedia.isLiked));
        setWatchlisted(Boolean(nextMedia.isInWatchlist || watchlist.items.some((item) => item.id === nextMedia.id)));
      })
      .catch(() => setMedia(null))
      .finally(() => setLoading(false));
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
    if (!duration || currentTime < duration - 0.35) return;

    player.pause();
    player.currentTime = 0;
    setCurrentTime(0);
    setCenterIcon(null);
  }, [currentTime, duration, player]);

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
    if (autoHide) {
      setTimeout(() => setCenterIcon(null), 1000);
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

  const seekFromEvent = (event: GestureResponderEvent) => {
    seekFromX(event.nativeEvent.locationX);
  };

  const setVolumeFromX = (x: number) => {
    const next = Math.max(0, Math.min(x / volumeWidth, 1));
    player.volume = next;
    setVolume(next);
  };

  const toggleLike = async () => {
    if (!media) return;
    const next = !liked;
    setLiked(next);
    try {
      await likeMedia(media.id, next ? 'add' : 'remove');
    } catch (error) {
      setLiked(!next);
      Alert.alert('Action impossible', error instanceof Error ? error.message : 'La requête a échoué.');
    }
  };

  const toggleWatchlist = async () => {
    if (!media) return;
    const next = !watchlisted;
    setWatchlisted(next);
    try {
      if (next) {
        await addToWatchlist(media.id);
      } else {
        await removeFromWatchlist(media.id);
      }
    } catch (error) {
      setWatchlisted(!next);
      Alert.alert('Watchlist impossible', error instanceof Error ? error.message : 'La requête a échoué.');
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.emptyWrap}><LoadingState /></View></SafeAreaView>;
  }

  if (!media || !videoSource) {
    return <SafeAreaView style={styles.container}><View style={styles.emptyWrap}><EmptyState title="Vidéo indisponible" body="La vidéo sera lue depuis son URL API dès qu'elle sera disponible." /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoShell}>
        <VideoView
          player={player}
          style={styles.video}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={false}
          contentFit={landscapeFit ? 'cover' : 'contain'}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={togglePlayback} />

        <View style={styles.topOverlay}>
          <Pressable style={styles.roundButton} onPress={() => router.back()}>
            <Feather name="x" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.topControls}>
            <View style={styles.volumeGroup}>
              {volumeVisible && (
                <Pressable style={styles.volumeTrack} onLayout={(event) => setVolumeWidth(event.nativeEvent.layout.width)} onPress={(event) => setVolumeFromX(event.nativeEvent.locationX)}>
                  <View style={[styles.volumeFill, { width: `${volume * 100}%` }]} />
                </Pressable>
              )}
              <Pressable style={styles.iconButton} onPress={() => setVolumeVisible((current) => !current)}>
                <Feather name="volume-2" size={20} color={colors.text} />
              </Pressable>
            </View>
            <Pressable style={[styles.iconButton, landscapeFit && styles.iconButtonActive]} onPress={() => setLandscapeFit((current) => !current)}>
              <Feather name="rotate-cw" size={20} color={landscapeFit ? colors.primary : colors.text} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={togglePlayback}>
              <FontAwesome name={player.playing ? 'pause' : 'play'} size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {centerIcon && (
          <View style={styles.centerControl}>
            <FontAwesome name={centerIcon} size={34} color={colors.background} />
          </View>
        )}

        <View style={styles.sideActions}>
          <PlayerIcon active={liked} filled={liked ? 'heart' : 'heart-o'} outline="heart-o" onPress={toggleLike} />
          <Pressable style={styles.iconButton} onPress={() => setShareVisible(true)}>
            <Feather name="share-2" size={20} color={colors.text} />
          </Pressable>
          <PlayerIcon active={watchlisted} filled={watchlisted ? 'bookmark' : 'bookmark-o'} outline="bookmark-o" onPress={toggleWatchlist} />
        </View>

        <View style={styles.bottomOverlay}>
          <Pressable onPress={() => setTitleExpanded((current) => !current)}>
            <Text style={[styles.playerTitle, titleExpanded && styles.playerTitleExpanded]} numberOfLines={titleExpanded ? undefined : 1}>{media.title}</Text>
          </Pressable>
          <Text style={styles.playerSubtitle}>{channelLabel(media.type)}</Text>

          <View
            style={styles.progressTrack}
            onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={seekFromEvent}
            onResponderMove={seekFromEvent}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
          </View>
          <View style={styles.times}>
            <Text style={styles.time}>{formatTime(Math.max(duration - currentTime, 0))}</Text>
            <Text style={styles.time}>{formatTime(duration)}</Text>
          </View>
        </View>
      </View>
      <ShareSheet visible={shareVisible} entity="media" entityId={media.id} onClose={() => setShareVisible(false)} />
    </SafeAreaView>
  );
}

function PlayerIcon({ active, filled, outline, onPress }: { active: boolean; filled: keyof typeof FontAwesome.glyphMap; outline: keyof typeof FontAwesome.glyphMap; onPress: () => void }) {
  return (
    <Pressable style={styles.iconButton} onPress={onPress}>
      <FontAwesome name={active ? filled : outline} size={20} color={active ? colors.primary : colors.text} />
    </Pressable>
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
    comedy: 'Comédie',
    music: 'Musique',
    education: 'Education',
    business: 'Business',
    crafts_diy: 'Métiers & Bricolage',
    sports: 'Sport Simulé',
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
  topControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sideActions: { position: 'absolute', left: 14, bottom: 122, gap: 12 },
  bottomOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.45)' },
  roundButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  centerControl: { position: 'absolute', alignSelf: 'center', width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.86)' },
  playerTitle: { color: colors.text, fontSize: 20, fontWeight: '900', paddingRight: 8 },
  playerTitleExpanded: { lineHeight: 25 },
  playerSubtitle: { color: colors.text, fontSize: 13, marginTop: 4, marginBottom: 12 },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  iconButtonActive: { backgroundColor: 'rgba(1,94,254,0.16)' },
  volumeGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  volumeTrack: { width: 112, height: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.35)' },
  volumeFill: { height: 6, borderRadius: 6, backgroundColor: colors.text },
  progressTrack: { height: 18, justifyContent: 'center', borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.18)' },
  progressFill: { height: 6, borderRadius: 6, backgroundColor: colors.primary },
  progressThumb: { position: 'absolute', top: 2, width: 14, height: 14, marginLeft: -7, borderRadius: 7, backgroundColor: colors.text },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  time: { color: colors.text, fontSize: 12, fontWeight: '800' },
});
