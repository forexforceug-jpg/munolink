import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ServiceProviderEarnings({ navigation }) {
  const { user, login } = useAuth();
  const [activePeriod, setActivePeriod] = useState('This Month');
  const [earnings, setEarnings] = useState({ total: 0, completed: 0, upcoming: 0, cancelled: 0, pendingPayout: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEarnings = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }

    // Get user wallet
    const { data: userData } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', user.id)
      .single();

    if (userData) {
      login({ ...user, walletBalance: userData.wallet_balance });
    }

    // Get all transactions
    const { data: txns } = await supabase
      .from('transactions')
      .select('*, users(full_name)')
      .eq('shop_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (txns) {
      const completed = txns.filter(t => t.status === 'completed');
      const pending = txns.filter(t => t.status === 'pending');
      const cancelled = txns.filter(t => t.status === 'cancelled');
      const totalEarnings = completed.reduce((sum, t) => sum + (t.seller_received || t.amount || 0), 0);
      const upcomingEarnings = pending.reduce((sum, t) => sum + (t.amount || 0), 0);

      setEarnings({
        total: totalEarnings,
        completed: totalEarnings,
        upcoming: upcomingEarnings,
        cancelled: cancelled.reduce((sum, t) => sum + (t.amount || 0), 0),
        pendingPayout: userData?.wallet_balance || 0,
      });

      setTransactions(txns.map(txn => ({
        id: txn.id,
        service: 'Service',
        client: txn.users?.full_name || 'Customer',
        amount: txn.seller_received || txn.amount || 0,
        status: txn.status === 'completed' ? 'Completed' : txn.status === 'pending' ? 'Upcoming' : txn.status,
        statusColor: txn.status === 'completed' ? '#4CAF50' : '#1976D2',
        date: new Date(txn.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      })));
    }

    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadEarnings(); }, [loadEarnings]);
  const onRefresh = () => { setRefreshing(true); loadEarnings(); };

  const earningsStats = [
    { label: 'Completed Jobs', value: `UGX ${earnings.completed.toLocaleString()}`, icon: 'wallet-outline', color: '#4CAF50', bg: '#E8F5E9' },
    { label: 'Upcoming Jobs', value: `UGX ${earnings.upcoming.toLocaleString()}`, icon: 'time-outline', color: '#1976D2', bg: '#E3F2FD' },
    { label: 'Cancelled', value: `UGX ${earnings.cancelled.toLocaleString()}`, icon: 'refresh-outline', color: '#F57C00', bg: '#FFF3E0' },
    { label: 'Wallet Balance', value: `UGX ${earnings.pendingPayout.toLocaleString()}`, icon: 'wallet-outline', color: '#9C27B0', bg: '#F3E5F5' },
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
        <View style={styles.titleRow}>
          <View><Text style={styles.pageTitle}>Earnings</Text><Text style={styles.pageSubtitle}>Track your income and payouts.</Text></View>
          <TouchableOpacity style={styles.periodBtn}><Ionicons name="calendar-outline" size={16} color="#006B3F" /><Text style={styles.periodText}>{activePeriod}</Text><Ionicons name="chevron-down" size={12} color="#006B3F" /></TouchableOpacity>
        </View>

        {loading ? <Text style={styles.loadingText}>Loading earnings...</Text> : (
          <>
            <View style={styles.overviewCard}>
              <View style={styles.overviewTop}>
                <View style={styles.overviewLeft}>
                  <Text style={styles.overviewLabel}>Total Earnings</Text>
                  <Text style={styles.overviewAmount}>UGX {earnings.total.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              {earningsStats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: stat.bg }]}><Ionicons name={stat.icon} size={14} color={stat.color} /></View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent Transactions</Text></View>
            {transactions.length === 0 ? <Text style={styles.noDataText}>No transactions yet.</Text> : (
              transactions.slice(0, 10).map((txn) => (
                <View key={txn.id} style={styles.transactionRow}>
                  <View style={[styles.txnIcon, { backgroundColor: '#E8F5E9' }]}><Ionicons name="cart-outline" size={18} color="#4CAF50" /></View>
                  <View style={styles.txnInfo}><Text style={styles.txnService}>{txn.service}</Text><Text style={styles.txnClient}>{txn.client}</Text><Text style={styles.txnDate}>{txn.date}</Text></View>
                  <Text style={styles.txnAmount}>+UGX {txn.amount.toLocaleString()}</Text>
                </View>
              ))
            )}

            <View style={styles.payoutCard}>
              <View style={styles.payoutTop}>
                <View style={styles.payoutLeft}>
                  <View style={styles.payoutIcon}><Ionicons name="business-outline" size={24} color="#006B3F" /></View>
                  <View><Text style={styles.payoutAmount}>UGX {earnings.pendingPayout.toLocaleString()}</Text><Text style={styles.payoutDesc}>Available in your wallet</Text></View>
                </View>
              </View>
            </View>
          </>
        )}
        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderDashboard')}><Ionicons name="grid-outline" size={22} color="#888" /><Text style={styles.navLabel}>Overview</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderBookings')}><Ionicons name="calendar-outline" size={22} color="#888" /><Text style={styles.navLabel}>Bookings</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderServices')}><Ionicons name="briefcase-outline" size={22} color="#888" /><Text style={styles.navLabel}>Services</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Ionicons name="wallet" size={22} color="#006B3F" /><Text style={[styles.navLabel, styles.navLabelActive]}>Earnings</Text></TouchableOpacity>
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
  noDataText: { fontSize: 13, color: '#888', textAlign: 'center', paddingVertical: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121' },
  pageSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  periodBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  periodText: { fontSize: 13, fontWeight: '600', color: '#006B3F' },
  overviewCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  overviewTop: { flexDirection: 'row' },
  overviewLeft: { flex: 1 },
  overviewLabel: { fontSize: 13, color: '#888', fontWeight: '500', marginBottom: 4 },
  overviewAmount: { fontSize: 28, fontWeight: '800', color: '#006B3F', marginBottom: 4 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  statCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 13, fontWeight: '800', color: '#212121', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12, marginBottom: 8, gap: 10 },
  txnIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  txnInfo: { flex: 1 },
  txnService: { fontSize: 13, fontWeight: '600', color: '#212121', marginBottom: 1 },
  txnClient: { fontSize: 11, color: '#888' },
  txnDate: { fontSize: 10, color: '#AAA', marginTop: 1 },
  txnAmount: { fontSize: 14, fontWeight: '700', color: '#4CAF50' },
  payoutCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  payoutTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  payoutLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  payoutIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  payoutAmount: { fontSize: 18, fontWeight: '800', color: '#006B3F', marginBottom: 2 },
  payoutDesc: { fontSize: 11, color: '#888' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25, borderTopWidth: 1, borderTopColor: '#F0F0F0', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
});