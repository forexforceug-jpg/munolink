import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ShopOwnerDashboard({ navigation }) {
  const { user, login } = useAuth();
  const [shop, setShop] = useState(null);
  const [stats, setStats] = useState({ todaySales: 0, orders: 0, pendingOrders: 0, customers: 0, rating: 0, reviews: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Get shop data
    const { data: shopData } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (shopData) {
      setShop(shopData);
      login({ ...user, shopId: shopData.id, walletBalance: shopData.wallet_balance });

      // Get today's transactions
      const today = new Date().toISOString().split('T')[0];
      const { data: todayTxns } = await supabase
        .from('transactions')
        .select('*')
        .eq('shop_id', shopData.id)
        .gte('created_at', today)
        .order('created_at', { ascending: false });

      const todayTotal = todayTxns?.reduce((sum, t) => sum + (t.seller_received || t.amount || 0), 0) || 0;
      const todayCount = todayTxns?.length || 0;
      const pendingCount = todayTxns?.filter(t => t.status === 'pending').length || 0;

      // Get total customer count
      const { count: customerCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopData.id);

      setStats({
        todaySales: todayTotal,
        orders: todayCount,
        pendingOrders: pendingCount,
        customers: customerCount || 0,
        rating: shopData.rating || 0,
        reviews: shopData.review_count || 0,
      });

      // Get recent orders
      const { data: recentTxns } = await supabase
        .from('transactions')
        .select('*, users(full_name, phone_number)')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const formatted = (recentTxns || []).map((txn) => ({
        id: txn.reference || txn.id?.toString()?.slice(0, 12),
        customer: txn.users?.full_name || 'Customer',
        amount: (txn.seller_received || txn.amount || 0).toLocaleString(),
        status: txn.status === 'completed' ? 'Completed' : txn.status === 'pending' ? 'Pending' : txn.status,
        statusColor: txn.status === 'completed' ? '#4CAF50' : '#F59E0B',
        statusBg: txn.status === 'completed' ? '#E8F5E9' : '#FFF8E1',
      }));
      setRecentOrders(formatted);
    }

    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  const onRefresh = () => { setRefreshing(true); loadDashboard(); };

  const quickActions = [
    { icon: 'add-circle-outline', label: 'Add Product', route: 'AddProduct' },
    { icon: 'camera-outline', label: 'Scan Payment', route: null },
    { icon: 'clipboard-outline', label: 'View Orders', route: 'SellerOrders', badge: stats.pendingOrders },
    { icon: 'megaphone-outline', label: 'Run Promotion', route: null },
    { icon: 'person-add-outline', label: 'Add Staff', route: null },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity><Ionicons name="menu-outline" size={26} color="#212121" /></TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.logo}>MUNOLINK</Text><Text style={styles.tagline}>For Better Connections</Text></View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SellerAccount')}>
            <View style={styles.profilePic}><Ionicons name="person" size={20} color="#FFFFFF" /><View style={styles.onlineDot} /></View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#006B3F']} />}>
        {loading ? (
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        ) : !shop ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={48} color="#CCC" />
            <Text style={styles.emptyTitle}>No shop found</Text>
            <Text style={styles.emptySubtitle}>Set up your shop to start selling on Munolink.</Text>
            <TouchableOpacity style={styles.setupBtn} onPress={() => navigation.navigate('ShopSetup', { phoneNumber: user?.phoneNumber, role: 'shop_owner' })}>
              <Text style={styles.setupBtnText}>Set Up Shop</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Business Profile */}
            <View style={styles.businessProfile}>
              <View style={styles.businessLeft}>
                <View style={styles.shopPhoto}><Ionicons name="storefront" size={28} color="#006B3F" /><View style={styles.editPhotoBadge}><Ionicons name="pencil" size={10} color="#FFFFFF" /></View></View>
                <View style={styles.businessInfo}>
                  <View style={styles.shopNameRow}><Text style={styles.shopName}>{shop.name}</Text><Ionicons name="checkmark-circle" size={16} color="#006B3F" /></View>
                  <View style={styles.badgesRow}><View style={styles.ownerBadge}><Text style={styles.ownerBadgeText}>Shop Owner</Text></View><View style={styles.verifiedBadge}><Ionicons name="shield-checkmark" size={10} color="#006B3F" /><Text style={styles.verifiedText}>Verified</Text></View></View>
                  <View style={styles.locationRow}><Ionicons name="location-outline" size={12} color="#888" /><Text style={styles.locationText}>{shop.address || shop.area || 'Jinja City'}</Text></View>
                </View>
              </View>
            </View>

            {/* Wallet Card */}
            <View style={styles.walletCard}>
              <View style={styles.walletTop}>
                <View style={styles.walletLeft}>
                  <View style={styles.walletLabelRow}><Text style={styles.walletLabel}>Wallet Balance</Text><TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}><Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={18} color="rgba(255,255,255,0.7)" /></TouchableOpacity></View>
                  <Text style={styles.walletAmount}>{balanceVisible ? `UGX ${(shop.wallet_balance || 0).toLocaleString()}` : '****'}</Text>
                  <Text style={styles.walletSubtext}>Available for withdrawal</Text>
                </View>
                <View style={styles.walletButtons}>
                  <TouchableOpacity style={styles.withdrawBtn} onPress={() => navigation.navigate('SellerWallet')}><Ionicons name="arrow-down-outline" size={16} color="#006B3F" /><Text style={styles.withdrawText}>Withdraw</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('SellerWallet')}><Ionicons name="time-outline" size={16} color="#FFFFFF" /><Text style={styles.historyText}>History</Text></TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
              {[
                { label: "Today's Sales", value: `UGX ${stats.todaySales.toLocaleString()}`, icon: 'trending-up-outline' },
                { label: 'Orders', value: stats.orders.toString(), sub: `${stats.pendingOrders} pending`, icon: 'receipt-outline' },
                { label: 'Customers', value: stats.customers.toString(), icon: 'people-outline' },
                { label: 'Rating', value: `${stats.rating} ⭐`, sub: `${stats.reviews} reviews`, icon: 'star-outline' },
              ].map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={styles.statIconRow}><Ionicons name={stat.icon} size={16} color="#006B3F" /></View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  {stat.sub && <Text style={styles.statSub}>{stat.sub}</Text>}
                </View>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsRow}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionItem}
                  onPress={() => { if (action.route) navigation.navigate(action.route); }}
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons name={action.icon} size={22} color="#006B3F" />
                    {action.badge > 0 && <View style={styles.quickActionBadge}><Text style={styles.quickActionBadgeText}>{action.badge}</Text></View>}
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Orders */}
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent Orders</Text><TouchableOpacity onPress={() => navigation.navigate('SellerOrders')}><Text style={styles.viewAll}>View All</Text></TouchableOpacity></View>
            {recentOrders.length === 0 ? <Text style={styles.noDataText}>No orders yet.</Text> : (
              recentOrders.map((order, index) => (
                <View key={index} style={styles.orderRow}>
                  <View style={styles.orderCustomer}><View style={styles.customerAvatar}><Text style={styles.customerInitial}>{order.customer?.charAt(0) || 'C'}</Text></View><View><Text style={styles.orderId}>{order.id}</Text><Text style={styles.customerName}>{order.customer}</Text></View></View>
                  <Text style={styles.orderAmount}>UGX {order.amount}</Text>
                  <View style={[styles.orderStatus, { backgroundColor: order.statusBg }]}><Text style={[styles.orderStatusText, { color: order.statusColor }]}>{order.status}</Text></View>
                </View>
              ))
            )}

            {/* Boost Banner */}
            <View style={styles.boostBanner}>
              <View style={styles.boostLeft}><View style={styles.boostIcon}><Ionicons name="bag-handle-outline" size={28} color="#006B3F" /></View><View><Text style={styles.boostTitle}>Boost Your Sales</Text><Text style={styles.boostSubtitle}>Run promotions and reach more customers.</Text></View></View>
              <TouchableOpacity style={styles.boostBtn}><Text style={styles.boostBtnText}>Create Promotion</Text></TouchableOpacity>
            </View>
          </>
        )}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}><Ionicons name="grid-outline" size={22} color="#006B3F" /><Text style={[styles.navLabel, styles.navLabelActive]}>Dashboard</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SellerProducts')}><Ionicons name="cube-outline" size={22} color="#888" /><Text style={styles.navLabel}>Products</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SellerOrders')}><Ionicons name="receipt-outline" size={22} color="#888" /><View style={styles.navIconWrapper}>{stats.pendingOrders > 0 && <View style={styles.navBadge}><Text style={styles.navBadgeText}>{stats.pendingOrders}</Text></View>}</View><Text style={styles.navLabel}>Orders</Text></TouchableOpacity>
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
  loadingText: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#555', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  setupBtn: { backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20 },
  setupBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  businessProfile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  businessLeft: { flexDirection: 'row', flex: 1 },
  shopPhoto: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 10, position: 'relative' },
  editPhotoBadge: { position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#00C853', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  businessInfo: { flex: 1 },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  shopName: { fontSize: 16, fontWeight: '800', color: '#212121' },
  badgesRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  ownerBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  ownerBadgeText: { fontSize: 9, fontWeight: '700', color: '#006B3F' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 3 },
  verifiedText: { fontSize: 9, fontWeight: '600', color: '#006B3F' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText: { fontSize: 11, color: '#888' },
  walletCard: { backgroundColor: '#006B3F', borderRadius: 20, padding: 18, marginBottom: 16 },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLeft: { flex: 1 },
  walletLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  walletAmount: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  walletSubtext: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  walletButtons: { gap: 8 },
  withdrawBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, gap: 4 },
  withdrawText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  historyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, gap: 4 },
  historyText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  statCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statIconRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  statSub: { fontSize: 10, color: '#006B3F', fontWeight: '600', marginTop: 2 },
  quickActionsRow: { flexDirection: 'row', gap: 6, marginBottom: 22 },
  quickActionItem: { flex: 1, alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 10, gap: 4 },
  quickActionIcon: { position: 'relative', width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  quickActionBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  quickActionBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  quickActionLabel: { fontSize: 9, fontWeight: '600', color: '#333', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  viewAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  noDataText: { fontSize: 13, color: '#888', textAlign: 'center', paddingVertical: 20 },
  orderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8F8F8', borderRadius: 12, padding: 10, marginBottom: 6 },
  orderCustomer: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  customerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  customerInitial: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  orderId: { fontSize: 11, fontWeight: '700', color: '#212121' },
  customerName: { fontSize: 10, color: '#888' },
  orderAmount: { fontSize: 13, fontWeight: '700', color: '#212121', marginRight: 10 },
  orderStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  orderStatusText: { fontSize: 10, fontWeight: '700' },
  boostBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E8F5E9', borderRadius: 18, padding: 16, marginTop: 4 },
  boostLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  boostIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  boostTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },
  boostSubtitle: { fontSize: 11, color: '#666' },
  boostBtn: { backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  boostBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25, borderTopWidth: 1, borderTopColor: '#F0F0F0', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', gap: 2 },
  navIconWrapper: { position: 'relative' },
  navBadge: { position: 'absolute', top: -4, right: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  navBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
});