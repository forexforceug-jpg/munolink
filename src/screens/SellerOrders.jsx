import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function SellerOrders({ navigation }) {
  const { user } = useAuth();
  const [activeStatus, setActiveStatus] = useState('All Orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shopId, setShopId] = useState(null);

  const statusTabs = [
    { name: 'All Orders', count: 0 },
    { name: 'Pending', count: 0 },
    { name: 'Confirmed', count: 0 },
    { name: 'On the Way', count: 0 },
    { name: 'Delivered', count: 0 },
    { name: 'Cancelled', count: 0 },
  ];

  const loadOrders = useCallback(async () => {
    if (!user?.id) return;
    const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
    if (!shop) { setLoading(false); return; }
    setShopId(shop.id);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, users(full_name, phone_number)')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (transactions) {
      const formatted = transactions.map((txn) => ({
        id: txn.reference || txn.id?.toString()?.slice(0, 12),
        date: new Date(txn.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: new Date(txn.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        customer: txn.users?.full_name || 'Customer',
        phone: txn.users?.phone_number || '',
        address: 'Jinja City',
        items: 1,
        amount: txn.amount?.toLocaleString() || '0',
        paymentStatus: txn.status === 'completed' ? 'Paid' : 'Pending',
        status: txn.status === 'completed' ? 'Delivered' : txn.status === 'pending' ? 'Pending' : txn.status,
        statusColor: txn.status === 'completed' ? '#4CAF50' : txn.status === 'pending' ? '#F59E0B' : '#1976D2',
        statusBg: txn.status === 'completed' ? '#E8F5E9' : txn.status === 'pending' ? '#FFF8E1' : '#E3F2FD',
      }));
      setOrders(formatted);
    }
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  const onRefresh = () => { setRefreshing(true); loadOrders(); };

  const filteredOrders = activeStatus === 'All Orders'
    ? orders.filter(o => o.id?.toLowerCase().includes(searchQuery.toLowerCase()) || o.customer?.toLowerCase().includes(searchQuery.toLowerCase()))
    : orders.filter(o => (o.status === activeStatus || o.status === activeStatus.toLowerCase()) && (o.id?.toLowerCase().includes(searchQuery.toLowerCase()) || o.customer?.toLowerCase().includes(searchQuery.toLowerCase())));

  const statusCounts = statusTabs.map(tab => ({
    ...tab,
    count: tab.name === 'All Orders' ? orders.length : orders.filter(o => o.status === tab.name || o.status === tab.name.toLowerCase()).length,
  }));

  const todayOrders = orders.filter(o => o.date === new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }));
  const todaySales = todayOrders.reduce((sum, o) => sum + (parseInt(o.amount?.replace(/,/g, '')) || 0), 0);
  const avgOrder = todayOrders.length > 0 ? Math.round(todaySales / todayOrders.length) : 0;

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
          <View><Text style={styles.pageTitle}>Orders</Text><Text style={styles.pageSubtitle}>Manage and fulfil customer orders.</Text></View>
          <TouchableOpacity style={styles.newOrderBtn}><Ionicons name="add" size={18} color="#FFFFFF" /><Text style={styles.newOrderText}>New Order</Text></TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll}>
          {statusCounts.map((tab) => (
            <TouchableOpacity key={tab.name} style={[styles.statusTab, activeStatus === tab.name && styles.statusTabActive]} onPress={() => setActiveStatus(tab.name)}>
              <Text style={[styles.statusTabText, activeStatus === tab.name && styles.statusTabTextActive]}>{tab.name}</Text>
              <Text style={[styles.statusTabCount, activeStatus === tab.name && styles.statusTabCountActive]}>{tab.count}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}><Ionicons name="search-outline" size={18} color="#888" /><TextInput style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search by order # or customer..." placeholderTextColor="#CCCCCC" /></View>
        </View>

        <View style={styles.perfRow}>
          {[
            { label: "Today's Orders", value: todayOrders.length.toString(), icon: 'receipt-outline' },
            { label: "Today's Sales", value: `UGX ${todaySales.toLocaleString()}`, icon: 'cash-outline' },
            { label: 'Avg Order Value', value: `UGX ${avgOrder.toLocaleString()}`, icon: 'trending-up-outline' },
            { label: 'Total Orders', value: orders.length.toString(), icon: 'layers-outline' },
          ].map((card, index) => (
            <View key={index} style={styles.perfCard}>
              <View style={styles.perfHeader}><Ionicons name={card.icon} size={16} color="#006B3F" /></View>
              <Text style={styles.perfValue}>{card.value}</Text>
              <Text style={styles.perfLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {loading ? <Text style={styles.loadingText}>Loading orders...</Text> : filteredOrders.length === 0 ? <Text style={styles.noDataText}>No orders found.</Text> : (
          filteredOrders.map((order, index) => (
            <View key={index} style={styles.orderCard}>
              <View style={styles.orderHeader}><View><Text style={styles.orderId}>{order.id}</Text><Text style={styles.orderDate}>{order.date} · {order.time}</Text></View><View style={[styles.orderStatusBadge, { backgroundColor: order.statusBg }]}><Text style={[styles.orderStatusText, { color: order.statusColor }]}>{order.status}</Text></View></View>
              <View style={styles.customerRow}><View style={styles.customerAvatar}><Text style={styles.customerInitial}>{order.customer?.charAt(0) || 'C'}</Text></View><View style={styles.customerInfo}><Text style={styles.customerName}>{order.customer}</Text><Text style={styles.customerPhone}>{order.phone}</Text><Text style={styles.customerAddress}>📍 {order.address}</Text></View></View>
              <View style={styles.orderBottom}>
                <View style={styles.itemsRow}>
                  {[...Array(Math.min(order.items, 4))].map((_, i) => (<View key={i} style={styles.itemThumb}><Ionicons name="cube-outline" size={14} color="#006B3F" /></View>))}
                  <Text style={styles.itemCount}>{order.items} items</Text>
                </View>
                <View style={styles.orderRight}><Text style={styles.orderAmount}>UGX {order.amount}</Text><View style={[styles.paymentBadge, { backgroundColor: order.paymentStatus === 'Paid' ? '#E8F5E9' : '#FFF8E1' }]}><Text style={[styles.paymentText, { color: order.paymentStatus === 'Paid' ? '#4CAF50' : '#F59E0B' }]}>{order.paymentStatus}</Text></View></View>
                <TouchableOpacity style={styles.menuBtn}><Ionicons name="ellipsis-vertical" size={18} color="#888" /></TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ShopOwnerDashboard')}><Ionicons name="grid-outline" size={22} color="#888" /><Text style={styles.navLabel}>Dashboard</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SellerProducts')}><Ionicons name="cube-outline" size={22} color="#888" /><Text style={styles.navLabel}>Products</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Ionicons name="receipt" size={22} color="#006B3F" /><Text style={[styles.navLabel, styles.navLabelActive]}>Orders</Text></TouchableOpacity>
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
  newOrderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 22, gap: 6 },
  newOrderText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  statusScroll: { marginBottom: 14 },
  statusTab: { alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: '#E0E0E0', minWidth: 80 },
  statusTabActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  statusTabText: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 2 },
  statusTabTextActive: { color: '#FFFFFF' },
  statusTabCount: { fontSize: 16, fontWeight: '800', color: '#212121' },
  statusTabCountActive: { color: '#FFFFFF' },
  searchRow: { marginBottom: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#ECECEC' },
  searchInput: { flex: 1, fontSize: 13, color: '#212121', marginLeft: 8 },
  perfRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  perfCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  perfHeader: { marginBottom: 6 },
  perfValue: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 2 },
  perfLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 10 },
  loadingText: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 30 },
  noDataText: { fontSize: 13, color: '#888', textAlign: 'center', paddingVertical: 20 },
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderId: { fontSize: 14, fontWeight: '700', color: '#212121' },
  orderDate: { fontSize: 10, color: '#888', marginTop: 1 },
  orderStatusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  orderStatusText: { fontSize: 11, fontWeight: '700' },
  customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  customerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  customerInitial: { fontSize: 16, fontWeight: '700', color: '#006B3F' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 1 },
  customerPhone: { fontSize: 11, color: '#888' },
  customerAddress: { fontSize: 11, color: '#888', marginTop: 1 },
  orderBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  itemThumb: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  itemCount: { fontSize: 11, color: '#888', fontWeight: '500' },
  orderRight: { alignItems: 'flex-end', marginRight: 8 },
  orderAmount: { fontSize: 15, fontWeight: '800', color: '#006B3F', marginBottom: 4 },
  paymentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  paymentText: { fontSize: 10, fontWeight: '700' },
  menuBtn: { padding: 4 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25, borderTopWidth: 1, borderTopColor: '#F0F0F0', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
});