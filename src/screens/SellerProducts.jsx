import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SellerProducts({ navigation }) {
  const [activeCategory, setActiveCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'All Products', count: 245 },
    { name: 'Medicines', count: 132 },
    { name: 'Health Care', count: 48 },
    { name: 'Baby Care', count: 32 },
    { name: 'Vitamins', count: 18 },
  ];

  const inventorySummary = [
    { label: 'Total Products', value: '245', icon: 'cube-outline', color: '#006B3F', bg: '#E8F5E9' },
    { label: 'In Stock', value: '198', sub: '81% of total', icon: 'checkmark-circle-outline', color: '#1976D2', bg: '#E3F2FD' },
    { label: 'Low Stock', value: '27', sub: 'Needs attention', icon: 'warning-outline', color: '#F57C00', bg: '#FFF3E0' },
    { label: 'Out of Stock', value: '20', sub: 'Unavailable', icon: 'eye-off-outline', color: '#9C27B0', bg: '#F3E5F5' },
  ];

  const products = [
    { id: 1, name: 'Panadol Extra Tablets', desc: 'Pain relief, 24 tablets', category: 'Medicines', sku: 'MED-001', price: '12,500', stock: 45, status: 'In Stock', statusColor: '#4CAF50' },
    { id: 2, name: 'Amoxicillin 500mg', desc: 'Antibiotic, 14 capsules', category: 'Medicines', sku: 'MED-002', price: '18,000', stock: 32, status: 'In Stock', statusColor: '#4CAF50' },
    { id: 3, name: 'Vicks VapoRub', desc: 'Cough & cold relief, 50g', category: 'Health Care', sku: 'HC-001', price: '8,500', stock: 8, status: 'Low Stock', statusColor: '#F57C00' },
    { id: 4, name: 'Pregnacare Original', desc: 'Pregnancy vitamins, 30 tablets', category: 'Vitamins', sku: 'VIT-001', price: '35,000', stock: 0, status: 'Out of Stock', statusColor: '#D32F2F' },
    { id: 5, name: 'Huggies Baby Wipes', desc: 'Gentle clean, 64 wipes', category: 'Baby Care', sku: 'BC-001', price: '6,500', stock: 56, status: 'In Stock', statusColor: '#4CAF50' },
    { id: 6, name: 'Dettol Antiseptic Liquid', desc: 'First aid, 250ml', category: 'Health Care', sku: 'HC-002', price: '15,000', stock: 3, status: 'Low Stock', statusColor: '#F57C00' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu-outline" size={26} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.logo}>MUNOLINK</Text>
          <Text style={styles.tagline}>For Better Connections</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>5</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity>
            <View style={styles.profilePic}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.pageTitle}>Products</Text>
            <Text style={styles.pageSubtitle}>Manage and organize all your shop products.</Text>
          </View>
 <TouchableOpacity
  style={styles.addProductBtn}
  onPress={() => navigation.navigate('AddProduct')}
>
  <Ionicons name="add" size={18} color="#FFFFFF" />
  <Text style={styles.addProductText}>Add Product</Text>
  <Ionicons name="chevron-down" size={14} color="#FFFFFF" />
</TouchableOpacity>
        </View>

        {/* Search + Actions */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, SKU, or category..."
              placeholderTextColor="#CCCCCC"
            />
          </View>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="options-outline" size={18} color="#006B3F" />
            <Text style={styles.actionBtnText}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="swap-vertical-outline" size={18} color="#006B3F" />
            <Text style={styles.actionBtnText}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.name}
              style={[styles.categoryTab, activeCategory === cat.name && styles.categoryTabActive]}
              onPress={() => setActiveCategory(cat.name)}
            >
              <Text style={[styles.categoryTabText, activeCategory === cat.name && styles.categoryTabTextActive]}>
                {cat.name} ({cat.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Inventory Summary */}
        <View style={styles.inventoryRow}>
          {inventorySummary.map((item, index) => (
            <View key={index} style={[styles.inventoryCard, { borderLeftColor: item.color }]}>
              <View style={[styles.inventoryIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={16} color={item.color} />
              </View>
              <Text style={styles.inventoryValue}>{item.value}</Text>
              <Text style={styles.inventoryLabel}>{item.label}</Text>
              {item.sub && <Text style={styles.inventorySub}>{item.sub}</Text>}
            </View>
          ))}
        </View>

        {/* All Products Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Products (245)</Text>
          <View style={styles.sectionActions}>
            <TouchableOpacity style={styles.sectionActionBtn}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#888" />
              <Text style={styles.sectionActionText}>Select</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sectionActionBtn}>
              <Ionicons name="layers-outline" size={16} color="#888" />
              <Text style={styles.sectionActionText}>Bulk</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewToggleBtn}>
              <Ionicons name="list-outline" size={16} color="#006B3F" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Product List */}
        {products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <View style={styles.productImage}>
              <Ionicons name="cube-outline" size={24} color="#006B3F" />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDesc}>{product.desc}</Text>
              <View style={styles.productMeta}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{product.category}</Text>
                </View>
                <Text style={styles.productSku}>SKU: {product.sku}</Text>
              </View>
            </View>
            <View style={styles.productRight}>
              <Text style={styles.productPrice}>UGX {product.price}</Text>
              <Text style={styles.productStock}>Stock: {product.stock}</Text>
              <View style={[styles.statusBadge, { backgroundColor: product.statusColor + '15' }]}>
                <View style={[styles.statusDot, { backgroundColor: product.statusColor }]} />
                <Text style={[styles.statusText, { color: product.statusColor }]}>
                  {product.status}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.menuBtn}>
              <Ionicons name="ellipsis-vertical" size={18} color="#888" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Pagination */}
        <View style={styles.pagination}>
          <TouchableOpacity style={styles.pageBtn}>
            <Ionicons name="chevron-back" size={16} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pageNum, styles.pageNumActive]}>
            <Text style={[styles.pageNumText, styles.pageNumTextActive]}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pageNum}>
            <Text style={styles.pageNumText}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pageNum}>
            <Text style={styles.pageNumText}>3</Text>
          </TouchableOpacity>
          <Text style={styles.pageDots}>...</Text>
          <TouchableOpacity style={styles.pageNum}>
            <Text style={styles.pageNumText}>12</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pageBtn}>
            <Ionicons name="chevron-forward" size={16} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Seller Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ShopOwnerDashboard')}>
          <Ionicons name="grid-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="cube" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Products</Text>
        </TouchableOpacity>
<TouchableOpacity
  style={styles.navItem}
  onPress={() => navigation.navigate('SellerOrders')}
>
  <View style={styles.navIconWrapper}>
    <Ionicons name="receipt-outline" size={22} color="#888" />
    <View style={styles.navBadge}>
      <Text style={styles.navBadgeText}>5</Text>
    </View>
  </View>
  <Text style={styles.navLabel}>Orders</Text>
</TouchableOpacity>
<TouchableOpacity
  style={styles.navItem}
  onPress={() => navigation.navigate('SellerWallet')}
>
  <Ionicons name="wallet-outline" size={22} color="#888" />
  <Text style={styles.navLabel}>Wallet</Text>
</TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Account</Text>
        </TouchableOpacity>
      </View>
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
  profilePic: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121' },
  pageSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  addProductBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 22, gap: 6,
  },
  addProductText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#212121', marginLeft: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 14, paddingHorizontal: 12, gap: 4,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#006B3F' },
  categoriesScroll: { marginBottom: 16 },
  categoryTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFFFFF', marginRight: 8, borderWidth: 1, borderColor: '#E0E0E0',
  },
  categoryTabActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  categoryTabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  categoryTabTextActive: { color: '#FFFFFF' },
  inventoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  inventoryCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12,
    borderLeftWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  inventoryIcon: {
    width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  inventoryValue: { fontSize: 18, fontWeight: '800', color: '#212121', marginBottom: 2 },
  inventoryLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  inventorySub: { fontSize: 10, color: '#006B3F', fontWeight: '600', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionActionText: { fontSize: 12, color: '#888', fontWeight: '500' },
  viewToggleBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  productCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  productImage: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 2 },
  productDesc: { fontSize: 11, color: '#888', marginBottom: 6 },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryPill: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  categoryPillText: { fontSize: 9, fontWeight: '700', color: '#006B3F' },
  productSku: { fontSize: 10, color: '#AAA' },
  productRight: { alignItems: 'flex-end', marginRight: 8 },
  productPrice: { fontSize: 15, fontWeight: '800', color: '#006B3F', marginBottom: 2 },
  productStock: { fontSize: 11, color: '#888', marginBottom: 4 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  menuBtn: { padding: 4 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 8 },
  pageBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
  },
  pageNum: {
    width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  pageNumActive: { backgroundColor: '#006B3F' },
  pageNumText: { fontSize: 13, fontWeight: '600', color: '#888' },
  pageNumTextActive: { color: '#FFFFFF' },
  pageDots: { fontSize: 13, color: '#888', marginHorizontal: 2 },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  navItem: { alignItems: 'center', gap: 2 },
  navIconWrapper: { position: 'relative' },
  navBadge: {
    position: 'absolute', top: -4, right: -6,
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
  },
  navBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
});