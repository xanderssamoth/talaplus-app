import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { getCurrentUser } from '@/lib/session';
import { fetchCart, fetchSubscriptions, fetchUserMedias, fetchUserProducts, fetchWatchlist } from '@/lib/profile-api';
import ProductCard from '@/components/ProductCard';
import MediaCover from '@/components/MediaCover';
import UserRow from '@/components/UserRow';

export default function ProfileListScreen() {
  const { t } = useTranslation();
  const { kind, userId } = useLocalSearchParams<{ kind: string; userId?: string }>();
  const id = userId || getCurrentUser().id;
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setBusy(true); setError('');
    const request = kind === 'products' ? fetchUserProducts(id) : kind === 'medias' ? fetchUserMedias(id) : kind === 'watchlist' ? fetchWatchlist(id) : kind === 'cart' ? fetchCart(id).then(result => result.items) : fetchSubscriptions(id).then(result => result.items);
    request.then(setItems).catch(e => setError(e instanceof Error ? e.message : t('requestFailed'))).finally(() => setBusy(false));
  }, [kind, id, t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const title = t(({ products: 'productsServices', medias: 'videosAudios', watchlist: 'watchlist', cart: 'cart', subscriptions: 'subscriptions' } as Record<string, string>)[kind] || 'profile');
  return <SafeAreaView style={styles.container}><View style={styles.header}><Pressable onPress={() => router.back()}><Feather name="arrow-left" size={23} color={colors.text}/></Pressable><Text style={styles.title}>{title}</Text><View style={{ width: 23 }}/></View>{error ? <Pressable onPress={load} style={styles.empty}><Text style={styles.muted}>{error} · {t('retry')}</Text></Pressable> : <FlatList data={items} keyExtractor={(item, index) => String(item.id ?? index)} contentContainerStyle={styles.list} refreshing={busy} onRefresh={load} ListEmptyComponent={!busy ? <Text style={styles.muted}>{t('noContentTitle')}</Text> : null} renderItem={({ item }) => kind === 'products' ? <ProductCard product={item}/> : kind === 'medias' || kind === 'watchlist' ? <Pressable style={styles.row} onPress={() => router.push(`/mediaDetails/${item.id}`)}><MediaCover uri={item.thumbnail} isAudio={item.isAudio} style={styles.thumb}/><View style={styles.body}><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.muted}>{item.isAudio ? t('audio') : t('video')}</Text></View></Pressable> : kind === 'subscriptions' ? <UserRow user={item}/> : <View style={styles.row}>{item.product?.image ? <Image source={{ uri: item.product.image }} style={styles.thumb}/> : null}<View style={styles.body}><Text style={styles.rowTitle}>{item.product?.product_name ?? item.product_name ?? item.name ?? t('product')}</Text><Text style={styles.muted}>{item.quantity ?? 1} × {item.price ?? item.product?.price ?? ''}</Text></View></View>}/>}</SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }, title: { color: colors.text, fontSize: 20, fontWeight: '900' }, list: { padding: 16, paddingBottom: 40 }, empty: { padding: 20 }, muted: { color: colors.muted }, row: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 10, marginBottom: 9, borderRadius: 8, backgroundColor: colors.panel }, thumb: { width: 68, height: 68, borderRadius: 6 }, body: { flex: 1 }, rowTitle: { color: colors.text, fontWeight: '900', marginBottom: 4 } });
