import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import ShareSheet from '@/components/ShareSheet';
import MediaCover from '@/components/MediaCover';
import { addToWatchlist, ApiMedia, getMedia, getUserWatchlist, likeMedia, removeFromWatchlist, saveMediaProgress } from '@/lib/api';

export default function PlayerScreen() {
  const { t } = useTranslation();
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
  const videoViewRef = useRef<VideoView>(null);

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
    }, 5000);

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
      Alert.alert(t('actionImpossible'), error instanceof Error ? error.message : t('requestFailed'));
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
      Alert.alert(t('watchlistImpossible'), error instanceof Error ? error.message : t('requestFailed'));
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><Pressable style={styles.loadingBack} onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text}/></Pressable><View style={styles.emptyWrap}><LoadingState /></View></SafeAreaView>;
  }

  if (!media || !videoSource) {
    return <SafeAreaView style={styles.container}><Pressable style={styles.loadingBack} onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text}/></Pressable><View style={styles.emptyWrap}><EmptyState title={t('videoUnavailableTitle')} body={t('videoUnavailableBody')} /></View></SafeAreaView>;
  }

  if (media.isAudio) {
    return <AudioPlayer media={media} player={player} duration={duration} currentTime={currentTime} progress={progress} progressWidth={progressWidth} setProgressWidth={setProgressWidth} onSeek={seekFromEvent} onBack={() => router.back()} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoShell}>
        <VideoView
          ref={videoViewRef}
          player={player}
          style={styles.video}
          allowsFullscreen
          allowsPictureInPicture={false}
          nativeControls={false}
          contentFit="contain"
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
            <Pressable style={styles.iconButton} onPress={() => videoViewRef.current?.enterFullscreen()}>
              <Feather name="maximize" size={20} color={colors.text} />
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
          <Text style={styles.playerSubtitle}>{channelLabel(media.type, t)}</Text>

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

function AudioPlayer({ media, player, duration, currentTime, progress, progressWidth, setProgressWidth, onSeek, onBack }: { media: ApiMedia; player: ReturnType<typeof useVideoPlayer>; duration: number; currentTime: number; progress: number; progressWidth: number; setProgressWidth: (width: number) => void; onSeek: (event: GestureResponderEvent) => void; onBack: () => void }) {
  const { t } = useTranslation();
  const skip = (seconds: number) => { player.currentTime = Math.max(0, Math.min(duration, player.currentTime + seconds)); };
  return <SafeAreaView style={styles.audioContainer}>
    <VideoView player={player} style={styles.hiddenAudio} nativeControls={false} />
    <View style={styles.audioHeader}><Pressable onPress={onBack}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable><Text style={styles.audioHeaderTitle}>{t('audioPlayer')}</Text><Feather name="more-vertical" size={24} color={colors.text} /></View>
    <View style={styles.audioContent}>
      <Text style={styles.audioTitle} numberOfLines={2}>{media.title}</Text><Text style={styles.audioAuthor}>{media.author || media.username || 'TALA+'}</Text>
      <MediaCover uri={media.thumbnail} isAudio style={styles.audioCover} />
      <View style={styles.audioProgress} onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={onSeek} onResponderMove={onSeek}><View style={[styles.audioProgressFill, { width: `${progress * 100}%` }]} /><View style={[styles.audioThumb, { left: `${progress * 100}%` }]} /></View>
      <View style={styles.times}><Text style={styles.audioTime}>{formatTime(currentTime)}</Text><Text style={styles.audioTime}>{formatTime(duration)}</Text></View>
      <View style={styles.audioControls}><Pressable onPress={() => skip(-15)}><Feather name="rotate-ccw" size={32} color={colors.text}/><Text style={styles.skipLabel}>15</Text></Pressable><Pressable style={styles.audioPlay} onPress={() => player.playing ? player.pause() : player.play()}><FontAwesome name={player.playing ? 'pause' : 'play'} size={34} color={colors.background}/></Pressable><Pressable onPress={() => skip(15)}><Feather name="rotate-cw" size={32} color={colors.text}/><Text style={styles.skipLabel}>15</Text></Pressable></View>
      <View style={styles.audioOptions}><Text style={styles.audioOption}>1.0×{`\n`}{t('speed')}</Text><Text style={styles.audioOption}>☷{`\n`}{t('chapters')}</Text><Text style={styles.audioOption}>•••{`\n`}{t('more')}</Text></View>
    </View>
  </SafeAreaView>;
}

function formatTime(totalSeconds: number) {
  const safe = Math.max(Math.floor(totalSeconds), 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  return [hours, minutes, seconds].map((item) => String(item).padStart(2, '0')).join(':');
}

function channelLabel(type: string | undefined, t: (key: string) => string) {
  const labels: Record<string, string> = {
    film_series: t('filmsAndSeries'),
    comedy: t('comedy'),
    music: t('music'),
    education: t('education'),
    business: t('business'),
    crafts_diy: t('crafts'),
    sports: t('simulatedSport'),
    documentary: t('documentaries'),
  };

  return type ? labels[type] ?? type : 'TALA+';
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  emptyWrap: { padding: 16 },
  loadingBack: { padding: 16, alignSelf: 'flex-start' },
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
  audioContainer: { flex: 1, backgroundColor: colors.background },
  hiddenAudio: { width: 1, height: 1, opacity: 0 },
  audioHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  audioHeaderTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  audioContent: { flex: 1, alignItems: 'center', padding: 24, paddingTop: 30 },
  audioTitle: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  audioAuthor: { color: colors.muted, fontSize: 15, fontWeight: '700', marginTop: 7, marginBottom: 30 },
  audioCover: { width: '82%', aspectRatio: 1, borderRadius: 10 },
  audioProgress: { width: '100%', height: 20, justifyContent: 'center', marginTop: 34, backgroundColor: colors.panelLight, borderRadius: 10 },
  audioProgressFill: { height: 5, borderRadius: 5, backgroundColor: colors.primary },
  audioThumb: { position: 'absolute', width: 16, height: 16, marginLeft: -8, borderRadius: 8, backgroundColor: colors.text },
  audioTime: { color: colors.muted, fontWeight: '700' },
  audioControls: { width: '76%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 40 },
  audioPlay: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.text },
  skipLabel: { color: colors.text, fontSize: 11, fontWeight: '900', textAlign: 'center', marginTop: -22 },
  audioOptions: { width: '100%', flexDirection: 'row', justifyContent: 'space-around', marginTop: 46, padding: 18, borderRadius: 12, backgroundColor: colors.panel },
  audioOption: { color: colors.text, textAlign: 'center', fontWeight: '800', lineHeight: 24 },
});
