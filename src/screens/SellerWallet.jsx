import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SellerWallet({ navigation }) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activePeriod, setActivePeriod] = useState('This Month');

  const quickActions = [
    { icon: 'swap-horizontal-outline', label: 'Bank Transfer' },
    { icon: 'phone-portrait-outline', label: 'Mobile Money' },
    { icon: 'qr-code-outline', label: 'Scan to Receive' },
    { icon: 'link-outline', label: 'Payment Links' },
    { icon: 'time-outline', label: 'History' },
  ];

  const overviewCards = [
    { label: 'Total Received', value: 'UGX 1,248,600', trend: '↑ 22%', icon: 'arrow-down-circle-outline', color: '#4CAF50' },
    { label: 'Total Withdrawn', value: 'UGX 892,000', trend: '↑ 8%', icon: 'arrow-up-circle-outline', color: '#F57C00' },
    { label: 'Net Earnings', value: 'UGX 356,600', trend: '↑ 14%', icon: 'wallet-outline', color: '#006B3F' },
    { label: 'Pending Payouts', value: 'UGX 67,500', sub: '2 transactions', icon: 'time-outline', color: '#9C27B0' },
  ];

  const transactions = [
    {
      id: 1, type: 'received', desc: 'Order Payment #MUNO-001', ref: 'Ref: TXN-0629-001', account: 'From: Sarah N.',
      date: 'Today, 14:32', amount: '+24,500', balance: 'UGX 356,800', color: '#4CAF50', bg: '#E8F5E9',
      icon: 'cart-outline',
    },
    {
      id: 2, type: 'withdrawn', desc: 'Withdrawal to MTN MoMo', ref: 'Ref: WTH-0629-001', account: 'To: 0772 345 678',
      date: 'Today, 10:15', amount: '-50,000', balance: 'UGX 332,300', color: '#F57C00', bg: '#FFF3E0',
      icon: 'phone-portrait-outline',
    },
    {
      id: 3, type: 'received', desc: 'Order Payment #MUNO-002', ref: 'Ref: TXN-0628-002', account: 'From: Brian K.',
      date: 'Yesterday, 16:45', amount: '+18,000', balance: 'UGX 382,300', color: '#4CAF50', bg: '#E8F5E9',
      icon: 'cart-outline',
    },
    {
      id: 4, type: 'transferred', desc: 'Bank Transfer to Centenary', ref: 'Ref: BNK-0628-001', account: 'A/C: 3200123456',
      date: 'Yesterday, 09:20', amount: '-100,000', balance: 'UGX 364,300', color: '#1976D2', bg: '#E3F2FD',
      icon: 'business-outline',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu-outline" size={26} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.logo}>MUNOLINK</Text>
          <Text style={styles.tagline}>For Better Connections</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>5</Text>
            </View>
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
        {/* Title */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.pageTitle}>Wallet</Text>
            <Text style={styles.pageSubtitle}>Manage your earnings and transactions.</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={16} color="#006B3F" />
            <Text style={styles.settingsText}>Settings</Text>
            <Ionicons name="chevron-down" size={12} color="#006B3F" />
          </TouchableOpacity>
        </View>

        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletTop}>
            <View style={styles.walletLeft}>
              <View style={styles.walletLabelRow}>
                <Text style={styles.walletLabel}>Available Balance</Text>
                <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
                  <Ionicons
                    name={balanceVisible ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color="rgba(255,255,255,0.7)"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.walletAmount}>
                {balanceVisible ? 'UGX 356,800' : '****'}
              </Text>
              <Text style={styles.walletSubtext}>Available for withdrawal</Text>
            </View>
            <View style={styles.walletButtons}>
              <TouchableOpacity style={styles.withdrawBtn}>
                <Ionicons name="arrow-down-outline" size={18} color="#006B3F" />
                <Text style={styles.withdrawText}>Withdraw Money</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addMoneyBtn}>
                <Ionicons name="add-outline" size={18} color="#FFFFFF" />
                <Text style={styles.addMoneyText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.lockedBalance}>
            <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.lockedText}>Locked Balance: UGX 45,200</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickActionItem}>
              <View style={styles.quickActionIcon}>
                <Ionicons name={action.icon} size={20} color="#006B3F" />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Wallet Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Wallet Overview</Text>
          <TouchableOpacity style={styles.periodBtn}>
            <Text style={styles.periodText}>{activePeriod}</Text>
            <Ionicons name="chevron-down" size={12} color="#006B3F" />
          </TouchableOpacity>
        </View>
        <View style={styles.overviewGrid}>
          {overviewCards.map((card, index) => (
            <View key={index} style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <Ionicons name={card.icon} size={16} color={card.color} />
                <Text style={[styles.overviewTrend, { color: card.color }]}>{card.trend}</Text>
              </View>
              <Text style={styles.overviewValue}>{card.value}</Text>
              <Text style={styles.overviewLabel}>{card.label}</Text>
              {card.sub && <Text style={styles.overviewSub}>{card.sub}</Text>}
            </View>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {transactions.map((txn) => (
          <View key={txn.id} style={styles.transactionRow}>
            <View style={[styles.txnIconCircle, { backgroundColor: txn.bg }]}>
              <Ionicons name={txn.icon} size={18} color={txn.color} />
            </View>
            <View style={styles.txnInfo}>
              <Text style={styles.txnDesc}>{txn.desc}</Text>
              <Text style={styles.txnRef}>{txn.ref}</Text>
              <Text style={styles.txnAccount}>{txn.account}</Text>
              <Text style={styles.txnDate}>{txn.date}</Text>
            </View>
            <View style={styles.txnMiddle}>
              <View style={[styles.txnStatusBadge, { backgroundColor: txn.bg }]}>
                <Text style={[styles.txnStatusText, { color: txn.color }]}>
                  {txn.type === 'received' ? 'Received' : txn.type === 'withdrawn' ? 'Withdrawn' : 'Transferred'}
                </Text>
              </View>
            </View>
            <View style={styles.txnRight}>
              <Text style={[styles.txnAmount, txn.amount.startsWith('+') ? styles.txnCredit : styles.txnDebit]}>
                {txn.amount} UGX
              </Text>
              <Text style={styles.txnBalance}>{txn.balance}</Text>
            </View>
          </View>
        ))}

        {/* Security Banner */}
        <View style={styles.securityBanner}>
          <View style={styles.securityLeft}>
            <View style={styles.securityIcon}>
              <Ionicons name="wallet-outline" size={24} color="#006B3F" />
            </View>
            <View style={styles.securityInfo}>
              <Text style={styles.securityTitle}>Secure & Safe Transactions</Text>
              <Text style={styles.securitySubtitle}>Bank-level security protecting your earnings.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.learnMoreBtn}>
            <Text style={styles.learnMoreText}>Learn More</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Seller Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ShopOwnerDashboard')}>
          <Ionicons name="grid-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SellerProducts')}>
          <Ionicons name="cube-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SellerOrders')}>
          <View style={styles.navIconWrapper}>
            <Ionicons name="receipt-outline" size={22} color="#888" />
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>5</Text>
            </View>
          </View>
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="wallet" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Wallet</Text>
        </TouchableOpacity>
<TouchableOpacity
  style={styles.navItem}
  onPress={() => navigation.navigate('SellerAccount')}
>
  <Ionicons name="person-outline" size={22} color="#888" />
  <Text style={styles.navLabel}>Account</Text>
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
  headerCenter: { alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 9, color: '#888' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { position: 'relative' },
  notifBadge: {
    position: 'absolute', top: -4, right: -6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
  },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  profilePic: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121' },
  pageSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  settingsBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, gap: 4,
  },
  settingsText: { fontSize: 12, fontWeight: '600', color: '#006B3F' },
  walletCard: { backgroundColor: '#006B3F', borderRadius: 22, padding: 20, marginBottom: 16 },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  walletLeft: { flex: 1 },
  walletLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  walletAmount: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  walletSubtext: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  walletButtons: { gap: 10 },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 22, gap: 6,
  },
  withdrawText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  addMoneyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 22, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  addMoneyText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  lockedBalance: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)', paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10, gap: 6,
  },
  lockedText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  quickActionsRow: { flexDirection: 'row', gap: 6, marginBottom: 22 },
  quickActionItem: {
    flex: 1, alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 10, gap: 4,
  },
  quickActionIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  quickActionLabel: { fontSize: 9, fontWeight: '600', color: '#333', textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  periodBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  periodText: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  viewAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  overviewCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  overviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  overviewTrend: { fontSize: 10, fontWeight: '700' },
  overviewValue: { fontSize: 14, fontWeight: '800', color: '#212121', marginBottom: 2 },
  overviewLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  overviewSub: { fontSize: 10, color: '#9C27B0', fontWeight: '600', marginTop: 2 },
  transactionRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12, marginBottom: 8, gap: 10,
  },
  txnIconCircle: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: 13, fontWeight: '600', color: '#212121', marginBottom: 1 },
  txnRef: { fontSize: 10, color: '#888' },
  txnAccount: { fontSize: 10, color: '#888' },
  txnDate: { fontSize: 10, color: '#AAA', marginTop: 1 },
  txnMiddle: { marginRight: 8 },
  txnStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  txnStatusText: { fontSize: 10, fontWeight: '700' },
  txnRight: { alignItems: 'flex-end' },
  txnAmount: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  txnCredit: { color: '#4CAF50' },
  txnDebit: { color: '#212121' },
  txnBalance: { fontSize: 10, color: '#AAA' },
  securityBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F5E9', borderRadius: 18, padding: 16, marginTop: 8,
  },
  securityLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  securityIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  securityInfo: { flex: 1 },
  securityTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },
  securitySubtitle: { fontSize: 11, color: '#666' },
  learnMoreBtn: {
    borderWidth: 1.5, borderColor: '#006B3F',
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18,
  },
  learnMoreText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  navItem: { alignItems: 'center', gap: 2 },
  navIconWrapper: { position: 'relative' },
  navBadge: {
    position: 'absolute', top: -4, right: -6,
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
  },
  navBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
});