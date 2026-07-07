import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ServiceProviderDashboard({ navigation }) {
  const { user, login } = useAuth();
  const [provider, setProvider] = useState(null);
  const [stats, setStats] = useState({ bookings: 0, pending: 0, completed: 0, earnings: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }

    // Get user profile
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userData) {
      setProvider(userData);
      login({ ...user, fullName: userData.full_name, walletBalance: userData.wallet_balance });
    }

    // Get provider's services count
    const { data: services } = await supabase
      .from('provider_services')
      .select('*')
      .eq('user_id', user.id);

    // Get transactions for this provider
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, users(full_name)')
      .eq('shop_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (transactions) {
      const completed = transactions.filter(t => t.status === 'completed');
      const pending = transactions.filter(t => t.status === 'pending');
      const totalEarnings = completed.reduce((sum, t) => sum + (t.seller_received || t.amount || 0), 0);

      setStats({
        bookings: transactions.length,
        pending: pending.length,
        completed: completed.length,
        earnings: totalEarnings,
        services: services?.length || 0,
        activeServices: services?.filter(s => s.is_active).length || 0,
      });

      setRecentBookings(transactions.slice(0, 5).map(txn => ({
        id: txn.reference || txn.id?.toString()?.slice(0, 12),
        customer: txn.users?.full_name || 'Customer',
        date: new Date(txn.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        time: new Date(txn.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        amount: txn.seller_received || txn.amount || 0,
        status: txn.status === 'completed' ? 'Completed' : txn.status === 'pending' ? 'Pending' : txn.status,
        statusColor: txn.status === 'completed' ? '#4CAF50' : '#F59E0B',
        statusBg: txn.status === 'completed' ? '#E8F5E9' : '#FFF8E1',
      })));
    }

    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  const onRefresh = () => { setRefreshing(true); loadDashboard(); };

  const quickActions = [
    { icon: 'add-circle-outline', label: 'Add Service', color: '#006B3F', route: 'ServiceProviderServices' },
    { icon: 'settings-outline', label: 'Manage', color: '#1976D2', route: 'ServiceProviderServices' },
    { icon: 'time-outline', label: 'Availability', color: '#9C27B0', route: null },
    { icon: 'document-text-outline', label: 'Requests', color: '#F57C00', route: 'ServiceProviderBookings' },
    { icon: 'share-outline', label: 'Share Profile', color: '#4CAF50', route: null },
    { icon: 'megaphone-outline', label: 'Promote', color: '#E91E63', route: null },
    { icon: 'calendar-outline', label: 'Schedule', color: '#00BCD4', route: 'ServiceProviderBookings' },
    { icon: 'chatbubble-ellipses-outline', label: 'Messages', color: '#FF5722', badge: 3, route: 'Messages' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity><Ionicons name="menu-outline" size={26} color="#212121" /></TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.logo}>MUNOLINK</Text><Text style={styles.tagline}>For Better Connections</Text></View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}><Ionicons name="notifications-outline" size={24} color="#212121" /><View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ServiceProviderProfileScreen')}><View style={styles.profilePic}><Ionicons name="person" size={20} color="#FFFFFF" /><View style={styles.onlineDot} /></View></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#006B3F']} />}>
        {loading ? <Text style={styles.loadingText}>Loading dashboard...</Text> : (
          <>
            <Text style={styles.greeting}>Good morning, {provider?.full_name || 'Provider'}! 👋</Text>
            <Text style={styles.greetingSub}>Here's what's happening with your services today.</Text>

            <View style={styles.selectorRow}>
              <TouchableOpacity style={styles.serviceSelector}>
                <Ionicons name="briefcase-outline" size={18} color="#006B3F" />
                <Text style={styles.serviceText}>All Services ({stats.services || 0})</Text>
                <Ionicons name="chevron-down" size={14} color="#888" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statusCard, isAvailable && styles.statusAvailable]} onPress={() => setIsAvailable(!isAvailable)}>
                <View style={[styles.statusDot, isAvailable ? styles.statusDotOn : styles.statusDotOff]} />
                <Text style={[styles.statusText, isAvailable && styles.statusTextOn]}>{isAvailable ? 'Available' : 'Unavailable'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              {[
                { label: 'Bookings', value: stats.bookings.toString(), icon: 'calendar-outline', color: '#006B3F', bg: '#E8F5E9' },
                { label: 'Pending', value: stats.pending.toString(), icon: 'clipboard-outline', color: '#1976D2', bg: '#E3F2FD' },
                { label: 'Completed', value: stats.completed.toString(), icon: 'checkmark-circle-outline', color: '#9C27B0', bg: '#F3E5F5' },
                { label: 'Earnings', value: `UGX ${stats.earnings.toLocaleString()}`, icon: 'cash-outline', color: '#F57C00', bg: '#FFF3E0' },
              ].map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: stat.bg }]}><Ionicons name={stat.icon} size={14} color={stat.color} /></View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity key={index} style={styles.quickItem} onPress={() => { if (action.route) navigation.navigate(action.route); }}>
                  <View style={styles.quickIconWrapper}>
                    <View style={[styles.quickIcon, { backgroundColor: action.color + '15' }]}><Ionicons name={action.icon} size={20} color={action.color} /></View>
                    {action.badge && <View style={styles.quickBadge}><Text style={styles.quickBadgeText}>{action.badge}</Text></View>}
                  </View>
                  <Text style={styles.quickLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent Bookings</Text><TouchableOpacity onPress={() => navigation.navigate('ServiceProviderBookings')}><Text style={styles.viewAll}>View All</Text></TouchableOpacity></View>
            {recentBookings.length === 0 ? <Text style={styles.noDataText}>No bookings yet.</Text> : (
              recentBookings.map((booking) => (
                <View key={booking.id} style={styles.bookingRow}>
                  <View style={styles.bookingLeft}>
                    <View style={styles.bookingAvatar}><Ionicons name="person" size={20} color="#006B3F" /></View>
                    <View>
                      <Text style={styles.bookingCustomer}>{booking.customer}</Text>
                      <Text style={styles.bookingDate}>📅 {booking.date} · {booking.time}</Text>
                    </View>
                  </View>
                  <View style={styles.bookingRight}>
                    <Text style={styles.bookingAmount}>UGX {booking.amount.toLocaleString()}</Text>
                    <View style={[styles.bookingStatus, { backgroundColor: booking.statusBg }]}><Text style={[styles.bookingStatusText, { color: booking.statusColor }]}>{booking.status}</Text></View>
                  </View>
                </View>
              ))
            )}

            <View style={styles.verifyBanner}>
              <View style={styles.verifyLeft}><View style={styles.verifyIcon}><Ionicons name="shield-checkmark" size={28} color="#006B3F" /></View><View><Text style={styles.verifyTitle}>Get Verified</Text><Text style={styles.verifySubtitle}>Increase trust and get more bookings.</Text></View></View>
              <TouchableOpacity style={styles.verifyBtn}><Text style={styles.verifyBtnText}>Verify Now</Text></TouchableOpacity>
            </View>
          </>
        )}
        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}><Ionicons name="grid-outline" size={22} color="#006B3F" /><Text style={[styles.navLabel, styles.navLabelActive]}>Overview</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderBookings')}><Ionicons name="calendar-outline" size={22} color="#888" /><Text style={styles.navLabel}>Bookings</Text></TouchableOpacity>
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
  loadingText: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 40 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#212121', marginBottom: 4 },
  greetingSub: { fontSize: 13, color: '#888', marginBottom: 18 },
  selectorRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  serviceSelector: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 8, borderWidth: 1, borderColor: '#ECECEC' },
  serviceText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#212121' },
  statusCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 6, borderWidth: 1, borderColor: '#ECECEC' },
  statusAvailable: { borderColor: '#4CAF50', backgroundColor: '#F5FFF5' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CCC' },
  statusDotOn: { backgroundColor: '#4CAF50' },
  statusDotOff: { backgroundColor: '#D32F2F' },
  statusText: { fontSize: 13, fontWeight: '600', color: '#888' },
  statusTextOn: { color: '#4CAF50' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  statCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  quickItem: { width: '23%', alignItems: 'center', marginBottom: 8 },
  quickIconWrapper: { position: 'relative', marginBottom: 6 },
  quickIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  quickBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  quickBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  quickLabel: { fontSize: 9, fontWeight: '600', color: '#333', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  viewAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  noDataText: { fontSize: 13, color: '#888', textAlign: 'center', paddingVertical: 20 },
  bookingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12, marginBottom: 8 },
  bookingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  bookingAvatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  bookingCustomer: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 1 },
  bookingDate: { fontSize: 10, color: '#888' },
  bookingRight: { alignItems: 'flex-end' },
  bookingAmount: { fontSize: 14, fontWeight: '700', color: '#006B3F', marginBottom: 4 },
  bookingStatus: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  bookingStatusText: { fontSize: 10, fontWeight: '700' },
  verifyBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E8F5E9', borderRadius: 18, padding: 16, marginTop: 8 },
  verifyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  verifyIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  verifyTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },
  verifySubtitle: { fontSize: 11, color: '#666' },
  verifyBtn: { borderWidth: 1.5, borderColor: '#006B3F', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18 },
  verifyBtnText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25, borderTopWidth: 1, borderTopColor: '#F0F0F0', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
});