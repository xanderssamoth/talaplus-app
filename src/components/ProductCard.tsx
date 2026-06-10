import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { ApiProduct } from '@/lib/api';

type ProductCardProps = {
  product: ApiProduct;
  wide?: boolean;
};

export default function ProductCard({ product, wide }: ProductCardProps) {
  const discountedPrice = product.reductionRate ? product.price * (1 - product.reductionRate / 100) : product.price;

  return (
    <Pressable style={[styles.card, wide && styles.wide]} onPress={() => router.push(`/productDetails/${product.id}`)}>
      {product.image ? <Image source={{ uri: product.image }} style={[styles.image, wide && styles.wideImage]} /> : <View style={[styles.image, wide && styles.wideImage]} />}
      <View style={styles.cartBadge}>
        <Feather name="shopping-cart" size={15} color={colors.text} />
      </View>
      {!!product.reductionRate && <Text style={styles.discount}>-{product.reductionRate}%</Text>}
      <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
      {!!product.category && <Text style={styles.category} numberOfLines={1}>{product.category}</Text>}
      <View style={styles.priceRow}>
        <Text style={styles.price}>{product.currency} {discountedPrice.toFixed(2)}</Text>
        {!!product.reductionRate && <Text style={styles.oldPrice}>{product.currency} {product.price.toFixed(2)}</Text>}
      </View>
      <Text style={styles.rating}>★ {product.rating?.toFixed(1) ?? '4.5'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    minHeight: 250,
    borderRadius: 8,
    padding: 10,
    marginRight: 12,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  wide: {
    width: 300,
    minHeight: 190,
  },
  image: {
    width: '100%',
    height: 118,
    borderRadius: 8,
    backgroundColor: colors.panelLight,
  },
  wideImage: {
    height: 110,
  },
  cartBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.46)',
  },
  discount: {
    position: 'absolute',
    top: 14,
    left: 14,
    color: colors.background,
    fontWeight: '900',
    backgroundColor: colors.warning,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 10,
  },
  category: {
    color: colors.muted,
    marginTop: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  price: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  oldPrice: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  rating: {
    color: colors.warning,
    marginTop: 8,
    fontWeight: '800',
  },
});
