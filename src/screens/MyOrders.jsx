import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function MyOrders({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All Orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = ['All Orders', 'To Pay', 'Completed', 'Cancelled', 'Refunded'];

  const loadOrders = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*, shops(name, distance, area)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.log('Error loading orders:', error.message);
      setLoading(false);
      return;
    }

    if (transactions && transactions.length > 0) {
      const formattedOrders = transactions.map((txn) => ({
        id: txn.reference || txn.id?.toString()?.slice(0, 12),
        shop: txn.shops?.name || 'Shop',
        distance: txn.shops?.distance || '0.4 km',
        location: txn.shops?.area || 'Jinja City',
        status: txn.status === 'completed' ? 'Completed' : txn.status === 'pending' ? 'To Pay' : txn.status,
        statusColor: txn.status === 'completed' ? '#4CAF50' : txn.status === 'pending' ? '#F59E0B' : '#888',
        statusBg: txn.status === 'completed' ? '#E8F5E9' : txn.status === 'pending' ? '#FFF8E1' : '#F5F5F5',
        amount: txn.amount?.toLocaleString() || '0',
        date: new Date(txn.created_at).toLocaleDateString('en-US', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
        }),
        items: 1,
        completedDate: txn.status === 'completed' ? 'Completed' : txn.status === 'pending' ? 'Awaiting Payment' : txn.status,
        rawStatus: txn.status,
        discount: txn.discount_applied || 0,
        sellerReceived: txn.seller_received || 0,
      }));
      setOrders(formattedOrders);
    } else {
      setOrders([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = activeTab === 'All Orders'
    ? orders.filter((order) => {
        if (!searchQuery) return true;
        return (
          order.shop?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.id?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : orders.filter((order) => {
        const matchesTab = order.status === activeTab || order.rawStatus === activeTab.toLowerCase();
        if (!searchQuery) return matchesTab;
        return matchesTab && (
          order.shop?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.id?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'To Pay': return 'time-outline';
      case 'Completed': return 'checkmark-circle-outline';
      case 'Cancelled': return 'close-circle-outline';
      case 'Refunded': return 'refresh-circle-outline';
      default: return 'ellipse-outline';
    }
  };

  // Calculate totals
  const totalSpent = orders
    .filter((o) => o.rawStatus === 'completed')
    .reduce((sum, o) => sum + (parseInt(o.amount?.replace(/,/g, '')) || 0), 0);

  const totalSaved = orders
    .filter((o) => o.rawStatus === 'completed')
    .reduce((sum, o) => sum + (o.discount || 0), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
  <View style={styles.headerCenter}>
  <View style={styles.headerRow}>
    <Image
      source={require('../../assets/images/logo.png')}
      style={styles.headerLogo}
      resizeMode="contain"
    />
    <Image
      source={require('../../assets/images/logoname.png')}
      style={styles.headerLogo}
      resizeMode="contain"
    />
  </View>
</View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>5</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={styles.profilePic}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
              <View style={styles.onlineDot} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#006B3F']} />}
      >
        {/* Title */}
        <Text style={styles.pageTitle}>My Orders</Text>
        <Text style={styles.pageSubtitle}>Track and manage your purchases</Text>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="receipt-outline" size={16} color="#006B3F" />
            <Text style={styles.statValue}>{orders.length}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={16} color="#006B3F" />
            <Text style={styles.statValue}>UGX {totalSpent.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="pricetag-outline" size={16} color="#006B3F" />
            <Text style={styles.statValue}>UGX {totalSaved.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Saved</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by shop or order ID..."
              placeholderTextColor="#CCCCCC"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#CCC" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
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

        {/* Order Cards */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your orders...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#CCC" />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'All Orders'
                ? 'Your purchases and transactions will appear here.'
                : `No ${activeTab.toLowerCase()} orders.`}
            </Text>
            {activeTab === 'All Orders' && (
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => navigation.navigate('Connections')}
              >
                <Text style={styles.browseBtnText}>Browse Products</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredOrders.map((order, index) => (
            <TouchableOpacity
              key={index}
              style={styles.orderCard}
              onPress={() => navigation.navigate('OrderDetails', { order })}
              activeOpacity={0.7}
            >
              <View style={[styles.statusIconCircle, { backgroundColor: order.statusBg }]}>
                <Ionicons name={getStatusIcon(order.status)} size={22} color={order.statusColor} />
              </View>
              <View style={styles.orderInfo}>
                <View style={styles.orderTopRow}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CCC" />
                </View>
                <Text style={styles.orderShop}>{order.shop}</Text>
                <View style={styles.orderMeta}>
                  <Ionicons name="location-outline" size={10} color="#888" />
                  <Text style={styles.orderMetaText}>{order.distance} · {order.location}</Text>
                </View>
                <View style={styles.thumbnailsRow}>
                  {[...Array(Math.min(order.items, 4))].map((_, i) => (
                    <View key={i} style={styles.thumbnail}>
                      <Ionicons name="cube-outline" size={12} color="#006B3F" />
                    </View>
                  ))}
                </View>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
              <View style={styles.orderRight}>
                <View style={[styles.statusBadge, { backgroundColor: order.statusBg }]}>
                  <Text style={[styles.statusText, { color: order.statusColor }]}>{order.status}</Text>
                </View>
                <Text style={styles.completedText}>{order.completedDate}</Text>
                <Text style={styles.orderAmount}>UGX {order.amount}</Text>
                {order.discount > 0 && (
                  <Text style={styles.savingsText}>Saved UGX {order.discount.toLocaleString()}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyWallet')}>
          <Ionicons name="grid-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar-outline" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Connections')}>
          <Ionicons name="people-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Connections</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Messages')}>
          <Ionicons name="chatbubbles-outline" size={22} color="#888" />
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>3</Text>
          </View>
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
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
  headerLogo: { width: 100, height: 30, marginBottom: 2 },
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
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#FFFFFF',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12,
  },
  statValue: { fontSize: 13, fontWeight: '800', color: '#006B3F', marginTop: 4, marginBottom: 2 },
  statLabel: { fontSize: 9, color: '#888', fontWeight: '500' },
  searchRow: { marginBottom: 14 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, height: 44,
    borderWidth: 1, borderColor: '#ECECEC', boxShadow: 'none'
  },
  searchInput: { flex: 1, fontSize: 13, color: '#212121', outlineStyle: 'none', marginLeft: 8 },
  tabsScroll: { marginBottom: 14 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F5F5F5', marginRight: 8,
  },
  tabActive: { backgroundColor: '#006B3F' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#FFFFFF' },
  loadingContainer: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { fontSize: 14, color: '#888' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#555', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#888', marginBottom: 16, textAlign: 'center' },
  browseBtn: {
    backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20,
  },
  browseBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  orderCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, gap: 12,
  },
  statusIconCircle: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
  },
  orderInfo: { flex: 1 },
  orderTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2,
  },
  orderId: { fontSize: 13, fontWeight: '700', color: '#212121' },
  orderShop: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 2 },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  orderMetaText: { fontSize: 10, color: '#888' },
  thumbnailsRow: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  thumbnail: {
    width: 24, height: 24, borderRadius: 6,
    backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center',
  },
  orderDate: { fontSize: 10, color: '#AAA' },
  orderRight: { alignItems: 'flex-end', justifyContent: 'center', gap: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '700' },
  completedText: { fontSize: 9, color: '#888' },
  orderAmount: { fontSize: 15, fontWeight: '800', color: '#212121' },
  savingsText: { fontSize: 9, color: '#4CAF50', fontWeight: '600' },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  navItem: { alignItems: 'center', gap: 2, position: 'relative' },
  navBadge: {
    position: 'absolute', top: -6, right: 6,
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
  },
  navBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
  headerCenter: {
    // Your existing headerCenter styles
    flex: 2,
    justifyContent: 'left',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'left',
    justifyContent: 'center',
    gap: 1, // spacing between images (iOS 15+, Android)
    // or use marginRight on images for older versions
  },
  headerLogo: {
    width: 100,
    height: 40,
    marginHorizontal: 5,
    // Add margin if not using gap
    // marginHorizontal: 5,
  },
});