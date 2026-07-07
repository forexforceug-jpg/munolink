import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function SellerProducts({ navigation }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All Products');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shopId, setShopId] = useState(null);

  const tabs = ['All Products', 'Active', 'Inactive', 'Out of Stock'];

  const loadProducts = useCallback(async () => {
    if (!user?.id) return;
    const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
    if (!shop) { setLoading(false); return; }
    setShopId(shop.id);

    const { data: shopProducts } = await supabase
      .from('shop_products')
      .select('*, catalog(name, category)')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });

    if (shopProducts) {
      setProducts(shopProducts.map(p => ({
        ...p,
        productName: p.catalog?.name || 'Product',
        category: p.catalog?.category || 'General',
      })));
    }
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  const onRefresh = () => { setRefreshing(true); loadProducts(); };

  const toggleStock = async (productId, currentStatus) => {
    const { error } = await supabase.from('shop_products').update({ in_stock: !currentStatus }).eq('id', productId);
    if (!error) setProducts(prev => prev.map(p => p.id === productId ? { ...p, in_stock: !currentStatus } : p));
  };

  const getStatusInfo = (product) => {
    if (!product.in_stock) return { label: 'Inactive', color: '#F57C00', bg: '#FFF3E0' };
    return { label: 'Active', color: '#4CAF50', bg: '#E8F5E9' };
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.productName?.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getStatusInfo(p).label;
    if (activeTab === 'Active') return status === 'Active' && matchesSearch;
    if (activeTab === 'Inactive') return status === 'Inactive' && matchesSearch;
    if (activeTab === 'Out of Stock') return !p.in_stock && matchesSearch;
    return matchesSearch;
  });

  const activeCount = products.filter(p => getStatusInfo(p).label === 'Active').length;
  const inactiveCount = products.filter(p => getStatusInfo(p).label === 'Inactive').length;
  const outStockCount = products.filter(p => !p.in_stock).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity><Ionicons name="menu-outline" size={26} color="#212121" /></TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.logo}>MUNOLINK</Text><Text style={styles.tagline}>For Better Connections</Text></View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}><Ionicons name="notifications-outline" size={24} color="#212121" /><View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SellerAccount')}><View style={styles.profilePic}><Ionicons name="person" size={20} color="#FFFFFF" /><View style={styles.onlineDot} /></View></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#006B3F']} />}>
        <View style={styles.titleRow}>
          <View><Text style={styles.pageTitle}>Products</Text><Text style={styles.pageSubtitle}>Manage and organize all your shop products.</Text></View>
          <TouchableOpacity style={styles.addProductBtn} onPress={() => navigation.navigate('AddProduct')}><Ionicons name="add" size={18} color="#FFFFFF" /><Text style={styles.addProductText}>Add Product</Text></TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}><Ionicons name="search-outline" size={18} color="#888" /><TextInput style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search by name or category..." placeholderTextColor="#CCCCCC" /></View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {tabs.map(tab => {
            const count = tab === 'All Products' ? products.length : tab === 'Active' ? activeCount : tab === 'Inactive' ? inactiveCount : outStockCount;
            return (
              <TouchableOpacity key={tab} style={[styles.categoryTab, activeTab === tab && styles.categoryTabActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.categoryTabText, activeTab === tab && styles.categoryTabTextActive]}>{tab} ({count})</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.inventoryRow}>
          {[
            { label: 'Total Products', value: products.length, icon: 'cube-outline', color: '#006B3F', bg: '#E8F5E9' },
            { label: 'Active', value: activeCount, icon: 'checkmark-circle-outline', color: '#4CAF50', bg: '#E8F5E9' },
            { label: 'Inactive', value: inactiveCount, icon: 'pause-circle-outline', color: '#F57C00', bg: '#FFF3E0' },
            { label: 'Out of Stock', value: outStockCount, icon: 'close-circle-outline', color: '#D32F2F', bg: '#FFEBEE' },
          ].map((item, index) => (
            <View key={index} style={[styles.inventoryCard, { borderLeftColor: item.color }]}>
              <View style={[styles.inventoryIcon, { backgroundColor: item.bg }]}><Ionicons name={item.icon} size={16} color={item.color} /></View>
              <Text style={styles.inventoryValue}>{item.value}</Text>
              <Text style={styles.inventoryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>All Products ({products.length})</Text>

        {loading ? <Text style={styles.loadingText}>Loading products...</Text> : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#CCC" />
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptySubtitle}>Add products from the catalog to start selling.</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('AddProduct')}><Text style={styles.browseBtnText}>Browse Catalog</Text></TouchableOpacity>
          </View>
        ) : (
          filtered.map((product) => {
            const statusInfo = getStatusInfo(product);
            return (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productImage}><Ionicons name="cube-outline" size={24} color="#006B3F" /></View>
                <View style={styles.productInfo}>
                  <View style={styles.productNameRow}><Text style={styles.productName}>{product.productName}</Text><TouchableOpacity style={styles.menuBtn}><Ionicons name="ellipsis-vertical" size={18} color="#888" /></TouchableOpacity></View>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}><View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} /><Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text></View>
                    <View style={styles.categoryBadge}><Text style={styles.categoryText}>{product.category}</Text></View>
                  </View>
                </View>
                <View style={styles.productRight}>
                  <Text style={[styles.productPrice, { color: product.in_stock ? '#006B3F' : '#888' }]}>UGX {product.regular_price?.toLocaleString() || '0'}</Text>
                  <Switch value={product.in_stock} onValueChange={() => toggleStock(product.id, product.in_stock)} trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }} thumbColor={product.in_stock ? '#4CAF50' : '#CCC'} />
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ShopOwnerDashboard')}><Ionicons name="grid-outline" size={22} color="#888" /><Text style={styles.navLabel}>Dashboard</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Ionicons name="cube" size={22} color="#006B3F" /><Text style={[styles.navLabel, styles.navLabelActive]}>Products</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SellerOrders')}><Ionicons name="receipt-outline" size={22} color="#888" /><Text style={styles.navLabel}>Orders</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SellerWallet')}><Ionicons name="wallet-outline" size={22} color="#888" /><Text style={styles.navLabel}>Wallet</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SellerAccount')}><Ionicons name="person-outline" size={22} color="#888" /><Text style={styles.navLabel}>Account</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerCenter: { alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 9, color: '#888' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  profilePic: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121' },
  pageSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  addProductBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 22, gap: 6 },
  addProductText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  searchRow: { marginBottom: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#ECECEC' },
  searchInput: { flex: 1, fontSize: 13, color: '#212121', marginLeft: 8 },
  categoriesScroll: { marginBottom: 16 },
  categoryTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', marginRight: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  categoryTabActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  categoryTabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  categoryTabTextActive: { color: '#FFFFFF' },
  inventoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  inventoryCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  inventoryIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  inventoryValue: { fontSize: 18, fontWeight: '800', color: '#212121', marginBottom: 2 },
  inventoryLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 10 },
  loadingText: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 30 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#555', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  browseBtn: { backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20 },
  browseBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  productImage: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  productInfo: { flex: 1 },
  productNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  productName: { fontSize: 14, fontWeight: '700', color: '#212121' },
  menuBtn: { padding: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  categoryBadge: { backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryText: { fontSize: 10, color: '#888', fontWeight: '500' },
  productRight: { alignItems: 'center', gap: 6 },
  productPrice: { fontSize: 15, fontWeight: '800' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25, borderTopWidth: 1, borderTopColor: '#F0F0F0', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
});