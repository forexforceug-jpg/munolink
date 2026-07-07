import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function ShopProfile({ navigation, route }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const shopId = route?.params?.shopId || null;

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeReview, setActiveReview] = useState(0);

  const reviews = [
    { id: 1, name: 'Sarah K.', initial: 'S', date: '2 days ago', rating: 5, text: 'Very professional service. Great products and the Munolink discount makes it even better!' },
    { id: 2, name: 'David O.', initial: 'D', date: '1 week ago', rating: 5, text: 'Best shop in the area. Always has what I need and the prices are fair.' },
    { id: 3, name: 'Grace N.', initial: 'G', date: '2 weeks ago', rating: 4, text: 'Good products and convenient location. Sometimes busy but worth the wait.' },
  ];

  useEffect(() => { if (shopId) fetchShopData(); else setLoading(false); }, [shopId]);

  const fetchShopData = async () => {
    setLoading(true);
    try {
      const { data: shopData, error: shopError } = await supabase.from('shops').select('*').eq('id', shopId).single();
      if (shopError || !shopData) { setLoading(false); return; }
      setShop(shopData);

      const { data: spData } = await supabase.from('shop_products').select('id, shop_id, catalog_id, regular_price, in_stock, seller_specifications').eq('shop_id', shopId).eq('in_stock', true).limit(10);

      if (spData && spData.length > 0) {
        const catalogIds = [...new Set(spData.map(p => p.catalog_id))];
        const { data: catalogData } = await supabase.from('catalog').select('id, name, category, description, images').in('id', catalogIds);
        const catalogMap = {};
        if (catalogData) catalogData.forEach(c => { catalogMap[c.id] = c; });

        const dp = shopData?.discount_percentage || 10;
        setProducts(spData.map(p => {
          const catalog = catalogMap[p.catalog_id];
          const regularPrice = Number(p.regular_price);
          const munolinkPrice = Math.round(regularPrice * (1 - dp / 100));
          return {
            id: p.id, name: catalog?.name || 'Product', category: catalog?.category || 'General',
            regularPrice, munolinkPrice, savings: regularPrice - munolinkPrice, discount: dp,
            inStock: p.in_stock, specs: p.seller_specifications || {},
            images: catalog?.images || [],
          };
        }));
      } else { setProducts([]); }
    } catch (error) { console.error('fetchShopData error:', error); }
    setLoading(false);
  };

  const handleProductPress = (product) => navigation.navigate('ProductDetails', { productId: product.id, shopId });
  const handleNavigateToShop = () => navigation.navigate('RouteNavigation', { shopId });
  const handleMessageShop = () => {
    if (!user) { Alert.alert('Sign In Required', 'Please sign in to message this shop.'); return; }
    navigation.navigate('Messages', { shopId, shopName: shop?.name });
  };

  const handleAddToCart = (product) => {
    if (!user) { Alert.alert('Sign In Required', 'Please sign in to add items to your cart.'); return; }
    addToCart({
      id: product.id, shopId, productName: product.name, category: product.category,
      regularPrice: product.regularPrice, munolinkPrice: product.munolinkPrice,
      savings: product.savings, images: product.images || [],
    }, shopId, shop?.name);
    Alert.alert('Added!', `${product.name} added to cart`, [
      { text: 'Continue Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => navigation.navigate('MyCart') },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><View style={styles.headerLeft}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#212121" /></TouchableOpacity><View><Text style={styles.logo}>MUNOLINK</Text><Text style={styles.tagline}>For Better Connections</Text></View></View><View style={{ width: 24 }} /></View>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#006B3F" /><Text style={styles.loadingText}>Loading shop...</Text></View>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><View style={styles.headerLeft}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#212121" /></TouchableOpacity><View><Text style={styles.logo}>MUNOLINK</Text><Text style={styles.tagline}>For Better Connections</Text></View></View><View style={{ width: 24 }} /></View>
        <View style={styles.loadingContainer}><Ionicons name="storefront-outline" size={48} color="#CCC" /><Text style={styles.loadingText}>Shop not found</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#212121" /></TouchableOpacity>
          <View><Text style={styles.logo}>MUNOLINK</Text><Text style={styles.tagline}>For Better Connections</Text></View>
        </View>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}><Ionicons name="notifications-outline" size={24} color="#212121" /><View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.shopImageCard}><View style={styles.shopImage}><Ionicons name="storefront" size={48} color="#006B3F" /></View>{shop.is_anchor_partner && <View style={styles.partnerBadge}><Ionicons name="shield-checkmark" size={10} color="#006B3F" /><Text style={styles.partnerBadgeText}>Partner</Text></View>}</View>
          <View style={styles.shopInfo}>
            <View style={styles.shopNameRow}><Text style={styles.shopName}>{shop.name}</Text>{shop.is_anchor_partner && <Ionicons name="checkmark-circle" size={18} color="#006B3F" />}</View>
            <View style={styles.shopMeta}><Ionicons name="star" size={13} color="#FFB300" /><Text style={styles.shopRating}>{Number(shop.rating || 0).toFixed(1)}</Text><Text style={styles.shopReviews}>({shop.review_count || 0} reviews)</Text><Text style={styles.shopCategory}>· {shop.category || 'Shop'}</Text></View>
            <View style={styles.statusRow}><View style={styles.openBadge}><View style={[styles.openDot, { backgroundColor: shop.is_open ? '#4CAF50' : '#D32F2F' }]} /><Text style={[styles.openText, { color: shop.is_open ? '#4CAF50' : '#D32F2F' }]}>{shop.is_open ? 'Open now' : 'Closed'}</Text></View></View>
            <View style={styles.shopLocationRow}><Ionicons name="location-outline" size={12} color="#888" /><Text style={styles.shopDistance}>{shop.distance || '0.5 km'} away · {shop.address || 'Jinja City'}</Text></View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleNavigateToShop}><Ionicons name="navigate-outline" size={18} color="#006B3F" /><Text style={styles.actionBtnText}>Directions</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><Ionicons name="call-outline" size={18} color="#006B3F" /><Text style={styles.actionBtnText}>Call</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleMessageShop}><Ionicons name="chatbubble-outline" size={18} color="#006B3F" /><Text style={styles.actionBtnText}>Message</Text></TouchableOpacity>
        </View>

        {(shop.discount_percentage || 0) > 0 && (
          <View style={styles.discountBanner}><View style={styles.discountLeft}><Ionicons name="pricetag" size={20} color="#006B3F" /><View><Text style={styles.discountTitle}>{shop.discount_percentage}% OFF with Munolink</Text><Text style={styles.discountSubtitle}>Automatic discount at checkout</Text></View></View><TouchableOpacity style={styles.payNowBtn} onPress={() => navigation.navigate('MyCart')}><Text style={styles.payNowText}>Shop Now</Text></TouchableOpacity></View>
        )}

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Products</Text>{products.length > 0 && <TouchableOpacity><Text style={styles.viewAll}>View All ({products.length})</Text></TouchableOpacity>}</View>

        {products.length === 0 ? (
          <View style={styles.emptyProducts}><Ionicons name="cube-outline" size={32} color="#CCC" /><Text style={styles.emptyProductsText}>No products available right now</Text></View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
            {products.map((product) => (
              <TouchableOpacity key={product.id} style={styles.productCard} onPress={() => handleProductPress(product)} activeOpacity={0.7}>
                <View style={styles.productImage}>
                  {product.images && product.images.length > 0 ? (
                    <Image source={{ uri: product.images[0] }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
                  ) : (
                    <Ionicons name="cube-outline" size={30} color="#006B3F" />
                  )}
                </View>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.productCategory}>{product.category}</Text>
                <Text style={styles.productMunolinkPrice}>UGX {product.munolinkPrice.toLocaleString()}</Text>
                <Text style={styles.productRegularPrice}>UGX {product.regularPrice.toLocaleString()}</Text>
                <View style={styles.productSaveBadge}><Text style={styles.productSaveText}>Save {product.savings.toLocaleString()}</Text></View>
                <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToCart(product)}><Ionicons name="add" size={20} color="#FFFFFF" /></TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Customer Reviews</Text><TouchableOpacity><Text style={styles.viewAll}>View All {shop.review_count || 0}</Text></TouchableOpacity></View>
        <View style={styles.reviewsContainer}>
          <View style={styles.ratingSummary}><Text style={styles.ratingBig}>{Number(shop.rating || 0).toFixed(1)}</Text><View style={styles.starsRow}>{[1,2,3,4,5].map(star => <Ionicons key={star} name="star" size={14} color={star <= Math.round(Number(shop.rating || 0)) ? '#FFB300' : '#E0E0E0'} />)}</View><Text style={styles.ratingCount}>{shop.review_count || 0} reviews</Text></View>
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}><View style={styles.reviewerAvatar}><Text style={styles.reviewerInitial}>{reviews[activeReview].initial}</Text></View><View style={{ flex: 1 }}><Text style={styles.reviewerName}>{reviews[activeReview].name}</Text><Text style={styles.reviewDate}>{reviews[activeReview].date}</Text></View></View>
            <Text style={styles.reviewText}>{reviews[activeReview].text}</Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
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
  heroSection: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  shopImageCard: { width: '42%', backgroundColor: '#F5F5F5', borderRadius: 18, padding: 14, alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 140 },
  shopImage: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  partnerBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  partnerBadgeText: { fontSize: 9, fontWeight: '700', color: '#006B3F' },
  shopInfo: { flex: 1, justifyContent: 'center' },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  shopName: { fontSize: 20, fontWeight: '800', color: '#212121', flexShrink: 1 },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6, flexWrap: 'wrap' },
  shopRating: { fontSize: 13, fontWeight: '700', color: '#555' },
  shopReviews: { fontSize: 12, color: '#888' },
  shopCategory: { fontSize: 12, color: '#888' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  openDot: { width: 7, height: 7, borderRadius: 4 },
  openText: { fontSize: 12, fontWeight: '600' },
  shopLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopDistance: { fontSize: 12, color: '#888' },
  actionButtons: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, paddingVertical: 12, gap: 6, borderWidth: 1, borderColor: '#ECECEC' },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  discountBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E8F5E9', borderRadius: 16, padding: 14, marginBottom: 20 },
  discountLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  discountTitle: { fontSize: 14, fontWeight: '800', color: '#006B3F' },
  discountSubtitle: { fontSize: 11, color: '#006B3F', fontWeight: '500' },
  payNowBtn: { backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  payNowText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  viewAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  productsScroll: { marginBottom: 22 },
  productCard: { width: 150, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, position: 'relative' },
  productImage: { width: '100%', height: 80, backgroundColor: '#F5F5F5', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden' },
  productName: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 2, lineHeight: 17 },
  productCategory: { fontSize: 10, color: '#888', marginBottom: 4 },
  productMunolinkPrice: { fontSize: 15, fontWeight: '800', color: '#006B3F' },
  productRegularPrice: { fontSize: 12, color: '#888', textDecorationLine: 'line-through' },
  productSaveBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2 },
  productSaveText: { fontSize: 9, fontWeight: '700', color: '#006B3F' },
  addBtn: { position: 'absolute', bottom: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center' },
  emptyProducts: { alignItems: 'center', paddingVertical: 24, marginBottom: 22, backgroundColor: '#F8F8F8', borderRadius: 14, gap: 6 },
  emptyProductsText: { fontSize: 13, color: '#888' },
  reviewsContainer: { flexDirection: 'row', gap: 14, marginBottom: 22 },
  ratingSummary: { width: '35%' },
  ratingBig: { fontSize: 40, fontWeight: '800', color: '#212121', marginBottom: 4 },
  starsRow: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  ratingCount: { fontSize: 12, color: '#888', marginBottom: 10 },
  reviewCard: { flex: 1, backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  reviewerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center' },
  reviewerInitial: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  reviewerName: { fontSize: 13, fontWeight: '700', color: '#212121' },
  reviewDate: { fontSize: 11, color: '#888' },
  reviewText: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 10 },
});