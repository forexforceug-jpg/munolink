import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ServiceProviderDashboard({ navigation }) {
  const [serviceType, setServiceType] = useState('Engineer');
  const [isAvailable, setIsAvailable] = useState(true);

  const stats = [
    { label: 'Bookings This Month', value: '12', icon: 'calendar-outline', color: '#006B3F', bg: '#E8F5E9' },
    { label: 'Pending Requests', value: '5', icon: 'clipboard-outline', color: '#1976D2', bg: '#E3F2FD' },
    { label: 'Completed Jobs', value: '8', icon: 'checkmark-circle-outline', color: '#9C27B0', bg: '#F3E5F5' },
    { label: 'Earnings This Month', value: 'UGX 1.24M', icon: 'cash-outline', color: '#F57C00', bg: '#FFF3E0' },
  ];

  const quickActions = [
    { icon: 'add-circle-outline', label: 'Add New Service', color: '#006B3F' },
    { icon: 'settings-outline', label: 'Manage Services', color: '#1976D2' },
    { icon: 'time-outline', label: 'Set Availability', color: '#9C27B0' },
    { icon: 'document-text-outline', label: 'View Requests', color: '#F57C00' },
    { icon: 'share-outline', label: 'Share Profile', color: '#4CAF50' },
    { icon: 'megaphone-outline', label: 'Promote Services', color: '#E91E63' },
    { icon: 'calendar-outline', label: 'My Schedule', color: '#00BCD4' },
    { icon: 'chatbubble-ellipses-outline', label: 'Messages', color: '#FF5722', badge: 3 },
  ];

  const schedule = [
    { time: '09:00 AM', title: 'Site Inspection - Building', location: 'Kampala, Uganda', status: 'Confirmed', color: '#4CAF50' },
    { time: '11:30 AM', title: 'Consultation', location: 'Jinja City', status: 'Confirmed', color: '#4CAF50' },
    { time: '02:00 PM', title: 'Project Discussion', location: 'Online Meeting', status: 'Upcoming', color: '#1976D2' },
    { time: '04:30 PM', title: 'Report Submission', location: 'Remote', status: 'Upcoming', color: '#1976D2' },
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
        {/* Greeting */}
        <Text style={styles.greeting}>Good morning, Alex! 👋</Text>
        <Text style={styles.greetingSub}>Here's what's happening with your services today.</Text>

        {/* Service Selector + Status */}
        <View style={styles.selectorRow}>
          <TouchableOpacity style={styles.serviceSelector}>
            <Ionicons name="construct-outline" size={18} color="#006B3F" />
            <Text style={styles.serviceText}>{serviceType}</Text>
            <Ionicons name="chevron-down" size={14} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusCard, isAvailable && styles.statusAvailable]}
            onPress={() => setIsAvailable(!isAvailable)}
          >
            <View style={[styles.statusDot, isAvailable ? styles.statusDotOn : styles.statusDotOff]} />
            <Text style={[styles.statusText, isAvailable && styles.statusTextOn]}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <Ionicons name={stat.icon} size={14} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickItem}>
              <View style={styles.quickIconWrapper}>
                <View style={[styles.quickIcon, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon} size={20} color={action.color} />
                </View>
                {action.badge && (
                  <View style={styles.quickBadge}>
                    <Text style={styles.quickBadgeText}>{action.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Schedule */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
          <TouchableOpacity>
            <Text style={styles.viewCalendar}>View calendar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.scheduleCard}>
          {schedule.map((item, index) => (
            <View key={index} style={styles.scheduleRow}>
              <View style={styles.scheduleTimeline}>
                <View style={[styles.timelineDot, { backgroundColor: item.color }]} />
                {index < schedule.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleTime}>{item.time}</Text>
                <Text style={styles.scheduleTitle}>{item.title}</Text>
                <Text style={styles.scheduleLocation}>📍 {item.location}</Text>
              </View>
              <View style={[styles.scheduleStatus, { backgroundColor: item.color + '15' }]}>
                <Text style={[styles.scheduleStatusText, { color: item.color }]}>{item.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Bookings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bookingCard}>
          <View style={styles.bookingLeft}>
            <View style={styles.bookingAvatar}>
              <Ionicons name="business-outline" size={24} color="#006B3F" />
            </View>
            <View>
              <Text style={styles.bookingName}>Hotel Africana</Text>
              <Text style={styles.bookingService}>Event MC Services</Text>
              <Text style={styles.bookingDate}>📅 1 June 2025 · 06:00 PM</Text>
            </View>
          </View>
          <View style={styles.bookingStatus}>
            <Text style={styles.bookingStatusText}>Upcoming</Text>
          </View>
        </View>

        {/* Get Verified Banner */}
        <View style={styles.verifyBanner}>
          <View style={styles.verifyLeft}>
            <View style={styles.verifyIcon}>
              <Ionicons name="shield-checkmark" size={28} color="#006B3F" />
            </View>
            <View>
              <Text style={styles.verifyTitle}>Get Verified</Text>
              <Text style={styles.verifySubtitle}>Increase trust and get more bookings.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.verifyBtn}>
            <Text style={styles.verifyBtnText}>Verify Now</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Service Provider Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="grid-outline" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
  style={styles.navItem}
  onPress={() => navigation.navigate('ServiceProviderBookings')}
>
  <Ionicons name="calendar-outline" size={22} color="#888" />
  <Text style={styles.navLabel}>Bookings</Text>
</TouchableOpacity>
        <TouchableOpacity
  style={styles.navItem}
  onPress={() => navigation.navigate('ServiceProviderServices')}
>
          <Ionicons name="briefcase-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity
  style={styles.navItem}
  onPress={() => navigation.navigate('ServiceProviderEarnings')}
>
          <Ionicons name="wallet-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity
  style={styles.navItem}
  onPress={() => navigation.navigate('ServiceProviderProfileScreen')}
>
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
  greeting: { fontSize: 22, fontWeight: '800', color: '#212121', marginBottom: 4 },
  greetingSub: { fontSize: 13, color: '#888', marginBottom: 18 },
  selectorRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  serviceSelector: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 8,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  serviceText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#212121' },
  statusCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 6,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  statusAvailable: { borderColor: '#4CAF50', backgroundColor: '#F5FFF5' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CCC' },
  statusDotOn: { backgroundColor: '#4CAF50' },
  statusDotOff: { backgroundColor: '#D32F2F' },
  statusText: { fontSize: 13, fontWeight: '600', color: '#888' },
  statusTextOn: { color: '#4CAF50' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  statCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statIcon: {
    width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  quickItem: { width: '23%', alignItems: 'center', marginBottom: 8 },
  quickIconWrapper: { position: 'relative', marginBottom: 6 },
  quickIcon: {
    width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  quickBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
  },
  quickBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  quickLabel: { fontSize: 9, fontWeight: '600', color: '#333', textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  viewCalendar: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  viewAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  scheduleCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  scheduleRow: { flexDirection: 'row', marginBottom: 4 },
  scheduleTimeline: { alignItems: 'center', width: 24, marginRight: 10 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, zIndex: 1 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E0E0E0', marginTop: -2, minHeight: 30 },
  scheduleContent: { flex: 1, paddingBottom: 16 },
  scheduleTime: { fontSize: 12, fontWeight: '700', color: '#212121', marginBottom: 2 },
  scheduleTitle: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 1 },
  scheduleLocation: { fontSize: 11, color: '#888' },
  scheduleStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  scheduleStatusText: { fontSize: 10, fontWeight: '700' },
  bookingCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, marginBottom: 18,
  },
  bookingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  bookingAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  bookingName: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 2 },
  bookingService: { fontSize: 12, color: '#006B3F', fontWeight: '500', marginBottom: 2 },
  bookingDate: { fontSize: 10, color: '#888' },
  bookingStatus: {
    backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  bookingStatusText: { fontSize: 11, fontWeight: '700', color: '#1976D2' },
  verifyBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F5E9', borderRadius: 18, padding: 16, marginTop: 4,
  },
  verifyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  verifyIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  verifyTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },
  verifySubtitle: { fontSize: 11, color: '#666' },
  verifyBtn: {
    borderWidth: 1.5, borderColor: '#006B3F',
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18,
  },
  verifyBtnText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
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