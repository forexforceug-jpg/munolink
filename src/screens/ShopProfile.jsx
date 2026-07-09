import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LogoImage from '../../assets/logo.png';

const C = {
  primary: '#1F2F5F',
  accent: '#4A7DFF',
  white: '#FFFFFF',
  background: '#F5F6FA',
  border: '#DCE5FF',
  muted: '#8E99B3',
  text: '#1F2F5F',
  success: '#4CAF50',
  danger: '#F44336',
  warning: '#FF9800',
  lightBg: '#EEF3FF',
  greenBg: '#E8F5E9',
};

export default function ShopProfile({ navigation, route }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const shopId = route?.params?.shopId || null;
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeReview, setActiveReview] = useState(0);

  const reviews = [
    { id: 1, name: 'Sarah K.', initial: 'S', date: '2 days ago', rating: 5, text: 'Very professional service. Great products!' },
    { id: 2, name: 'David O.', initial: 'D', date: '1 week ago', rating: 5, text: 'Best shop in the area. Always has what I need.' },
    { id: 3, name: 'Grace N.', initial: 'G', date: '2 weeks ago', rating: 4, text: 'Good products and convenient location.' },
  ];

  useEffect(() => { if (shopId) fetchShopData(); else setLoading(false); }, [shopId]);

  const fetchShopData = async () => {
    setLoading(true);
    const { data: shopData } = await supabase.from('shops').select('*').eq('id', shopId).single();
    if (!shopData) { setLoading(false); return; }
    setShop(shopData);
    const { data: spData } = await supabase.from('shop_products').select('id, shop_id, catalog_id, regular_price, in_stock').eq('shop_id', shopId).eq('in_stock', true).limit(10);
    if (spData?.length) {
      const cIds = [...new Set(spData.map(p => p.catalog_id))];
      const { data: catData } = await supabase.from('catalog').select('id, name, category, images').in('id', cIds);
      const cm = {}; if (catData) catData.forEach(c => { cm[c.id] = c; });
      const dp = shopData?.discount_percentage || 10;
      setProducts(spData.map(p => { const c = cm[p.catalog_id]; const rp = Number(p.regular_price); const mp = Math.round(rp * (1 - dp / 100)); return { id: p.id, name: c?.name || 'Product', category: c?.category || 'General', regularPrice: rp, munolinkPrice: mp, savings: rp - mp, discount: dp, images: c?.images || [] }; }));
    } else setProducts([]);
    setLoading(false);
  };

  const handleAddToCart = (product) => {
    if (!user) { Alert.alert('Sign In Required'); return; }
    addToCart({ id: product.id, shopId, productName: product.name, category: product.category, regularPrice: product.regularPrice, munolinkPrice: product.munolinkPrice, savings: product.savings, images: product.images }, shopId, shop?.name);
    Alert.alert('Added!', `${product.name} added to cart`, [{ text: 'Continue' }, { text: 'View Cart', onPress: () => navigation.navigate('MyCart') }]);
  };

  if (loading) return (<View style={styles.container}><View style={styles.header}><Image source={LogoImage} style={styles.headerLogo} resizeMode="contain" /></View><View style={styles.loadingContainer}><ActivityIndicator size="large" color={C.accent} /></View></View>);
  if (!shop) return (<View style={styles.container}><View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity><Image source={LogoImage} style={styles.headerLogo} resizeMode="contain" /><View style={{width:24}}/></View><View style={styles.loadingContainer}><Ionicons name="storefront-outline" size={48} color={C.muted} /><Text style={{color:C.muted}}>Shop not found</Text></View></View>);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Image source={LogoImage} style={styles.headerLogo} resizeMode="contain" />
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}><Ionicons name="notifications-outline" size={24} color={C.text} /><View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <View style={styles.shopImageCard}><View style={styles.shopImage}><Ionicons name="storefront" size={48} color={C.accent} /></View>{shop.is_anchor_partner && <View style={styles.partnerBadge}><Ionicons name="shield-checkmark" size={10} color={C.accent} /><Text style={styles.partnerBadgeText}>Partner</Text></View>}</View>
          <View style={styles.shopInfo}>
            <View style={styles.shopNameRow}><Text style={styles.shopName}>{shop.name}</Text>{shop.is_anchor_partner && <Ionicons name="checkmark-circle" size={18} color={C.accent} />}</View>
            <View style={styles.shopMeta}><Ionicons name="star" size={13} color="#FFB300" /><Text style={styles.shopRating}>{Number(shop.rating||0).toFixed(1)}</Text><Text style={styles.shopReviews}>({shop.review_count||0})</Text><Text style={styles.shopCategory}>· {shop.category||'Shop'}</Text></View>
            <View style={styles.statusRow}><View style={styles.openBadge}><View style={[styles.openDot,{backgroundColor:shop.is_open?C.success:C.danger}]} /><Text style={[styles.openText,{color:shop.is_open?C.success:C.danger}]}>{shop.is_open?'Open':'Closed'}</Text></View></View>
            <View style={styles.shopLocationRow}><Ionicons name="location-outline" size={12} color={C.muted} /><Text style={styles.shopDistance}>{shop.distance||'0.5 km'} · {shop.address||'Jinja City'}</Text></View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('RouteNavigation',{shopId})}><Ionicons name="navigate-outline" size={18} color={C.accent} /><Text style={styles.actionBtnText}>Directions</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><Ionicons name="call-outline" size={18} color={C.accent} /><Text style={styles.actionBtnText}>Call</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { if(!user){Alert.alert('Sign In Required');return;} navigation.navigate('Messages',{shopId,shopName:shop?.name});}}><Ionicons name="chatbubble-outline" size={18} color={C.accent} /><Text style={styles.actionBtnText}>Message</Text></TouchableOpacity>
        </View>

        {(shop.discount_percentage||0) > 0 && (<View style={styles.discountBanner}><View style={styles.discountLeft}><Ionicons name="pricetag" size={20} color={C.accent} /><View><Text style={styles.discountTitle}>{shop.discount_percentage}% OFF</Text><Text style={styles.discountSubtitle}>Automatic discount at checkout</Text></View></View><TouchableOpacity style={styles.payNowBtn} onPress={()=>navigation.navigate('MyCart')}><Text style={styles.payNowText}>Shop Now</Text></TouchableOpacity></View>)}

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Products</Text><Text style={styles.viewAll}>{products.length} items</Text></View>
        {products.length===0 ? (<View style={styles.emptyProducts}><Ionicons name="cube-outline" size={32} color={C.muted} /><Text style={styles.emptyProductsText}>No products available</Text></View>) : (
          <ScrollView horizontal style={styles.productsScroll}>
            {products.map(p => (
              <TouchableOpacity key={p.id} style={styles.productCard} onPress={()=>navigation.navigate('ProductDetails',{productId:p.id,shopId})}>
                <View style={styles.productImage}>{p.images?.[0]?<Image source={{uri:p.images[0]}} style={{width:'100%',height:'100%',borderRadius:12}}/>:<Ionicons name="cube-outline" size={30} color={C.accent}/>}</View>
                <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
                <Text style={styles.productCategory}>{p.category}</Text>
                <Text style={styles.productMunolinkPrice}>UGX {p.munolinkPrice.toLocaleString()}</Text>
                <Text style={styles.productRegularPrice}>UGX {p.regularPrice.toLocaleString()}</Text>
                <View style={styles.productSaveBadge}><Text style={styles.productSaveText}>Save {p.savings.toLocaleString()}</Text></View>
                <TouchableOpacity style={styles.addBtn} onPress={()=>handleAddToCart(p)}><Ionicons name="add" size={20} color={C.white}/></TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Reviews</Text></View>
        <View style={styles.reviewsContainer}>
          <View style={styles.ratingSummary}><Text style={styles.ratingBig}>{Number(shop.rating||0).toFixed(1)}</Text><View style={styles.starsRow}>{[1,2,3,4,5].map(s=><Ionicons key={s} name="star" size={14} color={s<=Math.round(Number(shop.rating||0))?'#FFB300':'#E0E0E0'}/>)}</View></View>
          <View style={styles.reviewCard}><View style={styles.reviewHeader}><View style={styles.reviewerAvatar}><Text style={styles.reviewerInitial}>{reviews[activeReview].initial}</Text></View><View><Text style={styles.reviewerName}>{reviews[activeReview].name}</Text><Text style={styles.reviewDate}>{reviews[activeReview].date}</Text></View></View><Text style={styles.reviewText}>{reviews[activeReview].text}</Text></View>
        </View>
        <View style={{height:30}}/>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12, backgroundColor: C.white },
  headerLogo: { width: 110, height: 28, resizeMode: 'contain' },
  headerIcon: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: C.danger, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: C.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  heroSection: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  shopImageCard: { width: '42%', backgroundColor: C.white, borderRadius: 18, padding: 14, alignItems: 'center', justifyContent: 'center', minHeight: 140, borderWidth: 1, borderColor: C.border },
  shopImage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  partnerBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: C.lightBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  partnerBadgeText: { fontSize: 9, fontWeight: '700', color: C.accent },
  shopInfo: { flex: 1, justifyContent: 'center' },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  shopName: { fontSize: 20, fontWeight: '800', color: C.text, flexShrink: 1 },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  shopRating: { fontSize: 13, fontWeight: '700', color: '#555' },
  shopReviews: { fontSize: 12, color: C.muted },
  shopCategory: { fontSize: 12, color: C.muted },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  openDot: { width: 7, height: 7, borderRadius: 4 },
  openText: { fontSize: 12, fontWeight: '600' },
  shopLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopDistance: { fontSize: 12, color: C.muted },
  actionButtons: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, borderRadius: 14, paddingVertical: 12, gap: 6, borderWidth: 1, borderColor: C.border },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: C.accent },
  discountBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.lightBg, borderRadius: 16, padding: 14, marginBottom: 20 },
  discountLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  discountTitle: { fontSize: 14, fontWeight: '800', color: C.primary },
  discountSubtitle: { fontSize: 11, color: C.accent, fontWeight: '500' },
  payNowBtn: { backgroundColor: C.accent, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  payNowText: { fontSize: 13, fontWeight: '700', color: C.white },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  viewAll: { fontSize: 13, color: C.accent, fontWeight: '600' },
  productsScroll: { marginBottom: 22 },
  productCard: { width: 150, backgroundColor: C.white, borderRadius: 16, padding: 12, marginRight: 12, borderWidth: 1, borderColor: C.border, position: 'relative' },
  productImage: { width: '100%', height: 80, backgroundColor: C.background, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden' },
  productName: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2, lineHeight: 17 },
  productCategory: { fontSize: 10, color: C.muted, marginBottom: 4 },
  productMunolinkPrice: { fontSize: 15, fontWeight: '800', color: C.primary },
  productRegularPrice: { fontSize: 12, color: C.muted, textDecorationLine: 'line-through' },
  productSaveBadge: { backgroundColor: C.lightBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2 },
  productSaveText: { fontSize: 9, fontWeight: '700', color: C.accent },
  addBtn: { position: 'absolute', bottom: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center' },
  emptyProducts: { alignItems: 'center', paddingVertical: 24, marginBottom: 22, backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  emptyProductsText: { fontSize: 13, color: C.muted },
  reviewsContainer: { flexDirection: 'row', gap: 14, marginBottom: 22 },
  ratingSummary: { width: '35%' },
  ratingBig: { fontSize: 40, fontWeight: '800', color: C.text, marginBottom: 4 },
  starsRow: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  reviewCard: { flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  reviewerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  reviewerInitial: { fontSize: 14, fontWeight: '700', color: C.white },
  reviewerName: { fontSize: 13, fontWeight: '700', color: C.text },
  reviewDate: { fontSize: 11, color: C.muted },
  reviewText: { fontSize: 13, color: '#555', lineHeight: 19 },
});