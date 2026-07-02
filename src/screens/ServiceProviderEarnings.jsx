import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ServiceProviderEarnings({ navigation }) {
  const [activePeriod, setActivePeriod] = useState('This Month');

  const earningsStats = [
    { label: 'Completed Jobs', value: 'UGX 980,000', icon: 'wallet-outline', color: '#4CAF50', bg: '#E8F5E9' },
    { label: 'Upcoming Jobs', value: 'UGX 260,000', icon: 'time-outline', color: '#1976D2', bg: '#E3F2FD' },
    { label: 'Cancelled / Refunded', value: 'UGX 0', icon: 'refresh-outline', color: '#F57C00', bg: '#FFF3E0' },
    { label: 'Pending Payout', value: 'UGX 150,000', icon: 'wallet-outline', color: '#9C27B0', bg: '#F3E5F5' },
  ];

  const breakdownItems = [
    { label: 'Engineering Services', percent: '35%', amount: 'UGX 434,000', color: '#4CAF50' },
    { label: 'Event Services', percent: '25%', amount: 'UGX 310,000', color: '#9C27B0' },
    { label: 'Transport Services', percent: '15%', amount: 'UGX 186,000', color: '#1976D2' },
    { label: 'Consultation', percent: '15%', amount: 'UGX 186,000', color: '#F57C00' },
    { label: 'Other Services', percent: '10%', amount: 'UGX 124,000', color: '#00897B' },
  ];

  const transactions = [
    { id: 1, service: 'Event MC Services', client: 'Hotel Africana', amount: '+UGX 300,000', status: 'Completed', color: '#4CAF50', icon: 'mic-outline', iconBg: '#F3E5F5' },
    { id: 2, service: 'Transport Services', client: 'Jinja Resort', amount: '+UGX 120,000', status: 'Completed', color: '#4CAF50', icon: 'car-outline', iconBg: '#E3F2FD' },
    { id: 3, service: 'Event Planning Package', client: 'Sunset Events', amount: '+UGX 500,000', status: 'Upcoming', color: '#1976D2', icon: 'calendar-outline', iconBg: '#FFF3E0' },
    { id: 4, service: 'Civil Engineering', client: 'Mary Namaganda', amount: '+UGX 150,000', status: 'Completed', color: '#4CAF50', icon: 'construct-outline', iconBg: '#E8F5E9' },
    { id: 5, service: 'Medical Consultation', client: 'Dr. Esther Nalwoga', amount: '+UGX 100,000', status: 'Completed', color: '#4CAF50', icon: 'medkit-outline', iconBg: '#E0F2F1' },
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
              <View style={styles.onlineDot} />
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
            <Text style={styles.pageTitle}>Earnings</Text>
            <Text style={styles.pageSubtitle}>Track your income and payouts.</Text>
          </View>
          <TouchableOpacity style={styles.periodBtn}>
            <Ionicons name="calendar-outline" size={16} color="#006B3F" />
            <Text style={styles.periodText}>{activePeriod}</Text>
            <Ionicons name="chevron-down" size={12} color="#006B3F" />
          </TouchableOpacity>
        </View>

        {/* Earnings Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View style={styles.overviewLeft}>
              <Text style={styles.overviewLabel}>Total Earnings</Text>
              <Text style={styles.overviewAmount}>UGX 1,240,000</Text>
              <View style={styles.growthRow}>
                <Ionicons name="trending-up" size={14} color="#4CAF50" />
                <Text style={styles.growthText}>18% vs last month</Text>
              </View>
            </View>
            <View style={styles.chartContainer}>
              {/* Simple line chart representation */}
              <View style={styles.chartArea}>
                <View style={styles.chartGrid}>
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                </View>
                <View style={styles.chartLine}>
                  <View style={[styles.chartPoint, { left: '5%', bottom: '15%' }]} />
                  <View style={[styles.chartPoint, { left: '20%', bottom: '25%' }]} />
                  <View style={[styles.chartPoint, { left: '35%', bottom: '40%' }]} />
                  <View style={[styles.chartPoint, { left: '50%', bottom: '35%' }]} />
                  <View style={[styles.chartPoint, { left: '65%', bottom: '55%' }]} />
                  <View style={[styles.chartPoint, { left: '80%', bottom: '65%' }]} />
                  <View style={[styles.chartPoint, { left: '95%', bottom: '85%' }]} />
                </View>
                <View style={styles.chartLabels}>
                  <Text style={styles.chartLabel}>1 May</Text>
                  <Text style={styles.chartLabel}>15 May</Text>
                  <Text style={styles.chartLabel}>29 May</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Earnings Stats */}
        <View style={styles.statsRow}>
          {earningsStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <Ionicons name={stat.icon} size={14} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Earnings Breakdown */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          <TouchableOpacity>
            <Text style={styles.viewReport}>View full report</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownLeft}>
            {breakdownItems.map((item, index) => (
              <View key={index} style={styles.breakdownRow}>
                <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
                <View style={styles.breakdownInfo}>
                  <Text style={styles.breakdownLabel}>{item.label}</Text>
                  <Text style={styles.breakdownPercent}>{item.percent}</Text>
                </View>
                <Text style={styles.breakdownAmount}>{item.amount}</Text>
              </View>
            ))}
          </View>
          <View style={styles.doughnutContainer}>
            <View style={styles.doughnut}>
              <View style={styles.doughnutCenter}>
                <Text style={styles.doughnutTotal}>UGX</Text>
                <Text style={styles.doughnutValue}>1.24M</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>
        {transactions.map((txn) => (
          <View key={txn.id} style={styles.transactionRow}>
            <View style={[styles.txnIcon, { backgroundColor: txn.iconBg }]}>
              <Ionicons name={txn.icon} size={18} color={txn.color} />
            </View>
            <View style={styles.txnInfo}>
              <Text style={styles.txnService}>{txn.service}</Text>
              <Text style={styles.txnClient}>{txn.client}</Text>
            </View>
            <View style={[styles.txnStatus, { backgroundColor: txn.color + '15' }]}>
              <Text style={[styles.txnStatusText, { color: txn.color }]}>{txn.status}</Text>
            </View>
            <Text style={styles.txnAmount}>{txn.amount}</Text>
          </View>
        ))}

        {/* Next Payout */}
        <View style={styles.payoutCard}>
          <View style={styles.payoutTop}>
            <View style={styles.payoutLeft}>
              <View style={styles.payoutIcon}>
                <Ionicons name="business-outline" size={24} color="#006B3F" />
              </View>
              <View>
                <Text style={styles.payoutAmount}>UGX 150,000</Text>
                <Text style={styles.payoutDesc}>Will be paid to your bank account</Text>
                <Text style={styles.payoutBank}>Centenary Bank •••• 1234</Text>
              </View>
            </View>
            <View style={styles.payoutDateCard}>
              <Text style={styles.payoutDateLabel}>Payout Date</Text>
              <Text style={styles.payoutDate}>5 June 2025</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.payoutHistoryBtn}>
            <Text style={styles.payoutHistoryText}>View Payout History</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Service Provider Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderDashboard')}>
          <Ionicons name="grid-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderBookings')}>
          <Ionicons name="calendar-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ServiceProviderServices')}>
          <Ionicons name="briefcase-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="wallet" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
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
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#FFFFFF',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121' },
  pageSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  periodBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, gap: 6,
  },
  periodText: { fontSize: 13, fontWeight: '600', color: '#006B3F' },
  overviewCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  overviewTop: { flexDirection: 'row' },
  overviewLeft: { flex: 1 },
  overviewLabel: { fontSize: 13, color: '#888', fontWeight: '500', marginBottom: 4 },
  overviewAmount: { fontSize: 28, fontWeight: '800', color: '#006B3F', marginBottom: 4 },
  growthRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  growthText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  chartContainer: { width: 140, height: 90 },
  chartArea: { flex: 1, position: 'relative' },
  chartGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' },
  gridLine: { height: 1, backgroundColor: '#F0F0F0' },
  chartLine: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 20 },
  chartPoint: {
    position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#006B3F',
  },
  chartLabels: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  chartLabel: { fontSize: 7, color: '#CCC' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  statCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statIcon: {
    width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 13, fontWeight: '800', color: '#212121', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  viewReport: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  viewAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  breakdownCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  breakdownLeft: { flex: 1 },
  breakdownRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
  },
  breakdownDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  breakdownInfo: { flex: 1 },
  breakdownLabel: { fontSize: 11, fontWeight: '600', color: '#555', marginBottom: 1 },
  breakdownPercent: { fontSize: 10, color: '#888' },
  breakdownAmount: { fontSize: 12, fontWeight: '700', color: '#212121' },
  doughnutContainer: { width: 90, height: 90, justifyContent: 'center', alignItems: 'center' },
  doughnut: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 8, borderColor: '#4CAF50',
    borderRightColor: '#9C27B0',
    borderBottomColor: '#1976D2',
    borderLeftColor: '#F57C00',
    justifyContent: 'center', alignItems: 'center',
  },
  doughnutCenter: { alignItems: 'center' },
  doughnutTotal: { fontSize: 8, color: '#888', fontWeight: '500' },
  doughnutValue: { fontSize: 12, fontWeight: '800', color: '#212121' },
  transactionRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12, marginBottom: 8, gap: 10,
  },
  txnIcon: {
    width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  txnInfo: { flex: 1 },
  txnService: { fontSize: 13, fontWeight: '600', color: '#212121', marginBottom: 1 },
  txnClient: { fontSize: 11, color: '#888' },
  txnStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  txnStatusText: { fontSize: 10, fontWeight: '700' },
  txnAmount: { fontSize: 14, fontWeight: '700', color: '#4CAF50' },
  payoutCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  payoutTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  payoutLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  payoutIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  payoutAmount: { fontSize: 18, fontWeight: '800', color: '#006B3F', marginBottom: 2 },
  payoutDesc: { fontSize: 11, color: '#888' },
  payoutBank: { fontSize: 11, color: '#888', fontWeight: '500' },
  payoutDateCard: {
    backgroundColor: '#F8F8F8', borderRadius: 12, padding: 10, alignItems: 'center',
  },
  payoutDateLabel: { fontSize: 9, color: '#888', fontWeight: '500' },
  payoutDate: { fontSize: 13, fontWeight: '800', color: '#212121' },
  payoutHistoryBtn: {
    borderWidth: 1.5, borderColor: '#006B3F',
    paddingVertical: 10, borderRadius: 22, alignItems: 'center',
  },
  payoutHistoryText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
});