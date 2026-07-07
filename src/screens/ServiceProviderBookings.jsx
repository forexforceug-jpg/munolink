import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ServiceProviderBookings({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profession, setProfession] = useState('');

  const tabs = ['All', 'Pending', 'Confirmed', 'In Progress', 'Completed'];

  const loadBookings = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }

    // Get user's profession from database
    const { data: userData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (userData) setProfession(userData.full_name || 'Service Provider');

    // Get transactions for this provider
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, users(full_name, phone_number)')
      .eq('shop_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (transactions && transactions.length > 0) {
      const formatted = transactions.map(txn => ({
        id: txn.reference || txn.id?.toString()?.slice(0, 12),
        service: profession || 'Service',
        client: txn.users?.full_name || 'Customer',
        phone: txn.users?.phone_number || '',
        date: new Date(txn.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: new Date(txn.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        location: 'Jinja City',
        amount: txn.amount?.toLocaleString() || '0',
        status: txn.status === 'completed' ? 'Completed' : txn.status === 'pending' ? 'Pending' : 'Confirmed',
        statusColor: txn.status === 'completed' ? '#4CAF50' : txn.status === 'pending' ? '#F57C00' : '#1976D2',
        statusBg: txn.status === 'completed' ? '#E8F5E9' : txn.status === 'pending' ? '#FFF3E0' : '#E3F2FD',
        rawStatus: txn.status,
        iconBg: '#E8F5E9',
      }));
      setBookings(formatted);
    }

    setLoading(false);
    setRefreshing(false);
  }, [user?.id, profession]);

  useEffect(() => { loadBookings(); }, [loadBookings]);
  const onRefresh = () => { setRefreshing(true); loadBookings(); };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.service?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'All') return matchesSearch;
    return b.status === activeTab && matchesSearch;
  });

  const tabCounts = tabs.map(tab => ({
    name: tab,
    count: tab === 'All' ? bookings.length : bookings.filter(b => b.status === tab).length,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity><Ionicons name="menu-outline" size={26} color="#212121" /></TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.logo}>MUNOLINK</Text><Text style={styles.tagline}>For Better Connections</Text></View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ServiceProviderProfileScreen')}>
            <View style={styles.profilePic}><Ionicons name="person" size={20} color="#FFFFFF" /><View style={styles.onlineDot} /></View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#006B3F']} />}>
        <Text style={styles.pageTitle}>Bookings</Text>
        <Text style={styles.pageSubtitle}>Manage all your bookings and service requests.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {tabCounts.map((tab) => (
            <TouchableOpacity key={tab.name} style={[styles.tab, activeTab === tab.name && styles.tabActive]} onPress={() => setActiveTab(tab.name)}>
              <Text style={[styles.tabText, activeTab === tab.name && styles.tabTextActive]}>{tab.name}</Text>
              <View style={[styles.tabCount, activeTab === tab.name && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, activeTab === tab.name && styles.tabCountTextActive]}>{tab.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}><Ionicons name="search-outline" size={18} color="#888" /><TextInput style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search by client, service, or ID..." placeholderTextColor="#CCCCCC" /></View>
        </View>

        {loading ? <Text style={styles.loadingText}>Loading bookings...</Text> : filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#CCC" />
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptySubtitle}>Your bookings will appear here when customers request your services.</Text>
          </View>
        ) : (
          filteredBookings.map((booking, index) => (
            <View key={index} style={styles.bookingCard}>
              <View style={styles.bookingTop}>
                <View style={[styles.bookingIcon, { backgroundColor: booking.iconBg }]}>
                  <Ionicons name="briefcase-outline" size={24} color={booking.statusColor} />
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingService}>{booking.service}</Text>
                  <Text style={styles.bookingClient}>{booking.client}</Text>
                  <View style={styles.bookingDetail}><Ionicons name="calendar-outline" size={12} color="#888" /><Text style={styles.bookingDetailText}>{booking.date} · {booking.time}</Text></View>
                  <View style={styles.bookingDetail}><Ionicons name="location-outline" size={12} color="#888" /><Text style={styles.bookingDetailText}>{booking.location}</Text></View>
                </View>
                <TouchableOpacity style={styles.menuBtn}><Ionicons name="ellipsis-vertical" size={18} color="#888" /></TouchableOpacity>
              </View>
              <View style={styles.bookingBottom}>
                <View style={[styles.statusBadge, { backgroundColor: booking.statusBg }]}><Text style={[styles.statusText, { color: booking.statusColor }]}>{booking.status}</Text></View>
                <View style={styles.bookingRight}><Text style={styles.bookingAmount}>UGX {booking.amount}</Text><Text style={styles.bookingId}>{booking.id}</Text></View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderDashboard')}><Ionicons name="grid-outline" size={22} color="#888" /><Text style={styles.navLabel}>Overview</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Ionicons name="calendar" size={22} color="#006B3F" /><Text style={[styles.navLabel, styles.navLabelActive]}>Bookings</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderServices')}><Ionicons name="briefcase-outline" size={22} color="#888" /><Text style={styles.navLabel}>Services</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderEarnings')}><Ionicons name="wallet-outline" size={22} color="#888" /><Text style={styles.navLabel}>Earnings</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderProfileScreen')}><Ionicons name="person-outline" size={22} color="#888" /><Text style={styles.navLabel}>Profile</Text></TouchableOpacity>
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
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  tabsScroll: { marginBottom: 14 },
  tab: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, gap: 6, borderWidth: 1, borderColor: '#E0E0E0' },
  tabActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#FFFFFF' },
  tabCount: { backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabCountText: { fontSize: 11, fontWeight: '700', color: '#888' },
  tabCountTextActive: { color: '#FFFFFF' },
  searchRow: { marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#ECECEC' },
  searchInput: { flex: 1, fontSize: 13, color: '#212121', marginLeft: 8 },
  loadingText: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 30 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#555', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#888' },
  bookingCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  bookingTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  bookingIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  bookingInfo: { flex: 1 },
  bookingService: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 2 },
  bookingClient: { fontSize: 13, color: '#888', marginBottom: 6 },
  bookingDetail: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  bookingDetailText: { fontSize: 11, color: '#888' },
  menuBtn: { padding: 4 },
  bookingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  statusText: { fontSize: 12, fontWeight: '700' },
  bookingRight: { alignItems: 'flex-end' },
  bookingAmount: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  bookingId: { fontSize: 10, color: '#AAA' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25, borderTopWidth: 1, borderTopColor: '#F0F0F0', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
});