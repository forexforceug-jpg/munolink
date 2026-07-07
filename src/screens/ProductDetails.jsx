import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function ProductDetails({ navigation, route }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const productId = route?.params?.productId || null;
  const shopId = route?.params?.shopId || null;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [nearbyShops, setNearbyShops] = useState([]);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (productId && shopId) fetchProductData();
    else setLoading(false);
  }, [productId, shopId]);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      const { data: spData, error: spError } = await supabase
        .from('shop_products').select('id, shop_id, catalog_id, regular_price, in_stock, seller_specifications')
        .eq('id', productId).eq('shop_id', shopId).single();
      if (spError || !spData) { setLoading(false); return; }

      const { data: catalogData } = await supabase
        .from('catalog').select('id, name, category, description, images, specifications')
        .eq('id', spData.catalog_id).single();
      const { data: shopData } = await supabase.from('shops').select('*').eq('id', spData.shop_id).single();

      const dp = shopData?.discount_percentage || 10;
      const regularPrice = Number(spData.regular_price);
      const munolinkPrice = Math.round(regularPrice * (1 - dp / 100));

      setProduct({
        id: spData.id, catalogId: spData.catalog_id,
        name: catalogData?.name || 'Product', category: catalogData?.category || 'General',
        description: catalogData?.description || 'No description available.',
        images: catalogData?.images || [], specifications: catalogData?.specifications || {},
        regularPrice, munolinkPrice, savings: regularPrice - munolinkPrice,
        discount: dp, inStock: spData.in_stock,
        features: ['Genuine Product', 'Quality Guaranteed', 'Fast Availability', 'Secure Payment'],
      });
      setShop({
        id: shopData?.id || shopId, name: shopData?.name || 'Shop',
        rating: Number(shopData?.rating || 0), reviewCount: shopData?.review_count || 0,
        distance: shopData?.distance || '0.5 km', isOpen: shopData?.is_open ?? true,
        isPartner: shopData?.is_anchor_partner || false,
        discountPercentage: shopData?.discount_percentage || 10, location: shopData?.address || 'Jinja City',
      });

      const { data: compareData } = await supabase
        .from('shop_products').select('id, shop_id, regular_price, in_stock')
        .eq('catalog_id', spData.catalog_id).eq('in_stock', true).neq('shop_id', spData.shop_id).limit(5);
      if (compareData && compareData.length > 0) {
        const shopIds = [...new Set(compareData.map(c => c.shop_id))];
        const { data: compareShops } = await supabase.from('shops').select('id, name, distance, discount_percentage, rating').in('id', shopIds);
        const shopMap = {}; if (compareShops) compareShops.forEach(s => { shopMap[s.id] = s; });
        const compared = compareData.map(item => {
          const s = shopMap[item.shop_id]; if (!s) return null;
          const sDp = s.discount_percentage || 5;
          return { id: item.id, shopId: s.id, name: s.name, distance: s.distance || '1.0 km', price: Math.round(Number(item.regular_price) * (1 - sDp / 100)), discount: sDp, inStock: item.in_stock, rating: Number(s.rating || 0) };
        }).filter(Boolean);
        compared.sort((a, b) => a.price - b.price);
        setNearbyShops(compared);
      }
    } catch (error) { console.error('fetchProductData error:', error); }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (!user) { Alert.alert('Sign In Required', 'Please sign in to add items to your cart.'); return; }
    addToCart({
      id: product.id, shopId: shop?.id, productName: product.name, category: product.category,
      regularPrice: product.regularPrice, munolinkPrice: product.munolinkPrice,
      savings: product.savings, images: product.images || [],
    }, shop?.id, shop?.name);
    Alert.alert('Added to Cart', `${product.name} added`, [
      { text: 'Continue', style: 'cancel' },
      { text: 'View Cart', onPress: () => navigation.navigate('MyCart') },
    ]);
  };

  const handleViewShop = () => navigation.navigate('ShopProfile', { shopId: shop?.id });
  const handleCompareShopPress = (item) => navigation.navigate('ProductDetails', { productId: item.id, shopId: item.shopId });

  if (loading) {
    return (<View style={styles.container}><View style={styles.header}><View style={styles.headerLeft}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#212121" /></TouchableOpacity><View><Text style={styles.logo}>MUNOLINK</Text><Text style={styles.tagline}>For Better Connections</Text></View></View><View style={{ width: 24 }} /></View><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#006B3F" /><Text style={styles.loadingText}>Loading product...</Text></View></View>);
  }
  if (!product) {
    return (<View style={styles.container}><View style={styles.header}><View style={styles.headerLeft}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#212121" /></TouchableOpacity><View><Text style={styles.logo}>MUNOLINK</Text><Text style={styles.tagline}>For Better Connections</Text></View></View><View style={{ width: 24 }} /></View><View style={styles.loadingContainer}><Ionicons name="cube-outline" size={48} color="#CCC" /><Text style={styles.loadingText}>Product not found</Text></View></View>);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#212121" /></TouchableOpacity><View><Text style={styles.logo}>MUNOLINK</Text><Text style={styles.tagline}>For Better Connections</Text></View></View>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}><Ionicons name="notifications-outline" size={24} color="#212121" /><View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <View style={styles.imageCard}>
            <View style={styles.discountBadge}><Text style={styles.discountText}>{product.discount}% OFF</Text></View>
            {product.images && product.images.length > 0 ? (
              <View>
                <Image source={{ uri: product.images[activeImage] }} style={styles.mainImage} resizeMode="cover" />
                {product.images.length > 1 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnails}>
                    {product.images.map((img, i) => (
                      <TouchableOpacity key={i} onPress={() => setActiveImage(i)} style={[styles.thumb, activeImage === i && styles.thumbActive]}>
                        <Image source={{ uri: img }} style={{ width: 36, height: 36, borderRadius: 8 }} resizeMode="cover" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : (
              <View style={styles.productImage}><Ionicons name="cube-outline" size={56} color="#006B3F" /></View>
            )}
          </View>
          <View style={styles.infoCard}>
            <View style={styles.categoryBadge}><Text style={styles.categoryText}>{product.category}</Text></View>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
            <View style={styles.ratingRow}><Ionicons name="star" size={14} color="#FFB300" /><Text style={styles.rating}>{shop?.rating?.toFixed(1) || '0.0'}</Text><Text style={styles.reviewCount}>({shop?.reviewCount || 0} reviews)</Text></View>
            <View style={styles.priceCard}>
              <View style={styles.priceRow}><Text style={styles.priceLabel}>Regular Price</Text><Text style={styles.regularPrice}>UGX {product.regularPrice.toLocaleString()}</Text></View>
              <View style={styles.priceRow}><Text style={styles.priceLabel}>Munolink Price</Text><Text style={styles.munolinkPrice}>UGX {product.munolinkPrice.toLocaleString()}</Text></View>
              <View style={styles.savingsBadge}><Ionicons name="pricetag" size={12} color="#006B3F" /><Text style={styles.savingsText}>You save UGX {product.savings.toLocaleString()}</Text></View>
            </View>
          </View>
        </View>

        {shop && (
          <View style={styles.shopCard}>
            <View style={styles.shopTopRow}><View style={styles.shopIcon}><Ionicons name="storefront" size={22} color="#006B3F" /></View><View style={styles.shopInfo}><View style={styles.shopNameRow}><Text style={styles.shopName}>{shop.name}</Text>{shop.isPartner && <View style={styles.partnerBadge}><Ionicons name="shield-checkmark" size={10} color="#006B3F" /><Text style={styles.partnerText}>Partner</Text></View>}</View><View style={styles.shopMeta}><Ionicons name="star" size={12} color="#FFB300" /><Text style={styles.shopRating}>{shop.rating.toFixed(1)}</Text><Text style={styles.shopDistance}>· {shop.distance}</Text><View style={styles.openBadge}><View style={[styles.openDot, { backgroundColor: shop.isOpen ? '#4CAF50' : '#D32F2F' }]} /><Text style={[styles.openText, { color: shop.isOpen ? '#4CAF50' : '#D32F2F' }]}>{shop.isOpen ? 'Open' : 'Closed'}</Text></View></View></View><TouchableOpacity style={styles.viewShopBtn} onPress={handleViewShop}><Text style={styles.viewShopText}>View Shop</Text></TouchableOpacity></View>
          </View>
        )}

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About This Product</Text>
          <Text style={styles.aboutText}>{product.description}</Text>
        </View>

        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <View style={styles.aboutSection}><Text style={styles.sectionTitle}>Specifications</Text><View style={styles.specsList}>{Object.entries(product.specifications).map(([k, v]) => (<View key={k} style={styles.specRow}><Text style={styles.specKey}>{k.replace(/_/g, ' ')}</Text><Text style={styles.specValue}>{String(v)}</Text></View>))}</View></View>
        )}

        {nearbyShops.length > 0 && (
          <View style={styles.compareSection}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Compare Prices Nearby</Text></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compareScroll}>
              <View style={[styles.compareCard, styles.compareCardCurrent]}><View style={styles.currentShopBadge}><Text style={styles.currentShopText}>This Shop</Text></View><Text style={styles.compareShopName}>{shop?.name}</Text><Text style={styles.compareDistance}>📍 {shop?.distance}</Text><View style={styles.comparePriceRow}><Text style={styles.comparePrice}>UGX {product.munolinkPrice.toLocaleString()}</Text><Text style={styles.compareDiscount}>{product.discount}% off</Text></View></View>
              {nearbyShops.map((item, i) => (
                <TouchableOpacity key={item.id} style={[styles.compareCard, i === 0 && product.munolinkPrice > item.price && styles.compareCardBest]} onPress={() => handleCompareShopPress(item)} activeOpacity={0.7}>
                  {i === 0 && product.munolinkPrice > item.price && <View style={styles.bestPriceBadge}><Text style={styles.bestPriceText}>Best Price</Text></View>}
                  <Text style={styles.compareShopName}>{item.name}</Text><Text style={styles.compareDistance}>📍 {item.distance}</Text>
                  <View style={styles.comparePriceRow}><Text style={styles.comparePrice}>UGX {item.price.toLocaleString()}</Text><Text style={styles.compareDiscount}>{item.discount}% off</Text></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.actionBar}>
        <View style={styles.actionLeft}><Text style={styles.actionSavings}>Save UGX {product.savings.toLocaleString()}</Text><Text style={styles.actionPrice}>UGX {product.munolinkPrice.toLocaleString()}</Text></View>
        <TouchableOpacity style={styles.saveLaterBtn}><Ionicons name="bookmark-outline" size={18} color="#006B3F" /></TouchableOpacity>
        <TouchableOpacity style={styles.payBtn} onPress={handleAddToCart}>
          <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
          <Text style={styles.payBtnText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 9, color: '#888' },
  headerIcon: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#888', fontWeight: '500' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  topSection: { flexDirection: 'row', gap: 14, marginBottom: 18 },
  imageCard: { width: '48%', backgroundColor: '#F8F8F8', borderRadius: 18, padding: 14, position: 'relative' },
  discountBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#006B3F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, zIndex: 1 },
  discountText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  mainImage: { width: '100%', height: 180, borderRadius: 14, marginTop: 10 },
  productImage: { width: '100%', height: 120, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  thumbnails: { flexDirection: 'row', gap: 8, marginTop: 12 },
  thumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#ECECEC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 6 },
  thumbActive: { borderWidth: 2, borderColor: '#006B3F' },
  infoCard: { flex: 1, justifyContent: 'center' },
  categoryBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
  categoryText: { fontSize: 10, fontWeight: '700', color: '#006B3F' },
  productName: { fontSize: 18, fontWeight: '800', color: '#212121', marginBottom: 4 },
  productDesc: { fontSize: 11, color: '#888', lineHeight: 16, marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  rating: { fontSize: 12, fontWeight: '700', color: '#555' },
  reviewCount: { fontSize: 11, color: '#888' },
  priceCard: { backgroundColor: '#F8F8F8', borderRadius: 12, padding: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  priceLabel: { fontSize: 11, color: '#888' },
  regularPrice: { fontSize: 13, color: '#888', textDecorationLine: 'line-through' },
  munolinkPrice: { fontSize: 18, fontWeight: '800', color: '#006B3F' },
  savingsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6, gap: 4 },
  savingsText: { fontSize: 11, fontWeight: '700', color: '#006B3F' },
  shopCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  shopTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  shopIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  shopInfo: { flex: 1 },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  shopName: { fontSize: 14, fontWeight: '700', color: '#212121' },
  partnerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 2 },
  partnerText: { fontSize: 8, fontWeight: '700', color: '#006B3F' },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  shopRating: { fontSize: 11, fontWeight: '600', color: '#555' },
  shopDistance: { fontSize: 11, color: '#888' },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openText: { fontSize: 10, fontWeight: '600' },
  viewShopBtn: { borderWidth: 1.5, borderColor: '#006B3F', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  viewShopText: { fontSize: 11, fontWeight: '700', color: '#006B3F' },
  aboutSection: { marginBottom: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 8 },
  aboutText: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 12 },
  specsList: { backgroundColor: '#F8F8F8', borderRadius: 12, padding: 12 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  specKey: { fontSize: 12, color: '#888', textTransform: 'capitalize', fontWeight: '500' },
  specValue: { fontSize: 12, fontWeight: '600', color: '#212121' },
  compareSection: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  compareScroll: { marginLeft: -4 },
  compareCard: { width: 145, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginRight: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  compareCardCurrent: { borderColor: '#006B3F', borderWidth: 2, backgroundColor: '#FAFFFA' },
  compareCardBest: { borderColor: '#006B3F', borderWidth: 2 },
  currentShopBadge: { position: 'absolute', top: -8, right: 10, backgroundColor: '#006B3F', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  currentShopText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  bestPriceBadge: { position: 'absolute', top: -8, right: 10, backgroundColor: '#F57C00', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  bestPriceText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  compareShopName: { fontSize: 13, fontWeight: '700', color: '#212121', marginTop: 4, marginBottom: 4 },
  compareDistance: { fontSize: 11, color: '#888', marginBottom: 8 },
  comparePriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  comparePrice: { fontSize: 15, fontWeight: '800', color: '#006B3F' },
  compareDiscount: { fontSize: 10, color: '#D32F2F', fontWeight: '700' },
  actionBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 10, position: 'absolute', bottom: 0, left: 0, right: 0 },
  actionLeft: { flex: 1 },
  actionSavings: { fontSize: 10, color: '#006B3F', fontWeight: '600' },
  actionPrice: { fontSize: 16, fontWeight: '800', color: '#212121' },
  saveLaterBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: '#006B3F', justifyContent: 'center', alignItems: 'center' },
  payBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#006B3F', paddingVertical: 12, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 6 },
  payBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});