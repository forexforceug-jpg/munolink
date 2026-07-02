import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function MyWallet({ navigation }) {
  const { user, login } = useAuth();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [walletBalance, setWalletBalance] = useState(user?.walletBalance || 0);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    if (user?.id) {
      const { data } = await supabase
        .from('users')
        .select('wallet_balance, lifetime_savings')
        .eq('id', user.id)
        .single();

      if (data) {
        setWalletBalance(data.wallet_balance);
        login({
          ...user,
          walletBalance: data.wallet_balance,
          lifetimeSavings: data.lifetime_savings,
        });
      }
    }
  };

  const quickActions = [
    { icon: 'phone-portrait-outline', label: 'Buy Airtime' },
    { icon: 'receipt-outline', label: 'Pay Bills' },
    { icon: 'add-circle-outline', label: 'Add Money' },
    { icon: 'swap-horizontal-outline', label: 'Bank Transfer' },
    { icon: 'arrow-down-circle-outline', label: 'Request' },
  ];

  const transactions = [
    { id: 1, type: 'payment', desc: 'Payment to QuickMart', source: 'Pharmacy', date: 'Today, 14:32', amount: '-8,400', status: 'Completed', icon: 'cart-outline', color: '#006B3F' },
    { id: 2, type: 'topup', desc: 'Wallet Top-Up', source: 'MTN Mobile Money', date: 'Today, 10:15', amount: '+50,000', status: 'Successful', icon: 'arrow-up-circle-outline', color: '#4CAF50' },
    { id: 3, type: 'transfer', desc: 'Sent to David O.', source: 'Munolink Transfer', date: 'Yesterday, 18:30', amount: '-15,000', status: 'Completed', icon: 'send-outline', color: '#F59E0B' },
    { id: 4, type: 'bill', desc: 'Electricity Bill', source: 'UMEME', date: '28 June, 09:45', amount: '-35,000', status: 'Completed', icon: 'flash-outline', color: '#6D4C41' },
    { id: 5, type: 'cashback', desc: 'Cashback Reward', source: 'Munolink Promo', date: '27 June, 16:20', amount: '+2,500', status: 'Credited', icon: 'gift-outline', color: '#9C27B0' },
  ];

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
        {/* Title Row */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.pageTitle}>My Wallet</Text>
            <Text style={styles.pageSubtitle}>Manage your balance and transactions.</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={18} color="#006B3F" />
            <Text style={styles.settingsText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletTop}>
            <View style={styles.walletInfo}>
              <View style={styles.walletLabelRow}>
                <Text style={styles.walletLabel}>Wallet Balance</Text>
                <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
                  <Ionicons
                    name={balanceVisible ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color="rgba(255,255,255,0.7)"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.walletBalance}>
                {balanceVisible ? `UGX ${walletBalance.toLocaleString()}` : '****'}
              </Text>
              <View style={styles.availableBadge}>
                <View style={styles.availableDot} />
                <Text style={styles.availableText}>Available Balance</Text>
              </View>
            </View>
            <View style={styles.walletRight}>
              <View style={styles.walletIllustration}>
                <Ionicons name="wallet-outline" size={40} color="rgba(255,255,255,0.3)" />
              </View>
              <TouchableOpacity style={styles.addCircleBtn}>
                <Ionicons name="add" size={22} color="#006B3F" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Wallet Quick Actions */}
          <View style={styles.walletActions}>
            {[
              { icon: 'add-outline', label: 'Add Money' },
              { icon: 'send-outline', label: 'Send Money' },
              { icon: 'arrow-down-outline', label: 'Withdraw' },
              { icon: 'time-outline', label: 'History' },
            ].map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.walletActionItem}
                onPress={() => {
                  if (action.label === 'Send Money') navigation.navigate('SendMoney');
                }}
              >
                <Ionicons name={action.icon} size={18} color="#FFFFFF" />
                <Text style={styles.walletActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Secure Banner */}
        <View style={styles.secureBanner}>
          <Ionicons name="shield-checkmark" size={18} color="#006B3F" />
          <Text style={styles.secureText}>Your money is safe and secure with Munolink.</Text>
          <View style={styles.secureBadge}>
            <Ionicons name="lock-closed" size={10} color="#006B3F" />
            <Text style={styles.secureBadgeText}>100% Secure</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickActionItem}>
              <View style={styles.quickActionIcon}>
                <Ionicons name={action.icon} size={22} color="#006B3F" />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyOrders')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {transactions.map((txn) => (
          <View key={txn.id} style={styles.transactionRow}>
            <View style={[styles.txnIconCircle, { backgroundColor: txn.color + '15' }]}>
              <Ionicons name={txn.icon} size={18} color={txn.color} />
            </View>
            <View style={styles.txnInfo}>
              <Text style={styles.txnDesc}>{txn.desc}</Text>
              <Text style={styles.txnSource}>{txn.source}</Text>
              <Text style={styles.txnDate}>{txn.date}</Text>
            </View>
            <View style={styles.txnRight}>
              <Text style={[styles.txnAmount, txn.amount.startsWith('+') ? styles.txnCredit : styles.txnDebit]}>
                {txn.amount.startsWith('+') ? txn.amount : txn.amount} UGX
              </Text>
              <View style={[styles.txnStatusBadge]}>
                <Text style={styles.txnStatusText}>{txn.status}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Promo Card */}
        <View style={styles.promoCard}>
          <View style={styles.promoLeft}>
            <Text style={styles.promoTitle}>Earn More with Munolink</Text>
            <Text style={styles.promoSubtitle}>Get cashback and exclusive deals.</Text>
            <TouchableOpacity style={styles.promoBtn}>
              <Text style={styles.promoBtnText}>Explore Deals</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.promoRight}>
            <Ionicons name="gift-outline" size={36} color="#006B3F" />
          </View>
        </View>

        <View style={{ height: 90 }} />
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
        <TouchableOpacity style={styles.payNavButton} onPress={() => navigation.navigate('PaymentConfirm')}>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121' },
  pageSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  settingsBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4,
  },
  settingsText: { fontSize: 12, fontWeight: '600', color: '#006B3F' },
  walletCard: {
    backgroundColor: '#006B3F', borderRadius: 22, padding: 18, marginBottom: 14,
  },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  walletInfo: { flex: 1 },
  walletLabelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4,
  },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  walletBalance: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  availableBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availableDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  availableText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  walletRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  walletIllustration: { marginBottom: 8 },
  addCircleBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  walletActions: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 14,
  },
  walletActionItem: { alignItems: 'center', gap: 4 },
  walletActionText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  secureBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', borderRadius: 14, padding: 12, marginBottom: 18, gap: 8,
  },
  secureText: { flex: 1, fontSize: 12, color: '#006B3F', fontWeight: '500' },
  secureBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 3,
  },
  secureBadgeText: { fontSize: 10, fontWeight: '700', color: '#006B3F' },
  quickActionsRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22,
  },
  quickActionItem: { alignItems: 'center', width: '18%' },
  quickActionIcon: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  quickActionLabel: { fontSize: 10, color: '#333', fontWeight: '500', textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  viewAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  transactionRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10,
  },
  txnIconCircle: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: 13, fontWeight: '600', color: '#212121', marginBottom: 1 },
  txnSource: { fontSize: 11, color: '#888', marginBottom: 1 },
  txnDate: { fontSize: 10, color: '#AAA' },
  txnRight: { alignItems: 'flex-end' },
  txnAmount: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  txnCredit: { color: '#4CAF50' },
  txnDebit: { color: '#212121' },
  txnStatusBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#E8F5E9',
  },
  txnStatusText: { fontSize: 9, fontWeight: '700', color: '#4CAF50' },
  promoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', borderRadius: 18, padding: 16, marginTop: 4,
  },
  promoLeft: { flex: 1 },
  promoTitle: { fontSize: 14, fontWeight: '800', color: '#212121', marginBottom: 4 },
  promoSubtitle: { fontSize: 12, color: '#666', marginBottom: 10 },
  promoBtn: {
    backgroundColor: '#006B3F', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, alignSelf: 'flex-start',
  },
  promoBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  promoRight: { paddingLeft: 12 },
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