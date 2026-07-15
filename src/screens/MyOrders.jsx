import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  Image, RefreshControl, 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import LogoImage from '../../assets/logo.png';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
  orangeBg: '#FFF3E0',
};

export default function MyOrders({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('All Orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = ['All Orders', 'To Pay', 'Completed', 'Cancelled'];

  const loadOrders = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const { data: transactions } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    if (transactions?.length) {
      setOrders(transactions.map(txn => ({
        id: txn.reference || txn.id?.toString()?.slice(0, 12),
        shop: 'Shop',
        distance: '0.5 km',
        location: 'Jinja City',
        status: txn.status === 'completed' ? 'Completed' : txn.status === 'pending' ? 'To Pay' : txn.status || 'Pending',
        statusColor: txn.status === 'completed' ? C.success : txn.status === 'pending' ? C.warning : C.muted,
        statusBg: txn.status === 'completed' ? C.greenBg : txn.status === 'pending' ? C.orangeBg : C.background,
        amount: Number(txn.amount || 0).toLocaleString(),
        date: new Date(txn.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
        items: 1,
        completedDate: txn.status === 'completed' ? 'Completed' : txn.status === 'pending' ? 'Awaiting Payment' : txn.status,
        rawStatus: txn.status,
        discount: Number(txn.discount_applied || 0),
        sellerReceived: Number(txn.seller_received || 0),
      })));
    } else setOrders([]);
    setLoading(false); setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  const onRefresh = () => { setRefreshing(true); loadOrders(); };

  const filteredOrders = activeTab === 'All Orders' ? orders.filter(o => !searchQuery || o.shop?.toLowerCase().includes(searchQuery.toLowerCase()) || o.id?.toLowerCase().includes(searchQuery.toLowerCase())) : orders.filter(o => { const m = o.status === activeTab; return searchQuery ? m && (o.shop?.toLowerCase().includes(searchQuery.toLowerCase()) || o.id?.toLowerCase().includes(searchQuery.toLowerCase())) : m; });

  const getStatusIcon = (status) => {
    switch (status) { case 'To Pay': return 'time-outline'; case 'Completed': return 'checkmark-circle-outline'; case 'Cancelled': return 'close-circle-outline'; default: return 'ellipse-outline'; }
  };

  const totalSpent = orders.filter(o => o.rawStatus === 'completed').reduce((s, o) => s + (parseInt(String(o.amount).replace(/,/g, '')) || 0), 0);
  const totalSaved = orders.filter(o => o.rawStatus === 'completed').reduce((s, o) => s + (o.discount || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image source={LogoImage} style={styles.headerLogo} resizeMode="contain" />
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={24} color={C.text} />
              <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Account')}>
              <View style={styles.profilePic}>
                <Ionicons name="person" size={20} color={C.white} />
                <View style={styles.onlineDot} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 90 + insets.bottom }]} 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.accent]} />}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>My Orders</Text>
          <Text style={styles.pageSubtitle}>Track and manage your purchases</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="receipt-outline" size={16} color={C.accent} />
              <Text style={styles.statValue}>{orders.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash-outline" size={16} color={C.accent} />
              <Text style={styles.statValue}>UGX {totalSpent.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="pricetag-outline" size={16} color={C.accent} />
              <Text style={styles.statValue}>UGX {totalSaved.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={C.muted} />
              <TextInput 
                style={styles.searchInput} 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
                placeholder="Search orders..." 
                placeholderTextColor={C.muted} 
              />
              {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={18} color="#CCC" /></TouchableOpacity>}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            {tabs.map(tab => (
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
            <View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading orders...</Text></View>
          ) : filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#CCC" />
              <Text style={styles.emptyTitle}>No orders found</Text>
            </View>
          ) : filteredOrders.map((order, index) => (
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
                  <Ionicons name="location-outline" size={10} color={C.muted} />
                  <Text style={styles.orderMetaText}>{order.distance} · {order.location}</Text>
                </View>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
              <View style={styles.orderRight}>
                <View style={[styles.statusBadge, { backgroundColor: order.statusBg }]}>
                  <Text style={[styles.statusText, { color: order.statusColor }]}>{order.status}</Text>
                </View>
                <Text style={styles.orderAmount}>UGX {order.amount}</Text>
                {order.discount > 0 && <Text style={styles.savingsText}>Saved UGX {order.discount.toLocaleString()}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FIXED BOTTOM NAVIGATION - paddingBottom applied inline */}
        <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyWallet')}>
            <Ionicons name="wallet-outline" size={22} color={C.muted} />
            <Text style={styles.navLabel}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="calendar" size={22} color={C.accent} />
            <Text style={[styles.navLabel, styles.navLabelActive]}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Connections')}>
            <Ionicons name="people-outline" size={22} color={C.muted} />
            <Text style={styles.navLabel}>Connections</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Messages')}>
            <Ionicons name="chatbubbles-outline" size={22} color={C.muted} />
            <View style={styles.navBadge}><Text style={styles.navBadgeText}>3</Text></View>
            <Text style={styles.navLabel}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Account')}>
            <Ionicons name="person-outline" size={22} color={C.muted} />
            <Text style={styles.navLabel}>Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.white,
  },
  container: { 
    flex: 1, 
    backgroundColor: C.background,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 12, 
    paddingBottom: 12, 
    backgroundColor: C.white,
    zIndex: 10,
  },
  headerLogo: { width: 120, height: 30, resizeMode: 'contain' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: C.danger, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: C.white },
  profilePic: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: C.success, borderWidth: 2, borderColor: C.white },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: 8,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: C.muted, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: C.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border },
  statValue: { fontSize: 13, fontWeight: '800', color: C.primary, marginTop: 4, marginBottom: 2 },
  statLabel: { fontSize: 9, color: C.muted, fontWeight: '500' },
  searchRow: { marginBottom: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 14, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontSize: 13, color: C.text, marginLeft: 8 },
  tabsScroll: { marginBottom: 14 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.white, marginRight: 8, borderWidth: 1, borderColor: C.border },
  tabActive: { backgroundColor: C.accent, borderColor: C.accent },
  tabText: { fontSize: 13, fontWeight: '600', color: C.muted },
  tabTextActive: { color: C.white },
  loadingContainer: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { fontSize: 14, color: C.muted },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.muted, marginTop: 12 },
  orderCard: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border, gap: 12 },
  statusIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  orderInfo: { flex: 1 },
  orderTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  orderId: { fontSize: 13, fontWeight: '700', color: C.text },
  orderShop: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 2 },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  orderMetaText: { fontSize: 10, color: C.muted },
  orderDate: { fontSize: 10, color: C.muted },
  orderRight: { alignItems: 'flex-end', justifyContent: 'center', gap: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '700' },
  orderAmount: { fontSize: 15, fontWeight: '800', color: C.text },
  savingsText: { fontSize: 9, color: C.success, fontWeight: '600' },
  bottomNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    backgroundColor: C.white, 
    paddingVertical: 8,
    paddingHorizontal: 4,
    // paddingBottom removed from here - now applied inline
    borderTopWidth: 1, 
    borderTopColor: C.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  navItem: { alignItems: 'center', gap: 2, position: 'relative', paddingHorizontal: 4 },
  navBadge: { position: 'absolute', top: -6, right: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: C.danger, justifyContent: 'center', alignItems: 'center' },
  navBadgeText: { fontSize: 9, fontWeight: '800', color: C.white },
  navLabel: { fontSize: 10, color: C.muted, fontWeight: '500' },
  navLabelActive: { color: C.accent, fontWeight: '700' },
});