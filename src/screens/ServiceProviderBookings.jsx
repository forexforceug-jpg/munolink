import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ServiceProviderBookings({ navigation }) {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { name: 'All', count: 17 },
    { name: 'Pending', count: 5, color: '#F57C00' },
    { name: 'Confirmed', count: 7, color: '#4CAF50' },
    { name: 'In Progress', count: 3, color: '#1976D2' },
    { name: 'Completed', count: 2, color: '#888888' },
  ];

  const bookings = [
    {
      id: 'BKG-001',
      service: 'Event MC Services',
      client: 'Hotel Africana',
      date: '1 June 2025',
      time: '06:00 PM',
      location: 'Kampala, Uganda',
      amount: 'UGX 300,000',
      status: 'Confirmed',
      statusColor: '#4CAF50',
      statusBg: '#E8F5E9',
      icon: 'mic-outline',
      iconBg: '#E8F5E9',
    },
    {
      id: 'BKG-002',
      service: 'Civil Engineering Consultation',
      client: 'Mary Namaganda',
      date: '3 June 2025',
      time: '10:00 AM',
      location: 'Kampala, Uganda',
      amount: 'UGX 150,000',
      status: 'Pending',
      statusColor: '#F57C00',
      statusBg: '#FFF3E0',
      icon: 'construct-outline',
      iconBg: '#FFF3E0',
    },
    {
      id: 'BKG-003',
      service: 'Home Electrical Installation',
      client: 'Brian Sekamatte',
      date: '5 June 2025',
      time: '02:00 PM',
      location: 'Jinja City',
      amount: 'UGX 200,000',
      status: 'Confirmed',
      statusColor: '#4CAF50',
      statusBg: '#E8F5E9',
      icon: 'flash-outline',
      iconBg: '#E8F5E9',
    },
    {
      id: 'BKG-004',
      service: 'Transport Services',
      client: 'Jinja Resort',
      date: '7 June 2025',
      time: '09:00 AM',
      location: 'Jinja City',
      amount: 'UGX 120,000',
      status: 'In Progress',
      statusColor: '#1976D2',
      statusBg: '#E3F2FD',
      icon: 'car-outline',
      iconBg: '#E3F2FD',
    },
    {
      id: 'BKG-005',
      service: 'Event Planning Package',
      client: 'Sunset Events',
      date: '12 June 2025',
      time: '04:00 PM',
      location: 'Kampala, Uganda',
      amount: 'UGX 500,000',
      status: 'Upcoming',
      statusColor: '#9C27B0',
      statusBg: '#F3E5F5',
      icon: 'calendar-outline',
      iconBg: '#F3E5F5',
    },
    {
      id: 'BKG-006',
      service: 'Medical Consultation',
      client: 'Dr. Esther Nalwoga',
      date: '15 June 2025',
      time: '11:00 AM',
      location: 'Kampala, Uganda',
      amount: 'UGX 100,000',
      status: 'Completed',
      statusColor: '#888888',
      statusBg: '#F5F5F5',
      icon: 'medkit-outline',
      iconBg: '#F5F5F5',
    },
  ];

  const filteredBookings = activeTab === 'All'
    ? bookings
    : bookings.filter((b) => b.status === activeTab || (activeTab === 'In Progress' && b.status === 'In Progress') || (activeTab === 'Upcoming' && b.status === 'Upcoming'));

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
        <Text style={styles.pageTitle}>Bookings</Text>
        <Text style={styles.pageSubtitle}>Manage all your bookings and service requests.</Text>

        {/* Status Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tab, activeTab === tab.name && styles.tabActive]}
              onPress={() => setActiveTab(tab.name)}
            >
              <Text style={[styles.tabText, activeTab === tab.name && styles.tabTextActive]}>
                {tab.name}
              </Text>
              <View style={[styles.tabCount, activeTab === tab.name && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, activeTab === tab.name && styles.tabCountTextActive]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search + Actions */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by client, service, or ID..."
              placeholderTextColor="#CCCCCC"
            />
          </View>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="options-outline" size={18} color="#006B3F" />
            <Text style={styles.actionBtnText}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="swap-vertical-outline" size={18} color="#006B3F" />
            <Text style={styles.actionBtnText}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Booking Cards */}
        {filteredBookings.map((booking, index) => (
          <View key={index} style={styles.bookingCard}>
            <View style={styles.bookingTop}>
              <View style={[styles.bookingIcon, { backgroundColor: booking.iconBg }]}>
                <Ionicons name={booking.icon} size={24} color={booking.statusColor} />
              </View>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingService}>{booking.service}</Text>
                <Text style={styles.bookingClient}>{booking.client}</Text>
                <View style={styles.bookingDetail}>
                  <Ionicons name="calendar-outline" size={12} color="#888" />
                  <Text style={styles.bookingDetailText}>{booking.date} · {booking.time}</Text>
                </View>
                <View style={styles.bookingDetail}>
                  <Ionicons name="location-outline" size={12} color="#888" />
                  <Text style={styles.bookingDetailText}>{booking.location}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.menuBtn}>
                <Ionicons name="ellipsis-vertical" size={18} color="#888" />
              </TouchableOpacity>
            </View>
            <View style={styles.bookingBottom}>
              <View style={[styles.statusBadge, { backgroundColor: booking.statusBg }]}>
                <Text style={[styles.statusText, { color: booking.statusColor }]}>
                  {booking.status}
                </Text>
              </View>
              <View style={styles.bookingRight}>
                <Text style={[styles.bookingAmount, { color: booking.statusColor }]}>
                  {booking.amount}
                </Text>
                <Text style={styles.bookingId}>{booking.id}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* End Message */}
        <View style={styles.endMessage}>
          <Text style={styles.endText}>You've reached the end</Text>
          <TouchableOpacity>
            <Text style={styles.refreshText}>Refresh</Text>
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
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="briefcase-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="wallet-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Earnings</Text>
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
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  tabsScroll: { marginBottom: 14 },
  tab: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, marginRight: 8, gap: 6,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  tabActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#FFFFFF' },
  tabCount: {
    backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabCountText: { fontSize: 11, fontWeight: '700', color: '#888' },
  tabCountTextActive: { color: '#FFFFFF' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#212121', marginLeft: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 14, paddingHorizontal: 12, gap: 4,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#006B3F' },
  bookingCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  bookingTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  bookingIcon: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
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
  endMessage: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 16 },
  endText: { fontSize: 13, color: '#888' },
  refreshText: { fontSize: 13, color: '#006B3F', fontWeight: '700' },
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