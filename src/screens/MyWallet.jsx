import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function MyWallet({ navigation }) {
  const { user, login } = useAuth();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [walletBalance, setWalletBalance] = useState(user?.walletBalance || 0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWallet = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }

    const { data: userData } = await supabase
      .from('users')
      .select('wallet_balance, lifetime_savings')
      .eq('id', user.id)
      .single();

    if (userData) {
      setWalletBalance(userData.wallet_balance);
      login({ ...user, walletBalance: userData.wallet_balance, lifetimeSavings: userData.lifetime_savings });
    }

    const { data: txns } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (txns) {
      setTransactions(txns.map(txn => ({
        id: txn.id,
        type: txn.type || 'payment',
        desc: txn.type === 'topup' ? 'Wallet Top-Up' : txn.type === 'payment' ? 'Payment' : 'Transaction',
        source: txn.reference || 'Munolink',
        date: new Date(txn.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        amount: txn.type === 'topup' ? `+${(txn.amount || 0).toLocaleString()}` : `-${(txn.amount || 0).toLocaleString()}`,
        status: txn.status || 'Completed',
        color: txn.type === 'topup' ? '#4CAF50' : '#006B3F',
        icon: txn.type === 'topup' ? 'arrow-up-circle-outline' : 'cart-outline',
      })));
    }

    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadWallet(); }, [loadWallet]);
  const onRefresh = () => { setRefreshing(true); loadWallet(); };

  const quickActions = [
    { icon: 'phone-portrait-outline', label: 'Buy Airtime' },
    { icon: 'receipt-outline', label: 'Pay Bills' },
    { icon: 'add-circle-outline', label: 'Add Money', route: 'TopUp' },
    { icon: 'swap-horizontal-outline', label: 'Bank Transfer' },
    { icon: 'arrow-down-circle-outline', label: 'Request' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#006B3F']} />}>
        <View style={styles.walletCard}>
          <View style={styles.walletTop}>
            <View style={styles.walletInfo}>
              <View style={styles.walletLabelRow}>
                <Text style={styles.walletLabel}>Wallet Balance</Text>
                <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
                  <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={18} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>
              <Text style={styles.walletBalance}>{balanceVisible ? `UGX ${walletBalance.toLocaleString()}` : '****'}</Text>
              <View style={styles.availableBadge}><View style={styles.availableDot} /><Text style={styles.availableText}>Available Balance</Text></View>
            </View>
          </View>
          <View style={styles.walletActions}>
            {[
              { icon: 'add-outline', label: 'Add Money', route: 'TopUp' },
              { icon: 'send-outline', label: 'Send Money', route: 'SendMoney' },
              { icon: 'arrow-down-outline', label: 'Withdraw' },
              { icon: 'time-outline', label: 'History', route: 'MyOrders' },
            ].map((action, index) => (
              <TouchableOpacity key={index} style={styles.walletActionItem} onPress={() => { if (action.route) navigation.navigate(action.route); }}>
                <Ionicons name={action.icon} size={18} color="#FFFFFF" />
                <Text style={styles.walletActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.secureBanner}>
          <Ionicons name="shield-checkmark" size={18} color="#006B3F" />
          <Text style={styles.secureText}>Your money is safe and secure with Munolink.</Text>
        </View>

        <View style={styles.quickActionsRow}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickActionItem} onPress={() => { if (action.route) navigation.navigate(action.route); }}>
              <View style={styles.quickActionIcon}><Ionicons name={action.icon} size={22} color="#006B3F" /></View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyOrders')}><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
        </View>

        {loading ? <Text style={styles.loadingText}>Loading transactions...</Text> : transactions.length === 0 ? (
          <Text style={styles.noDataText}>No transactions yet.</Text>
        ) : (
          transactions.map((txn) => (
            <View key={txn.id} style={styles.transactionRow}>
              <View style={[styles.txnIconCircle, { backgroundColor: txn.color + '15' }]}><Ionicons name={txn.icon} size={18} color={txn.color} /></View>
              <View style={styles.txnInfo}><Text style={styles.txnDesc}>{txn.desc}</Text><Text style={styles.txnSource}>{txn.source}</Text><Text style={styles.txnDate}>{txn.date}</Text></View>
              <View style={styles.txnRight}>
                <Text style={[styles.txnAmount, txn.amount.startsWith('+') ? styles.txnCredit : styles.txnDebit]}>{txn.amount} UGX</Text>
                <View style={styles.txnStatusBadge}><Text style={styles.txnStatusText}>{txn.status}</Text></View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#212121' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  loadingText: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 20 },
  noDataText: { fontSize: 13, color: '#888', textAlign: 'center', paddingVertical: 20 },
  walletCard: { backgroundColor: '#006B3F', borderRadius: 22, padding: 18, marginBottom: 14 },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  walletInfo: { flex: 1 },
  walletLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  walletBalance: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  availableBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availableDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  availableText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  walletActions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 14 },
  walletActionItem: { alignItems: 'center', gap: 4 },
  walletActionText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  secureBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 14, padding: 12, marginBottom: 18, gap: 8 },
  secureText: { flex: 1, fontSize: 12, color: '#006B3F', fontWeight: '500' },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  quickActionItem: { alignItems: 'center', width: '18%' },
  quickActionIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickActionLabel: { fontSize: 10, color: '#333', fontWeight: '500', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  viewAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  txnIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: 13, fontWeight: '600', color: '#212121', marginBottom: 1 },
  txnSource: { fontSize: 11, color: '#888', marginBottom: 1 },
  txnDate: { fontSize: 10, color: '#AAA' },
  txnRight: { alignItems: 'flex-end' },
  txnAmount: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  txnCredit: { color: '#4CAF50' },
  txnDebit: { color: '#212121' },
  txnStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#E8F5E9' },
  txnStatusText: { fontSize: 9, fontWeight: '700', color: '#4CAF50' },
});