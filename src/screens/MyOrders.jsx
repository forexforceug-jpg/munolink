import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
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

  const tabs = ['All Orders', 'To Pay', 'Completed', 'Cancelled', 'Refunded'];

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*, shops(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (transactions && transactions.length > 0) {
      const formattedOrders = transactions.map((txn) => ({
        id: txn.reference || txn.id?.toString()?.slice(0, 12),
        shop: txn.shops?.name || 'Shop',
        distance: '0.4 km',
        location: 'Jinja City',
        status: txn.status === 'completed' ? 'Completed' : txn.status === 'pending' ? 'To Pay' : txn.status,
        statusColor: txn.status === 'completed' ? '#4CAF50' : '#F59E0B',
        statusBg: txn.status === 'completed' ? '#E8F5E9' : '#FFF8E1',
        amount: txn.amount?.toLocaleString() || '0',
        date: new Date(txn.created_at).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        items: 1,
        completedDate: txn.status === 'completed' ? 'Completed' : 'Pending',
        rawStatus: txn.status,
      }));
      setOrders(formattedOrders);
    }

    setLoading(false);
  };

  const filteredOrders = activeTab === 'All Orders'
    ? orders
    : orders.filter((order) => order.status === activeTab || order.rawStatus === activeTab.toLowerCase());

  const getStatusIcon = (status) => {
    switch (status) {
      case 'To Pay': return 'time-outline';
      case 'Completed': return 'checkmark-circle-outline';
      case 'Cancelled': return 'close-circle-outline';
      case 'Refunded': return 'refresh-circle-outline';
      default: return 'ellipse-outline';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <View>
            <Text style={styles.logo}>MUNOLINK</Text>
            <Text style={styles.tagline}>Your partner, linked.</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge} />
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
        {/* Title + Search */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.pageTitle}>My Orders</Text>
            <Text style={styles.pageSubtitle}>Track and manage your purchases</Text>
          </View>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color="#888" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search orders..."
              placeholderTextColor="#CCCCCC"
            />
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Summary + Filter */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons name="receipt-outline" size={18} color="#006B3F" />
            <Text style={styles.summaryText}>
              {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
            </Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={16} color="#006B3F" />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Order Cards */}
        {loading ? (
          <Text style={styles.loadingText}>Loading orders...</Text>
        ) : filteredOrders.length === 0 ? (
          <Text style={styles.loadingText}>No orders yet.</Text>
        ) : (
          filteredOrders.map((order, index) => (
            <TouchableOpacity
              key={index}
              style={styles.orderCard}
              onPress={() => navigation.navigate('OrderDetails')}
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
                  <Text style={[styles.statusText, { color: order.statusColor }]}>
                    {order.status}
                  </Text>
                </View>
                <Text style={styles.completedText}>{order.completedDate}</Text>
                <Text style={styles.orderAmount}>UGX {order.amount}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.payNavButton}
          onPress={() => navigation.navigate('PaymentConfirm')}
        >
          <Ionicons name="card-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="pricetag-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Deals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Profile</Text>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 10, color: '#888' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { position: 'relative' },
  notifBadge: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#D32F2F',
  },
  profilePic: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121' },
  pageSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 12, paddingHorizontal: 10, height: 38,
    width: 150, gap: 6, borderWidth: 1, borderColor: '#ECECEC',
  },
  searchInput: { flex: 1, fontSize: 12, color: '#212121' },
  tabsScroll: { marginBottom: 14 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F5F5F5', marginRight: 8,
  },
  tabActive: { backgroundColor: '#006B3F' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#FFFFFF' },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, gap: 6,
  },
  summaryText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, gap: 4,
  },
  filterText: { fontSize: 13, fontWeight: '600', color: '#006B3F' },
  loadingText: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 30 },
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
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  payNavButton: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#006B3F',
    justifyContent: 'center', alignItems: 'center', marginTop: -20,
    shadowColor: '#006B3F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },
});