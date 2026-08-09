import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import LoadingState from '@/components/LoadingState';
import { colors } from '@/constants/theme';
import MediaCover from '@/components/MediaCover';
import { ApiMedia, ApiProduct, searchApi } from '@/lib/api';

type SearchOverlayProps = {
  visible: boolean;
  onClose: () => void;
  type?: 'media' | 'product';
};

export default function SearchOverlay({ visible, onClose, type = 'media' }: SearchOverlayProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(ApiMedia | ApiProduct)[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timeout = setTimeout(() => {
      const normalized = query.trim();
      if (!normalized) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      searchApi(type, normalized).then(setResults).catch(() => setResults([])).finally(() => setLoading(false));
    }, 280);

    return () => clearTimeout(timeout);
  }, [query, type, visible]);

  const close = () => {
    onClose();
    setQuery('');
    setResults([]);
    setLoading(false);
  };

  const openItem = (item: ApiMedia | ApiProduct) => {
    close();
    router.push(type === 'product' ? `/productDetails/${item.id}` : `/mediaDetails/${item.id}`);
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.searchRow}>
            <Feather name="search" size={20} color={colors.muted} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder={type === 'product' ? t('searchProduct') : t('searchVideo')}
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <Pressable onPress={close}>
              <Feather name="x" size={22} color={colors.text} />
            </Pressable>
          </View>

          {loading && <LoadingState compact />}

          {!loading && results.map((item) => {
            const isProduct = 'name' in item;
            return (
              <Pressable key={item.id} style={styles.result} onPress={() => openItem(item)}>
                {isProduct ? ((item.image) ? <Image source={{ uri: item.image }} style={styles.thumbnail} /> : <View style={styles.thumbnail} />) : <MediaCover uri={item.thumbnail} isAudio={item.isAudio} style={styles.thumbnail} />}
                <View style={styles.resultText}>
                  <Text style={styles.title}>{isProduct ? item.name : item.title}</Text>
                  <Text style={styles.meta}>{isProduct ? item.category : item.category || item.type}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.muted} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, paddingTop: 58, paddingHorizontal: 14, backgroundColor: 'rgba(0,0,0,0.72)' },
  panel: { borderRadius: 8, padding: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 8, paddingHorizontal: 12, backgroundColor: colors.panel },
  input: { flex: 1, color: colors.text, paddingVertical: 13 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  thumbnail: { width: 48, height: 60, borderRadius: 6, backgroundColor: colors.panel },
  resultText: { flex: 1 },
  title: { color: colors.text, fontWeight: '900' },
  meta: { color: colors.muted, marginTop: 3, fontSize: 12 },
});
