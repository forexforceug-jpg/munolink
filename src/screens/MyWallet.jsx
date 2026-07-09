import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import LogoImage from '../../assets/logo.png';

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
};

export default function MyWallet({ navigation }) {
  const { user, login } = useAuth();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [walletBalance, setWalletBalance] = useState(user?.walletBalance || 0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWallet = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const { data: userData } = await supabase.from('users').select('wallet_balance, lifetime_savings').eq('id', user.id).single();
    if (userData) { setWalletBalance(userData.wallet_balance); login({ ...user, walletBalance: userData.wallet_balance, lifetimeSavings: userData.lifetime_savings }); }
    const { data: txns } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    if (txns) setTransactions(txns.map(txn => ({ id: txn.id, type: txn.type || 'payment', desc: txn.type === 'topup' ? 'Wallet Top-Up' : txn.type === 'payment' ? 'Payment' : 'Transaction', source: txn.reference || 'Munolink', date: new Date(txn.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), amount: txn.type === 'topup' ? `+${(txn.amount || 0).toLocaleString()}` : `-${(txn.amount || 0).toLocaleString()}`, status: txn.status || 'Completed', color: txn.type === 'topup' ? C.success : C.primary, icon: txn.type === 'topup' ? 'arrow-up-circle-outline' : 'cart-outline' })));
    setLoading(false); setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadWallet(); }, [loadWallet]);
  const onRefresh = () => { setRefreshing(true); loadWallet(); };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={LogoImage} style={styles.headerLogo} resizeMode="contain" />
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color={C.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.accent]} />}>
        <View style={styles.walletCard}>
          <View style={styles.walletTop}>
            <View style={styles.walletInfo}>
              <View style={styles.walletLabelRow}>
                <Text style={styles.walletLabel}>Wallet Balance</Text>
                <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}><Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={18} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
              </View>
              <Text style={styles.walletBalance}>{balanceVisible ? `UGX ${walletBalance.toLocaleString()}` : '****'}</Text>
              <View style={styles.availableBadge}><View style={styles.availableDot} /><Text style={styles.availableText}>Available Balance</Text></View>
            </View>
          </View>
          <View style={styles.walletActions}>
            {[{ icon: 'add-outline', label: 'Add Money', route: 'TopUp' },{ icon: 'send-outline', label: 'Send', route: 'SendMoney' },{ icon: 'arrow-down-outline', label: 'Withdraw' },{ icon: 'time-outline', label: 'History', route: 'MyOrders' }].map((action, i) => (<TouchableOpacity key={i} style={styles.walletActionItem} onPress={() => { if (action.route) navigation.navigate(action.route); }}><Ionicons name={action.icon} size={18} color={C.white} /><Text style={styles.walletActionText}>{action.label}</Text></TouchableOpacity>))}
          </View>
        </View>

        <View style={styles.secureBanner}><Ionicons name="shield-checkmark" size={18} color={C.accent} /><Text style={styles.secureText}>Your money is safe and secure with Munolink.</Text></View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent Transactions</Text><TouchableOpacity onPress={() => navigation.navigate('MyOrders')}><Text style={styles.viewAll}>View All</Text></TouchableOpacity></View>

        {loading ? <Text style={styles.loadingText}>Loading...</Text> : transactions.length === 0 ? <Text style={styles.noDataText}>No transactions yet.</Text> : transactions.map(txn => (
          <View key={txn.id} style={styles.transactionRow}>
            <View style={[styles.txnIconCircle, { backgroundColor: txn.color + '15' }]}><Ionicons name={txn.icon} size={18} color={txn.color} /></View>
            <View style={styles.txnInfo}><Text style={styles.txnDesc}>{txn.desc}</Text><Text style={styles.txnSource}>{txn.source}</Text><Text style={styles.txnDate}>{txn.date}</Text></View>
            <View style={styles.txnRight}><Text style={[styles.txnAmount, txn.amount.startsWith('+') ? styles.txnCredit : styles.txnDebit]}>{txn.amount} UGX</Text><View style={styles.txnStatusBadge}><Text style={styles.txnStatusText}>{txn.status}</Text></View></View>
          </View>
        ))}
        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}><Ionicons name="wallet" size={22} color={C.accent} /><Text style={[styles.navLabel, styles.navLabelActive]}>Wallet</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyOrders')}><Ionicons name="calendar-outline" size={22} color={C.muted} /><Text style={styles.navLabel}>Orders</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Connections')}><Ionicons name="people-outline" size={22} color={C.muted} /><Text style={styles.navLabel}>Connections</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Messages')}><Ionicons name="chatbubbles-outline" size={22} color={C.muted} /><View style={styles.navBadge}><Text style={styles.navBadgeText}>3</Text></View><Text style={styles.navLabel}>Messages</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Account')}><Ionicons name="person-outline" size={22} color={C.muted} /><Text style={styles.navLabel}>Account</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12, backgroundColor: C.white },
  headerLogo: { width: 120, height: 30, resizeMode: 'contain' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  loadingText: { fontSize: 14, color: C.muted, textAlign: 'center', paddingVertical: 20 },
  noDataText: { fontSize: 13, color: C.muted, textAlign: 'center', paddingVertical: 20 },
  walletCard: { backgroundColor: C.primary, borderRadius: 22, padding: 18, marginBottom: 14 },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  walletInfo: { flex: 1 },
  walletLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  walletBalance: { fontSize: 34, fontWeight: '800', color: C.white, marginBottom: 6 },
  availableBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availableDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  availableText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  walletActions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 14 },
  walletActionItem: { alignItems: 'center', gap: 4 },
  walletActionText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  secureBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.lightBg, borderRadius: 14, padding: 12, marginBottom: 18, gap: 8 },
  secureText: { flex: 1, fontSize: 12, color: C.accent, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  viewAll: { fontSize: 13, color: C.accent, fontWeight: '600' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10, backgroundColor: C.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border },
  txnIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 1 },
  txnSource: { fontSize: 11, color: C.muted, marginBottom: 1 },
  txnDate: { fontSize: 10, color: C.muted },
  txnRight: { alignItems: 'flex-end' },
  txnAmount: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  txnCredit: { color: C.success },
  txnDebit: { color: C.text },
  txnStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: C.greenBg },
  txnStatusText: { fontSize: 9, fontWeight: '700', color: C.success },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: C.white, paddingVertical: 8, paddingBottom: 35, borderTopWidth: 1, borderTopColor: C.border, position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', gap: 2, position: 'relative' },
  navBadge: { position: 'absolute', top: -6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: C.danger, justifyContent: 'center', alignItems: 'center' },
  navBadgeText: { fontSize: 9, fontWeight: '800', color: C.white },
  navLabel: { fontSize: 10, color: C.muted, fontWeight: '500' },
  navLabelActive: { color: C.accent, fontWeight: '700' },
});