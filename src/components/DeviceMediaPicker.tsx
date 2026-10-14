import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as MediaLibrary from "expo-media-library/legacy";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "@/constants/theme";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import * as VideoThumbnails from "expo-video-thumbnails";

export type DeviceMediaKind = "video" | "audio" | "photo";
export type DeviceMediaFile = { uri: string; name: string; mimeType: string };

const mimeByKind: Record<DeviceMediaKind, string> = {
  video: "video/mp4",
  audio: "audio/mpeg",
  photo: "image/jpeg",
};

export default function DeviceMediaPicker({
  visible,
  kind,
  onClose,
  onSelect,
}: {
  visible: boolean;
  kind: DeviceMediaKind;
  onClose: () => void;
  onSelect: (file: DeviceMediaFile) => void;
}) {
  const { t } = useTranslation();
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [album, setAlbum] = useState<MediaLibrary.Album | null>(null);
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const isExpoGo = Constants.appOwnership === "expo";

  const load = async (selectedAlbum: MediaLibrary.Album | null = null) => {
    setLoading(true);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(false, [
        kind === "photo" ? "photo" : kind,
      ]);
      if (!permission.granted) {
        Alert.alert(t("mediaAccessTitle"), t("mediaAccessBody"));
        return;
      }
      const [nextAlbums, result] = await Promise.all([
        MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true }),
        MediaLibrary.getAssetsAsync({
          first: 120,
          album: selectedAlbum ?? undefined,
          mediaType:
            kind === "photo"
              ? MediaLibrary.MediaType.photo
              : kind === "video"
                ? MediaLibrary.MediaType.video
                : MediaLibrary.MediaType.audio,
          sortBy: [MediaLibrary.SortBy.creationTime],
        }),
      ]);
      setAlbums(nextAlbums);
      setAssets(result.assets);
      setAlbum(selectedAlbum);
    } catch {
      Alert.alert(t("mediaAccessTitle"), t("mediaAccessBody"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) load();
  }, [visible, kind]);
  const select = (asset: MediaLibrary.Asset) => {
    onSelect({
      uri: asset.uri,
      name: asset.filename || `talaplus-${kind}-${Date.now()}`,
      mimeType: mimeByKind[kind],
    });
    onClose();
  };
  const icon =
    kind === "audio" ? "music" : kind === "video" ? "video" : "image";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>
            {t(
              kind === "video"
                ? "chooseVideo"
                : kind === "audio"
                  ? "chooseAudio"
                  : "choosePhoto",
            )}
          </Text>
          <Pressable onPress={() => load(album)}>
            <Feather name="refresh-cw" size={21} color={colors.text} />
          </Pressable>
        </View>
        {isExpoGo ? (
          <View style={styles.buildNotice}>
            <Feather name="smartphone" size={32} color={colors.primary} />
            <Text style={styles.buildTitle}>{t("mediaDevBuildTitle")}</Text>
            <Text style={styles.buildText}>{t("mediaDevBuildBody")}</Text>
          </View>
        ) : (
          <>
            <FlatList
              horizontal
              style={styles.albumList}
              data={[null, ...albums]}
              keyExtractor={(item, index) => item?.id ?? `all-${index}`}
              contentContainerStyle={styles.albums}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.album,
                    item?.id === album?.id && styles.albumActive,
                  ]}
                  onPress={() => load(item)}
                >
                  <Text style={styles.albumText} numberOfLines={1}>
                    {item ? item.title : t("recent")}
                  </Text>
                </Pressable>
              )}
            />
            <FlatList
              data={assets}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.grid}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Feather name={icon} size={42} color={colors.primary} />
                  <Text style={styles.emptyText}>
                    {loading ? t("loadingMedia") : t("noMediaFound")}
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <Pressable style={styles.asset} onPress={() => select(item)}>
                  {kind === "photo" ? (
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.assetImage}
                    />
                  ) : kind === "video" ? (
                    <VideoThumbnail uri={item.uri} name={item.filename} />
                  ) : (
                    <View style={styles.assetFallback}>
                      <Feather name={icon} size={30} color={colors.primary} />
                      <Text style={styles.assetName} numberOfLines={2}>
                        {item.filename}
                      </Text>
                    </View>
                  )}
                </Pressable>
              )}
            />
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function VideoThumbnail({ uri, name }: { uri: string; name: string }) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    VideoThumbnails.getThumbnailAsync(uri, { time: 1000 })
      .then((result) => { if (active) setThumbnail(result.uri); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [uri]);

  return thumbnail ? (
    <View style={styles.videoPreview}>
      <Image source={{ uri: thumbnail }} style={styles.assetImage} />
      <View style={styles.playBadge}><Feather name="play" size={14} color={colors.text} /></View>
    </View>
  ) : (
    <View style={styles.assetFallback}>
      <Feather name="video" size={30} color={colors.primary} />
      <Text style={styles.assetName} numberOfLines={2}>{name}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 64,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: "900" },
  albumList: { flexGrow: 0, minHeight: 68, maxHeight: 68 },
  albums: { gap: 10, paddingHorizontal: 12, paddingVertical: 11 },
  album: {
    minWidth: 100,
    maxWidth: 220,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.panel,
  },
  albumActive: { backgroundColor: colors.primary },
  albumText: { color: colors.text, fontSize: 13, fontWeight: "800" },
  grid: { padding: 4 },
  asset: { width: "33.33%", aspectRatio: 1, padding: 4 },
  assetImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: colors.panelLight,
  },
  assetFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.panelLight,
  },
  assetName: { color: colors.muted, textAlign: "center", fontSize: 10 },
  videoPreview: { flex: 1, borderRadius: 8, overflow: "hidden" },
  playBadge: { position: "absolute", right: 7, bottom: 7, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.7)" },
  empty: { width: "100%", alignItems: "center", gap: 12, paddingTop: 80 },
  emptyText: { color: colors.muted },
  buildNotice: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 30,
  },
  buildTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  buildText: { color: colors.muted, lineHeight: 21, textAlign: "center" },
});
