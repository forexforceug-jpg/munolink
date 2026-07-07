import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function SellerWallet({ navigation }) {
  const { user, login } = useAuth();
  const [shop, setShop] = useState(null);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activePeriod, setActivePeriod] = useState('This Month');

  const loadWallet = useCallback(async () => {
    if (!user?.id) return;
    const { data: shopData } = await supabase.from('shops').select('*').eq('owner_id', user.id).single();
    if (shopData) {
      setShop(shopData);
      login({ ...user, walletBalance: shopData.wallet_balance });

      const { data: txns } = await supabase
        .from('transactions')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (txns) {
        setTransactions(txns.map(txn => ({
          id: txn.id,
          type: txn.type === 'payment' ? 'received' : txn.type || 'payment',
          desc: txn.type === 'payment' ? 'Order Payment' : txn.type || 'Transaction',
          ref: txn.reference || 'N/A',
          account: txn.payment_code || '',
          date: new Date(txn.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          amount: txn.seller_received || txn.amount || 0,
          status: txn.status || 'completed',
          color: '#4CAF50',
          bg: '#E8F5E9',
          icon: 'cart-outline',
        })));
      }
    }
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadWallet(); }, [loadWallet]);
  const onRefresh = () => { setRefreshing(true); loadWallet(); };

  const totalReceived = transactions.reduce((sum, t) => sum + t.amount, 0);
  const walletBalance = shop?.wallet_balance || 0;

  const handleWithdraw = () => {
    Alert.alert('Withdraw', 'Withdrawal feature coming soon. You will be able to withdraw to mobile money or bank account.', [{ text: 'OK' }]);
  };

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
          <View><Text style={styles.pageTitle}>Wallet</Text><Text style={styles.pageSubtitle}>Manage your earnings and transactions.</Text></View>
          <TouchableOpacity style={styles.settingsBtn}><Ionicons name="settings-outline" size={16} color="#006B3F" /><Text style={styles.settingsText}>Settings</Text></TouchableOpacity>
        </View>

        {loading ? <Text style={styles.loadingText}>Loading wallet...</Text> : !shop ? <Text style={styles.loadingText}>No shop found.</Text> : (
          <>
            <View style={styles.walletCard}>
              <View style={styles.walletTop}>
                <View style={styles.walletLeft}>
                  <View style={styles.walletLabelRow}><Text style={styles.walletLabel}>Available Balance</Text><TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}><Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={18} color="rgba(255,255,255,0.7)" /></TouchableOpacity></View>
                  <Text style={styles.walletAmount}>{balanceVisible ? `UGX ${walletBalance.toLocaleString()}` : '****'}</Text>
                  <Text style={styles.walletSubtext}>Available for withdrawal</Text>
                </View>
                <View style={styles.walletButtons}>
                  <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}><Ionicons name="arrow-down-outline" size={18} color="#006B3F" /><Text style={styles.withdrawText}>Withdraw Money</Text></TouchableOpacity>
                </View>
              </View>
              <View style={styles.lockedBalance}><Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.6)" /><Text style={styles.lockedText}>Locked Balance: UGX 0</Text></View>
            </View>

            <View style={styles.quickActionsRow}>
              {[
                { icon: 'swap-horizontal-outline', label: 'Bank Transfer' },
                { icon: 'phone-portrait-outline', label: 'Mobile Money' },
                { icon: 'qr-code-outline', label: 'Scan to Receive' },
                { icon: 'link-outline', label: 'Payment Links' },
                { icon: 'time-outline', label: 'History' },
              ].map((action, index) => (
                <TouchableOpacity key={index} style={styles.quickActionItem}>
                  <View style={styles.quickActionIcon}><Ionicons name={action.icon} size={20} color="#006B3F" /></View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Wallet Overview</Text><TouchableOpacity style={styles.periodBtn}><Text style={styles.periodText}>{activePeriod}</Text><Ionicons name="chevron-down" size={12} color="#006B3F" /></TouchableOpacity></View>
            <View style={styles.overviewGrid}>
              {[
                { label: 'Total Received', value: `UGX ${totalReceived.toLocaleString()}`, icon: 'arrow-down-circle-outline', color: '#4CAF50' },
                { label: 'Transactions', value: transactions.length.toString(), icon: 'layers-outline', color: '#006B3F' },
                { label: 'Available', value: `UGX ${walletBalance.toLocaleString()}`, icon: 'wallet-outline', color: '#006B3F' },
                { label: 'Pending', value: 'UGX 0', icon: 'time-outline', color: '#9C27B0' },
              ].map((card, index) => (
                <View key={index} style={styles.overviewCard}>
                  <View style={styles.overviewHeader}><Ionicons name={card.icon} size={16} color={card.color} /></View>
                  <Text style={styles.overviewValue}>{card.value}</Text>
                  <Text style={styles.overviewLabel}>{card.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent Transactions</Text></View>
            {transactions.length === 0 ? <Text style={styles.noDataText}>No transactions yet.</Text> : (
              transactions.map((txn) => (
                <View key={txn.id} style={styles.transactionRow}>
                  <View style={[styles.txnIconCircle, { backgroundColor: txn.bg }]}><Ionicons name={txn.icon} size={18} color={txn.color} /></View>
                  <View style={styles.txnInfo}><Text style={styles.txnDesc}>{txn.desc}</Text><Text style={styles.txnRef}>Ref: {txn.ref}</Text><Text style={styles.txnDate}>{txn.date}</Text></View>
                  <View style={styles.txnRight}><Text style={styles.txnAmount}>+UGX {txn.amount.toLocaleString()}</Text></View>
                </View>
              ))
            )}
          </>
        )}
        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ShopOwnerDashboard')}><Ionicons name="grid-outline" size={22} color="#888" /><Text style={styles.navLabel}>Dashboard</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SellerProducts')}><Ionicons name="cube-outline" size={22} color="#888" /><Text style={styles.navLabel}>Products</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SellerOrders')}><Ionicons name="receipt-outline" size={22} color="#888" /><Text style={styles.navLabel}>Orders</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Ionicons name="wallet" size={22} color="#006B3F" /><Text style={[styles.navLabel, styles.navLabelActive]}>Wallet</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Messages')}><Ionicons name="person-outline" size={22} color="#888" /><Text style={styles.navLabel}>Messages</Text></TouchableOpacity>
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
  settingsBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  settingsText: { fontSize: 12, fontWeight: '600', color: '#006B3F' },
  loadingText: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 40 },
  noDataText: { fontSize: 13, color: '#888', textAlign: 'center', paddingVertical: 20 },
  walletCard: { backgroundColor: '#006B3F', borderRadius: 22, padding: 20, marginBottom: 16 },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  walletLeft: { flex: 1 },
  walletLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  walletAmount: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  walletSubtext: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  walletButtons: { gap: 10 },
  withdrawBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 22, gap: 6 },
  withdrawText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  lockedBalance: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, gap: 6 },
  lockedText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  quickActionsRow: { flexDirection: 'row', gap: 6, marginBottom: 22 },
  quickActionItem: { flex: 1, alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 10, gap: 4 },
  quickActionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  quickActionLabel: { fontSize: 9, fontWeight: '600', color: '#333', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  periodBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  periodText: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  overviewCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  overviewHeader: { marginBottom: 6 },
  overviewValue: { fontSize: 14, fontWeight: '800', color: '#212121', marginBottom: 2 },
  overviewLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12, marginBottom: 8, gap: 10 },
  txnIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: 13, fontWeight: '600', color: '#212121', marginBottom: 1 },
  txnRef: { fontSize: 10, color: '#888' },
  txnDate: { fontSize: 10, color: '#AAA', marginTop: 1 },
  txnRight: { alignItems: 'flex-end' },
  txnAmount: { fontSize: 14, fontWeight: '700', color: '#4CAF50' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25, borderTopWidth: 1, borderTopColor: '#F0F0F0', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
});