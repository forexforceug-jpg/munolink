import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ShopOwnerDashboard({ navigation }) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('Today');

  const stats = [
    { label: "Today's Sales", value: 'UGX 248,600', trend: '↑ 18%', trendUp: true, icon: 'trending-up-outline' },
    { label: 'Orders', value: '23', sub: '5 pending', icon: 'receipt-outline' },
    { label: 'Customers', value: '156', sub: '+12 this week', icon: 'people-outline' },
    { label: 'Rating', value: '4.8 ⭐', sub: '247 reviews', icon: 'star-outline' },
  ];

  const orders = [
    { id: '#MUNO-001', customer: 'Sarah K.', amount: 'UGX 24,500', status: 'Pending', statusColor: '#F59E0B', statusBg: '#FFF8E1' },
    { id: '#MUNO-002', customer: 'David O.', amount: 'UGX 18,000', status: 'Confirmed', statusColor: '#1976D2', statusBg: '#E3F2FD' },
    { id: '#MUNO-003', customer: 'Grace N.', amount: 'UGX 32,000', status: 'On the Way', statusColor: '#9C27B0', statusBg: '#F3E5F5' },
    { id: '#MUNO-004', customer: 'Peter M.', amount: 'UGX 12,500', status: 'Delivered', statusColor: '#4CAF50', statusBg: '#E8F5E9' },
    { id: '#MUNO-005', customer: 'Aisha L.', amount: 'UGX 45,000', status: 'Pending', statusColor: '#F59E0B', statusBg: '#FFF8E1' },
  ];

  const quickActions = [
    { icon: 'add-circle-outline', label: 'Add Product' },
    { icon: 'camera-outline', label: 'Scan Payment' },
    { icon: 'clipboard-outline', label: 'View Orders', badge: 5 },
    { icon: 'megaphone-outline', label: 'Run Promotion' },
    { icon: 'person-add-outline', label: 'Add Staff' },
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
        {/* Business Profile */}
        <View style={styles.businessProfile}>
          <View style={styles.businessLeft}>
            <View style={styles.shopPhoto}>
              <Ionicons name="storefront" size={28} color="#006B3F" />
              <View style={styles.editPhotoBadge}>
                <Ionicons name="pencil" size={10} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.businessInfo}>
              <View style={styles.shopNameRow}>
                <Text style={styles.shopName}>Green Pharmacy</Text>
                <Ionicons name="checkmark-circle" size={16} color="#006B3F" />
              </View>
              <View style={styles.badgesRow}>
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>Shop Owner</Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={10} color="#006B3F" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color="#888" />
                <Text style={styles.locationText}>Nile View Road, Jinja City</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.viewProfileBtn}>
            <Text style={styles.viewProfileText}>View Shop Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletTop}>
            <View style={styles.walletLeft}>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <View style={styles.walletAmountRow}>
                <Text style={styles.walletAmount}>
                  {balanceVisible ? 'UGX 356,800' : '****'}
                </Text>
                <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
                  <Ionicons
                    name={balanceVisible ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color="rgba(255,255,255,0.7)"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.walletSubtext}>Available for withdrawal</Text>
            </View>
            <View style={styles.walletButtons}>
              <TouchableOpacity style={styles.withdrawBtn}>
                <Ionicons name="arrow-down-outline" size={16} color="#006B3F" />
                <Text style={styles.withdrawText}>Withdraw</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.historyBtn}>
                <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                <Text style={styles.historyText}>History</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Ionicons name={stat.icon} size={16} color="#006B3F" />
                {stat.trend && (
                  <Text style={[styles.statTrend, stat.trendUp && styles.statTrendUp]}>
                    {stat.trend}
                  </Text>
                )}
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              {stat.sub && <Text style={styles.statSub}>{stat.sub}</Text>}
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickActionItem}>
              <View style={styles.quickActionIcon}>
                <Ionicons name={action.icon} size={22} color="#006B3F" />
                {action.badge && (
                  <View style={styles.quickActionBadge}>
                    <Text style={styles.quickActionBadgeText}>{action.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Orders Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Orders Overview</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {orders.map((order, index) => (
          <View key={index} style={styles.orderRow}>
            <View style={styles.orderCustomer}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerInitial}>{order.customer.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.orderId}>{order.id}</Text>
                <Text style={styles.customerName}>{order.customer}</Text>
              </View>
            </View>
            <Text style={styles.orderAmount}>{order.amount}</Text>
            <View style={[styles.orderStatus, { backgroundColor: order.statusBg }]}>
              <Text style={[styles.orderStatusText, { color: order.statusColor }]}>
                {order.status}
              </Text>
            </View>
          </View>
        ))}

        {/* Sales Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sales Overview</Text>
        </View>
        <View style={styles.salesCard}>
          <View style={styles.salesTop}>
            <View>
              <Text style={styles.salesLabel}>Today's Total Sales</Text>
              <Text style={styles.salesValue}>UGX 248,600</Text>
              <View style={styles.salesTrend}>
                <Ionicons name="trending-up" size={14} color="#4CAF50" />
                <Text style={styles.salesTrendText}>18% vs yesterday</Text>
              </View>
            </View>
            <View style={styles.chartTabs}>
              {['Today', 'This Week', 'This Month'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.chartTab, activeTab === tab && styles.chartTabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.chartTabText, activeTab === tab && styles.chartTabTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* Simple Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              {[20, 35, 28, 50, 65, 45, 80, 95, 70, 55, 85, 60].map((height, index) => (
                <View key={index} style={styles.chartBarCol}>
                  <View style={[styles.chartBar, { height: height * 0.8 }]} />
                  <Text style={styles.chartLabel}>{index * 2}h</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartHighlight}>
              <View style={styles.highlightDot} />
              <Text style={styles.highlightText}>10:00 AM — UGX 86,400</Text>
            </View>
          </View>
        </View>

        {/* Boost Banner */}
        <View style={styles.boostBanner}>
          <View style={styles.boostLeft}>
            <View style={styles.boostIcon}>
              <Ionicons name="bag-handle-outline" size={28} color="#006B3F" />
            </View>
            <View>
              <Text style={styles.boostTitle}>Boost Your Sales</Text>
              <Text style={styles.boostSubtitle}>Run promotions and reach more customers.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.boostBtn}>
            <Text style={styles.boostBtnText}>Create Promotion</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Seller Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="grid-outline" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Dashboard</Text>
        </TouchableOpacity>
<TouchableOpacity
  style={styles.navItem}
  onPress={() => navigation.navigate('SellerProducts')}
>
  <Ionicons name="cube-outline" size={22} color="#888" />
  <Text style={styles.navLabel}>Products</Text>
</TouchableOpacity>
<TouchableOpacity
  style={styles.navItem}
  onPress={() => navigation.navigate('SellerOrders')}
>
  <View style={styles.navIconWrapper}>
    <Ionicons name="receipt-outline" size={22} color="#888" />
    <View style={styles.navBadge}>
      <Text style={styles.navBadgeText}>5</Text>
    </View>
  </View>
  <Text style={styles.navLabel}>Orders</Text>
</TouchableOpacity>
<TouchableOpacity
  style={styles.navItem}
  onPress={() => navigation.navigate('SellerWallet')}
>
  <Ionicons name="wallet-outline" size={22} color="#888" />
  <Text style={styles.navLabel}>Wallet</Text>
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
  businessProfile: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  businessLeft: { flexDirection: 'row', flex: 1 },
  shopPhoto: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
    marginRight: 10, position: 'relative',
  },
  editPhotoBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#00C853', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  businessInfo: { flex: 1 },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  shopName: { fontSize: 16, fontWeight: '800', color: '#212121' },
  badgesRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  ownerBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  ownerBadgeText: { fontSize: 9, fontWeight: '700', color: '#006B3F' },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 3,
  },
  verifiedText: { fontSize: 9, fontWeight: '600', color: '#006B3F' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText: { fontSize: 11, color: '#888' },
  viewProfileBtn: {
    borderWidth: 1.5, borderColor: '#006B3F',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18,
  },
  viewProfileText: { fontSize: 11, fontWeight: '700', color: '#006B3F' },
  walletCard: {
    backgroundColor: '#006B3F', borderRadius: 20, padding: 18, marginBottom: 16,
  },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLeft: { flex: 1 },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  walletAmountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 4 },
  walletAmount: { fontSize: 30, fontWeight: '800', color: '#FFFFFF' },
  walletSubtext: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  walletButtons: { gap: 8 },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, gap: 4,
  },
  withdrawText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  historyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, gap: 4,
  },
  historyText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  statCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  statTrend: { fontSize: 11, fontWeight: '700', color: '#D32F2F' },
  statTrendUp: { color: '#4CAF50' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  statSub: { fontSize: 10, color: '#006B3F', fontWeight: '600', marginTop: 2 },
  quickActionsRow: { flexDirection: 'row', gap: 6, marginBottom: 22 },
  quickActionItem: {
    flex: 1, alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 10, gap: 4,
  },
  quickActionIcon: { position: 'relative', width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  quickActionBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
  },
  quickActionBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  quickActionLabel: { fontSize: 9, fontWeight: '600', color: '#333', textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  viewAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  orderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8F8F8', borderRadius: 12, padding: 10, marginBottom: 6,
  },
  orderCustomer: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  customerAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  customerInitial: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  orderId: { fontSize: 11, fontWeight: '700', color: '#212121' },
  customerName: { fontSize: 10, color: '#888' },
  orderAmount: { fontSize: 13, fontWeight: '700', color: '#212121', marginRight: 10 },
  orderStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  orderStatusText: { fontSize: 10, fontWeight: '700' },
  salesCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  salesTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  salesLabel: { fontSize: 12, color: '#888', fontWeight: '500' },
  salesValue: { fontSize: 22, fontWeight: '800', color: '#212121', marginTop: 2, marginBottom: 4 },
  salesTrend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  salesTrendText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  chartTabs: { flexDirection: 'row', gap: 4 },
  chartTab: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#F5F5F5' },
  chartTabActive: { backgroundColor: '#006B3F' },
  chartTabText: { fontSize: 10, fontWeight: '600', color: '#888' },
  chartTabTextActive: { color: '#FFFFFF' },
  chartContainer: { marginTop: 8 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100, marginBottom: 8 },
  chartBarCol: { alignItems: 'center', flex: 1 },
  chartBar: { width: 12, backgroundColor: '#E8F5E9', borderRadius: 6 },
  chartLabel: { fontSize: 7, color: '#CCC', marginTop: 2 },
  chartHighlight: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8,
    backgroundColor: '#F8F8F8', paddingVertical: 8, borderRadius: 10,
  },
  highlightDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#006B3F' },
  highlightText: { fontSize: 12, color: '#555', fontWeight: '600' },
  boostBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F5E9', borderRadius: 18, padding: 16, marginTop: 4,
  },
  boostLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  boostIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  boostTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },
  boostSubtitle: { fontSize: 11, color: '#666' },
  boostBtn: {
    backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20,
  },
  boostBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
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