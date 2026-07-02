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

export default function SellerOrders({ navigation }) {
  const [activeStatus, setActiveStatus] = useState('All Orders');
  const [searchQuery, setSearchQuery] = useState('');

  const statusTabs = [
    { name: 'All Orders', count: 56 },
    { name: 'Pending', count: 12 },
    { name: 'Confirmed', count: 15 },
    { name: 'On the Way', count: 10 },
    { name: 'Delivered', count: 16 },
    { name: 'Cancelled', count: 3 },
  ];

  const performanceCards = [
    { label: "Today's Orders", value: '8', trend: '↑ 14% vs yesterday', icon: 'receipt-outline' },
    { label: "Today's Sales", value: 'UGX 248,600', trend: '↑ 18% vs yesterday', icon: 'cash-outline' },
    { label: 'Avg Order Value', value: 'UGX 31,075', trend: '↑ 5% vs last week', icon: 'trending-up-outline' },
    { label: 'Rating', value: '4.8 ⭐', trend: '247 reviews', icon: 'star-outline' },
  ];

  const orders = [
    {
      id: '#MUNO-0629-001',
      date: '29 June 2026',
      time: '14:32',
      customer: 'Sarah N.',
      phone: '+256 772 345 678',
      address: 'Nile View Road, Jinja',
      items: 3,
      amount: 'UGX 24,500',
      paymentStatus: 'Paid',
      status: 'Pending',
      statusColor: '#F59E0B',
      statusBg: '#FFF8E1',
    },
    {
      id: '#MUNO-0629-002',
      date: '29 June 2026',
      time: '13:15',
      customer: 'Brian K.',
      phone: '+256 751 234 567',
      address: 'Main Street, Jinja',
      items: 2,
      amount: 'UGX 18,000',
      paymentStatus: 'Paid',
      status: 'Confirmed',
      statusColor: '#1976D2',
      statusBg: '#E3F2FD',
    },
    {
      id: '#MUNO-0629-003',
      date: '29 June 2026',
      time: '11:45',
      customer: 'Diana M.',
      phone: '+256 789 123 456',
      address: 'Market Street, Jinja',
      items: 5,
      amount: 'UGX 32,000',
      paymentStatus: 'Paid',
      status: 'On the Way',
      statusColor: '#9C27B0',
      statusBg: '#F3E5F5',
    },
    {
      id: '#MUNO-0628-004',
      date: '28 June 2026',
      time: '16:20',
      customer: 'Ivan T.',
      phone: '+256 701 987 654',
      address: 'Industrial Area, Jinja',
      items: 1,
      amount: 'UGX 12,500',
      paymentStatus: 'Paid',
      status: 'Delivered',
      statusColor: '#4CAF50',
      statusBg: '#E8F5E9',
    },
    {
      id: '#MUNO-0628-005',
      date: '28 June 2026',
      time: '09:10',
      customer: 'Grace A.',
      phone: '+256 765 432 109',
      address: 'Kampala Road, Jinja',
      items: 4,
      amount: 'UGX 45,000',
      paymentStatus: 'Pending',
      status: 'Pending',
      statusColor: '#F59E0B',
      statusBg: '#FFF8E1',
    },
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
            <Text style={styles.pageTitle}>Orders</Text>
            <Text style={styles.pageSubtitle}>Manage and fulfil customer orders.</Text>
          </View>
          <TouchableOpacity style={styles.newOrderBtn}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.newOrderText}>New Order</Text>
          </TouchableOpacity>
        </View>

        {/* Status Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll}>
          {statusTabs.map((tab) => (
            <TouchableOpacity
              key={tab.name}
              style={[styles.statusTab, activeStatus === tab.name && styles.statusTabActive]}
              onPress={() => setActiveStatus(tab.name)}
            >
              <Text style={[styles.statusTabText, activeStatus === tab.name && styles.statusTabTextActive]}>
                {tab.name}
              </Text>
              <Text style={[styles.statusTabCount, activeStatus === tab.name && styles.statusTabCountActive]}>
                {tab.count}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search + Actions */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by order #, customer name, or phone..."
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

        {/* Performance Cards */}
        <View style={styles.perfRow}>
          {performanceCards.map((card, index) => (
            <View key={index} style={styles.perfCard}>
              <View style={styles.perfHeader}>
                <Ionicons name={card.icon} size={16} color="#006B3F" />
                <Text style={styles.perfTrend}>{card.trend}</Text>
              </View>
              <Text style={styles.perfValue}>{card.value}</Text>
              <Text style={styles.perfLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Orders */}
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {orders.map((order, index) => (
          <View key={index} style={styles.orderCard}>
            {/* Order Header */}
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderId}>{order.id}</Text>
                <Text style={styles.orderDate}>{order.date} · {order.time}</Text>
              </View>
              <View style={[styles.orderStatusBadge, { backgroundColor: order.statusBg }]}>
                <Text style={[styles.orderStatusText, { color: order.statusColor }]}>
                  {order.status}
                </Text>
              </View>
            </View>

            {/* Customer Info */}
            <View style={styles.customerRow}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerInitial}>{order.customer.charAt(0)}</Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{order.customer}</Text>
                <Text style={styles.customerPhone}>{order.phone}</Text>
                <Text style={styles.customerAddress}>📍 {order.address}</Text>
              </View>
            </View>

            {/* Product Thumbnails */}
            <View style={styles.orderBottom}>
              <View style={styles.itemsRow}>
                {[...Array(Math.min(order.items, 4))].map((_, i) => (
                  <View key={i} style={styles.itemThumb}>
                    <Ionicons name="cube-outline" size={14} color="#006B3F" />
                  </View>
                ))}
                {order.items > 4 && (
                  <View style={styles.itemThumbMore}>
                    <Text style={styles.itemThumbMoreText}>+{order.items - 4}</Text>
                  </View>
                )}
                <Text style={styles.itemCount}>{order.items} items</Text>
              </View>

              {/* Amount + Menu */}
              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>{order.amount}</Text>
                <View style={[styles.paymentBadge, { backgroundColor: order.paymentStatus === 'Paid' ? '#E8F5E9' : '#FFF8E1' }]}>
                  <Text style={[styles.paymentText, { color: order.paymentStatus === 'Paid' ? '#4CAF50' : '#F59E0B' }]}>
                    {order.paymentStatus}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.menuBtn}>
                <Ionicons name="ellipsis-vertical" size={18} color="#888" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoLeft}>
            <View style={styles.promoIcon}>
              <Ionicons name="bag-handle-outline" size={28} color="#006B3F" />
            </View>
            <View>
              <Text style={styles.promoTitle}>Faster order management</Text>
              <Text style={styles.promoSubtitle}>Payment scanning, receipt printing & delivery tools.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.promoBtn}>
            <Text style={styles.promoBtnText}>View Tools</Text>
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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SellerProducts')}>
          <Ionicons name="cube-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconWrapper}>
            <Ionicons name="receipt" size={22} color="#006B3F" />
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>5</Text>
            </View>
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Orders</Text>
        </TouchableOpacity>
<TouchableOpacity
  style={styles.navItem}
  onPress={() => navigation.navigate('SellerWallet')}
>
  <Ionicons name="wallet-outline" size={22} color="#888" />
  <Text style={styles.navLabel}>Wallet</Text>
</TouchableOpacity>
<TouchableOpacity
  style={styles.navItem}
  onPress={() => navigation.navigate('SellerAccount')}
>
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
  newOrderBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 22, gap: 6,
  },
  newOrderText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  statusScroll: { marginBottom: 14 },
  statusTab: {
    alignItems: 'center', backgroundColor: '#FFFFFF',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, marginRight: 8,
    borderWidth: 1, borderColor: '#E0E0E0', minWidth: 80,
  },
  statusTabActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  statusTabText: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 2 },
  statusTabTextActive: { color: '#FFFFFF' },
  statusTabCount: { fontSize: 16, fontWeight: '800', color: '#212121' },
  statusTabCountActive: { color: '#FFFFFF' },
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
  perfRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  perfCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  perfHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  perfTrend: { fontSize: 10, color: '#4CAF50', fontWeight: '600' },
  perfValue: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 2 },
  perfLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 10 },
  orderCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10,
  },
  orderId: { fontSize: 14, fontWeight: '700', color: '#212121' },
  orderDate: { fontSize: 10, color: '#888', marginTop: 1 },
  orderStatusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  orderStatusText: { fontSize: 11, fontWeight: '700' },
  customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  customerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  customerInitial: { fontSize: 16, fontWeight: '700', color: '#006B3F' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 1 },
  customerPhone: { fontSize: 11, color: '#888' },
  customerAddress: { fontSize: 11, color: '#888', marginTop: 1 },
  orderBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  itemThumb: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
  },
  itemThumbMore: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  itemThumbMoreText: { fontSize: 8, fontWeight: '700', color: '#006B3F' },
  itemCount: { fontSize: 11, color: '#888', fontWeight: '500' },
  orderRight: { alignItems: 'flex-end', marginRight: 8 },
  orderAmount: { fontSize: 15, fontWeight: '800', color: '#006B3F', marginBottom: 4 },
  paymentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  paymentText: { fontSize: 10, fontWeight: '700' },
  menuBtn: { padding: 4 },
  promoBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F5E9', borderRadius: 18, padding: 16, marginTop: 8,
  },
  promoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  promoIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  promoTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },
  promoSubtitle: { fontSize: 11, color: '#666' },
  promoBtn: {
    backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20,
  },
  promoBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
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