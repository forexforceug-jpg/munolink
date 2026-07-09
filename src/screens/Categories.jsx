import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Categories({ navigation }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = ['All', 'Products', 'Services', 'Shops'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch shops
      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('is_verified', true)
        .order('rating', { ascending: false })
        .limit(10);

      if (shopData) setShops(shopData);

      // Fetch products
      const { data: spData } = await supabase
        .from('shop_products')
        .select('id, shop_id, catalog_id, regular_price, in_stock')
        .eq('in_stock', true)
        .limit(30);

      if (spData && spData.length > 0) {
        const catalogIds = [...new Set(spData.map(p => p.catalog_id))];
        const shopIds = [...new Set(spData.map(p => p.shop_id))];

        const { data: catalogData } = await supabase
          .from('catalog')
          .select('id, name, category, images')
          .in('id', catalogIds);

        const { data: shopInfoData } = await supabase
          .from('shops')
          .select('id, name, rating, distance, discount_percentage')
          .in('id', shopIds);

        const catalogMap = {};
        if (catalogData) catalogData.forEach(c => { catalogMap[c.id] = c; });

        const shopMap = {};
        if (shopInfoData) shopInfoData.forEach(s => { shopMap[s.id] = s; });

        const productList = spData.map(p => {
          const catalog = catalogMap[p.catalog_id];
          const shop = shopMap[p.shop_id];
          if (!catalog || !shop) return null;
          const dp = shop.discount_percentage || 10;
          const mp = Math.round(Number(p.regular_price) * (1 - dp / 100));
          return {
            id: p.id,
            shopId: shop.id,
            name: catalog.name,
            category: catalog.category,
            images: catalog.images || [],
            regularPrice: Number(p.regular_price),
            munolinkPrice: mp,
            savings: Number(p.regular_price) - mp,
            discount: dp,
            shopName: shop.name,
            shopRating: Number(shop.rating || 4.0),
            shopDistance: shop.distance || '1.0 km',
          };
        }).filter(Boolean);

        setProducts(productList);
      }
    } catch (error) {
      console.error('fetchData error:', error);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shopName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetails', {
      productId: product.id,
      shopId: product.shopId,
    });
  };

  const handleShopPress = (shop) => {
    navigation.navigate('ShopProfile', { shopId: shop.id });
  };

  const handleAddToCart = (product) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to add items to your cart.');
      return;
    }
    addToCart({
      id: product.id,
      shopId: product.shopId,
      productName: product.name,
      category: product.category,
      regularPrice: product.regularPrice,
      munolinkPrice: product.munolinkPrice,
      savings: product.savings,
      images: product.images,
    }, product.shopId, product.shopName);
    Alert.alert('Added!', `${product.name} added to cart`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.logo}>MUNOLINK</Text>
          <Text style={styles.tagline}>For Better Connections</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MyCart')}>
            <View style={styles.cartBtn}>
              <Ionicons name="cart-outline" size={20} color="#006B3F" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.pageTitle}>Discover</Text>
        <Text style={styles.pageSubtitle}>Products and shops near you.</Text>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products, shops..."
              placeholderTextColor="#CCCCCC"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#CCC" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#006B3F" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {/* Products Grid (show for All, Products tabs) */}
            {(activeTab === 'All' || activeTab === 'Products') && filteredProducts.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Products Near You</Text>
                  <Text style={styles.sectionCount}>{filteredProducts.length} items</Text>
                </View>
                <View style={styles.productGrid}>
                  {filteredProducts.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.productCard}
                      onPress={() => handleProductPress(product)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.productImage}>
                        {product.images && product.images.length > 0 ? (
                          <Image source={{ uri: product.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        ) : (
                          <Ionicons name="cube-outline" size={28} color="#006B3F" />
                        )}
                        {product.discount > 0 && (
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{product.discount}% OFF</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                      <Text style={styles.productShop} numberOfLines={1}>{product.shopName}</Text>
                      <View style={styles.productPriceRow}>
                        <Text style={styles.productPrice}>UGX {product.munolinkPrice.toLocaleString()}</Text>
                        <Text style={styles.productOldPrice}>UGX {product.regularPrice.toLocaleString()}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addToCartBtn}
                        onPress={() => handleAddToCart(product)}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Shops Section (show for All, Shops tabs) */}
            {(activeTab === 'All' || activeTab === 'Shops') && shops.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Shops Near You</Text>
                  <Text style={styles.sectionCount}>{shops.length} shops</Text>
                </View>
                <View style={styles.shopsGrid}>
                  {shops.map((shop) => (
                    <TouchableOpacity
                      key={shop.id}
                      style={styles.shopCard}
                      onPress={() => handleShopPress(shop)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.shopIcon}>
                        <Ionicons name="storefront" size={28} color="#006B3F" />
                      </View>
                      <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
                      <Text style={styles.shopCategory}>{shop.category}</Text>
                      <View style={styles.shopMeta}>
                        <Ionicons name="star" size={11} color="#FFB300" />
                        <Text style={styles.shopRating}>{Number(shop.rating || 0).toFixed(1)}</Text>
                      </View>
                      {shop.is_open && (
                        <View style={styles.openBadge}>
                          <View style={styles.openDot} />
                          <Text style={styles.openText}>Open</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Empty state */}
            {((activeTab === 'All' || activeTab === 'Products') && filteredProducts.length === 0) && (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#CCC" />
                <Text style={styles.emptyText}>No products found</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12,
  },
  headerCenter: { alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 9, color: '#888' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { position: 'relative' },
  notifBadge: {
    position: 'absolute', top: -4, right: -6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
  },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  cartBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#212121', marginLeft: 8 },
  tabsRow: { marginBottom: 18 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F5F5F5', marginRight: 8,
  },
  tabActive: { backgroundColor: '#006B3F' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#FFFFFF' },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 14, color: '#888', marginTop: 10 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, marginTop: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  sectionCount: { fontSize: 12, color: '#888' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  productCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, position: 'relative',
  },
  productImage: {
    width: '100%', height: 100, backgroundColor: '#F5F5F5',
    borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    marginBottom: 8, overflow: 'hidden',
  },
  discountBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: '#006B3F', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  discountText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },
  productName: { fontSize: 12, fontWeight: '700', color: '#212121', marginBottom: 2, lineHeight: 16 },
  productShop: { fontSize: 10, color: '#888', marginBottom: 4 },
  productPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  productPrice: { fontSize: 13, fontWeight: '800', color: '#006B3F' },
  productOldPrice: { fontSize: 11, color: '#AAA', textDecorationLine: 'line-through' },
  addToCartBtn: {
    position: 'absolute', bottom: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  shopsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  shopCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, alignItems: 'center',
  },
  shopIcon: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  shopName: { fontSize: 13, fontWeight: '700', color: '#212121', textAlign: 'center', marginBottom: 2 },
  shopCategory: { fontSize: 10, color: '#888', marginBottom: 4 },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  shopRating: { fontSize: 11, fontWeight: '600', color: '#555' },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  openText: { fontSize: 10, color: '#4CAF50', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: '#888', marginTop: 10 },
});