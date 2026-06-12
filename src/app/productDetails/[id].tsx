import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import BrandLogo from '@/components/BrandLogo';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import PostMediaCarousel from '@/components/PostMediaCarousel';
import ShareSheet from '@/components/ShareSheet';
import { colors } from '@/constants/theme';
import { ApiPost, ApiProduct, getProduct, getProductComments } from '@/lib/api';

export default function ProductDetailsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [comments, setComments] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareVisible, setShareVisible] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([
        getProduct(id),
        getProductComments(id).catch(() => ({ items: [] })),
      ])
        .then(([nextProduct, commentResult]) => {
          setProduct(nextProduct);
          setComments(commentResult.items);
        })
        .catch(() => setProduct(null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
        </View>
        <View style={styles.emptyWrap}>
          <LoadingState />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
        </View>
        <View style={styles.emptyWrap}>
          <EmptyState title={t('noContentTitle')} body={t('noProducts')} />
        </View>
      </SafeAreaView>
    );
  }

  const discounted = product.reductionRate ? product.price * (1 - product.reductionRate / 100) : product.price;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text} /></Pressable>
          <BrandLogo size="sm" />
          <View style={styles.headerActions}>
            <Pressable onPress={() => setShareVisible(true)}>
              <Feather name="share-2" size={23} color={colors.text} />
            </Pressable>
            <Feather name="shopping-cart" size={24} color={colors.text} />
          </View>
        </View>

        {product.image ? <Image source={{ uri: product.image }} style={styles.image} /> : <View style={styles.image} />}
        <Text style={styles.title}>{product.name}</Text>
        {!!product.category && <Text style={styles.category}>{product.category}</Text>}
        <Text style={styles.rating}>★ {product.rating?.toFixed(1) ?? '4.5'}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{product.currency} {discounted.toFixed(2)}</Text>
          {!!product.reductionRate && <Text style={styles.oldPrice}>{product.currency} {product.price.toFixed(2)}</Text>}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('description')}</Text>
          <Text style={styles.description}>{product.description || t('noProducts')}</Text>
        </View>

        {!!comments.length && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Commentaires</Text>
            {comments.slice(0, 5).map((comment) => (
              <View key={comment.id} style={styles.commentRow}>
                {comment.avatarUrl ? <Image source={{ uri: comment.avatarUrl }} style={styles.commentAvatar} /> : <View style={styles.commentAvatar}><Text style={styles.commentAvatarText}>{comment.author.charAt(0)}</Text></View>}
                <View style={styles.commentBody}>
                  <Text style={styles.commentAuthor}>{comment.author}</Text>
                  <Text style={styles.commentUsername}>@{comment.username}</Text>
                  <Text style={styles.commentText}>{comment.body}</Text>
                  <PostMediaCarousel files={comment.files} compact />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Text style={styles.bottomPrice}>{product.currency} {discounted.toFixed(2)}</Text>
        <Pressable style={styles.cartButton}>
          <Feather name="shopping-cart" size={21} color={colors.text} />
          <Text style={styles.cartText}>Ajouter au panier</Text>
        </Pressable>
      </View>
      <ShareSheet visible={shareVisible} entity="product" entityId={product.id} onClose={() => setShareVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 120 },
  emptyWrap: { padding: 16 },
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  image: { width: '100%', height: 320, borderRadius: 8, backgroundColor: colors.panel },
  title: { color: colors.text, fontSize: 31, fontWeight: '900', marginTop: 20 },
  category: { color: colors.muted, fontSize: 16, marginTop: 8 },
  rating: { color: colors.warning, fontSize: 16, fontWeight: '800', marginTop: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  price: { color: colors.text, fontSize: 32, fontWeight: '900' },
  oldPrice: { color: colors.muted, textDecorationLine: 'line-through', fontSize: 20 },
  infoCard: { borderRadius: 8, padding: 18, marginTop: 24, backgroundColor: colors.panel },
  infoTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  description: { color: colors.text, lineHeight: 24, marginTop: 12 },
  commentRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelLight },
  commentAvatarText: { color: colors.text, fontWeight: '900' },
  commentBody: { flex: 1 },
  commentAuthor: { color: colors.text, fontWeight: '900' },
  commentUsername: { color: colors.muted, fontSize: 12, marginTop: 2 },
  commentText: { color: colors.text, lineHeight: 20, marginTop: 4 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  bottomPrice: { flex: 1, color: colors.text, fontSize: 20, fontWeight: '900' },
  cartButton: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 8, paddingVertical: 15, backgroundColor: colors.primary },
  cartText: { color: colors.text, fontWeight: '900' },
});
