import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ServiceProviderServices({ navigation }) {
  const [activeTab, setActiveTab] = useState('All Services');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { name: 'All Services', count: 6 },
    { name: 'Active', count: 5, color: '#4CAF50' },
    { name: 'Inactive', count: 1, color: '#F57C00' },
    { name: 'Draft', count: 0, color: '#888' },
  ];

  const services = [
    {
      id: 1, name: 'Civil Engineering Consultation', price: 'UGX 150,000',
      desc: 'Consultation for building projects and structural designs.',
      duration: '2 hours', format: 'Online / In-Person', location: 'Kampala, Uganda',
      status: 'Active', active: true,
      icon: 'construct-outline', color: '#006B3F', bg: '#E8F5E9',
    },
    {
      id: 2, name: 'Electrical Installation', price: 'UGX 200,000',
      desc: 'Wiring, repairs, and maintenance services for homes and businesses.',
      duration: '3-5 hours', format: 'In-Person', location: 'Jinja City',
      status: 'Active', active: true,
      icon: 'flash-outline', color: '#F57C00', bg: '#FFF3E0',
    },
    {
      id: 3, name: 'Transport Services', price: 'UGX 120,000',
      desc: 'Passenger and goods transport within and outside the city.',
      duration: 'Varies', format: 'In-Person', location: 'Kampala & Jinja',
      status: 'Active', active: true,
      icon: 'car-outline', color: '#1976D2', bg: '#E3F2FD',
    },
    {
      id: 4, name: 'Event MC Services', price: 'UGX 300,000',
      desc: 'Professional MC services for weddings, corporate events, and parties.',
      duration: '4-8 hours', format: 'In-Person', location: 'Kampala, Uganda',
      status: 'Active', active: true,
      icon: 'mic-outline', color: '#9C27B0', bg: '#F3E5F5',
    },
    {
      id: 5, name: 'Event Planning Package', price: 'UGX 500,000',
      desc: 'Complete event planning and coordination for all occasions.',
      duration: 'Full day', format: 'In-Person', location: 'Kampala, Uganda',
      status: 'Inactive', active: false,
      icon: 'calendar-outline', color: '#F57C00', bg: '#FFF3E0',
    },
    {
      id: 6, name: 'Medical Consultation', price: 'UGX 100,000',
      desc: 'General consultation and diagnosis. Clinic and online appointments.',
      duration: '30-60 min', format: 'Online / In-Person', location: 'Kampala, Uganda',
      status: 'Active', active: true,
      icon: 'medkit-outline', color: '#00897B', bg: '#E0F2F1',
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
            <Text style={styles.pageTitle}>Services</Text>
            <Text style={styles.pageSubtitle}>Manage the services you offer to customers.</Text>
          </View>
          <TouchableOpacity style={styles.addServiceBtn}>
            <Ionicons name="add" size={18} color="#006B3F" />
            <Text style={styles.addServiceText}>Add New Service</Text>
          </TouchableOpacity>
        </View>

        {/* Status Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tab, activeTab === tab.name && styles.tabActive]}
              onPress={() => setActiveTab(tab.name)}
            >
              {tab.color && <View style={[styles.tabDot, { backgroundColor: tab.color }]} />}
              <Text style={[styles.tabText, activeTab === tab.name && styles.tabTextActive]}>
                {tab.name}
              </Text>
              <Text style={[styles.tabCountText, activeTab === tab.name && styles.tabCountActive]}>
                ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search + Sort */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search your services..."
              placeholderTextColor="#CCCCCC"
            />
          </View>
          <TouchableOpacity style={styles.sortBtn}>
            <Ionicons name="swap-vertical-outline" size={18} color="#006B3F" />
            <Text style={styles.sortBtnText}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Service Cards */}
        {services.map((service) => (
          <View key={service.id} style={[styles.serviceCard, !service.active && styles.serviceCardInactive]}>
            <View style={styles.serviceTop}>
              <View style={[styles.serviceIcon, { backgroundColor: service.bg }]}>
                <Ionicons name={service.icon} size={28} color={service.color} />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>{service.price}</Text>
                <Text style={styles.serviceDesc}>{service.desc}</Text>
                <View style={styles.serviceChips}>
                  <View style={styles.chip}>
                    <Ionicons name="time-outline" size={10} color="#888" />
                    <Text style={styles.chipText}>{service.duration}</Text>
                  </View>
                  <View style={styles.chip}>
                    <Ionicons name="videocam-outline" size={10} color="#888" />
                    <Text style={styles.chipText}>{service.format}</Text>
                  </View>
                  <View style={styles.chip}>
                    <Ionicons name="location-outline" size={10} color="#888" />
                    <Text style={styles.chipText}>{service.location}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.serviceRight}>
                <View style={[styles.statusBadge, { backgroundColor: service.active ? '#E8F5E9' : '#FFF3E0' }]}>
                  <Text style={[styles.statusText, { color: service.active ? '#4CAF50' : '#F57C00' }]}>
                    {service.status}
                  </Text>
                </View>
                <TouchableOpacity style={styles.menuBtn}>
                  <Ionicons name="ellipsis-vertical" size={18} color="#888" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.serviceBottom}>
              <Switch
                value={service.active}
                trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                thumbColor={service.active ? '#4CAF50' : '#CCC'}
              />
            </View>
          </View>
        ))}

        {/* Boost Banner */}
        <View style={styles.boostBanner}>
          <View style={styles.boostLeft}>
            <View style={styles.boostIcon}>
              <Ionicons name="ribbon-outline" size={28} color="#006B3F" />
            </View>
            <View>
              <Text style={styles.boostTitle}>Boost Your Visibility</Text>
              <Text style={styles.boostSubtitle}>Promote your services and reach more customers.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.boostBtn}>
            <Text style={styles.boostBtnText}>Promote Services</Text>
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
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="briefcase" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Services</Text>
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
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16,
  },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121' },
  pageSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  addServiceBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#006B3F',
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 22, gap: 6,
  },
  addServiceText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  tabsScroll: { marginBottom: 14 },
  tab: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, marginRight: 8, gap: 4,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  tabActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  tabDot: { width: 8, height: 8, borderRadius: 4 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#FFFFFF' },
  tabCountText: { fontSize: 11, fontWeight: '600', color: '#888' },
  tabCountActive: { color: '#FFFFFF' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#212121', marginLeft: 8 },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 14, paddingHorizontal: 14, gap: 4,
  },
  sortBtnText: { fontSize: 13, fontWeight: '600', color: '#006B3F' },
  serviceCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  serviceCardInactive: { opacity: 0.7 },
  serviceTop: { flexDirection: 'row', marginBottom: 10 },
  serviceIcon: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 2 },
  servicePrice: { fontSize: 15, fontWeight: '800', color: '#006B3F', marginBottom: 4 },
  serviceDesc: { fontSize: 12, color: '#888', lineHeight: 17, marginBottom: 8 },
  serviceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4,
  },
  chipText: { fontSize: 10, color: '#888', fontWeight: '500' },
  serviceRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  menuBtn: { padding: 4 },
  serviceBottom: { alignItems: 'flex-end' },
  boostBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F5E9', borderRadius: 18, padding: 16, marginTop: 8,
  },
  boostLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  boostIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  boostTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },
  boostSubtitle: { fontSize: 11, color: '#666' },
  boostBtn: {
    borderWidth: 1.5, borderColor: '#006B3F',
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18,
  },
  boostBtnText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
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