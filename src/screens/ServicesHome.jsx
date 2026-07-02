import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ServicesHome({ navigation }) {
  const categories = [
    { name: 'Plumbing', icon: 'water-outline', color: '#E3F2FD' },
    { name: 'Electricians', icon: 'flash-outline', color: '#FFF3E0' },
    { name: 'Hair & Beauty', icon: 'cut-outline', color: '#FCE4EC' },
    { name: 'Healthcare', icon: 'medkit-outline', color: '#E8F5E9' },
    { name: 'Tutors', icon: 'school-outline', color: '#F3E5F5' },
    { name: 'Transport', icon: 'car-outline', color: '#E0F7FA' },
    { name: 'Cleaning', icon: 'sparkles-outline', color: '#FFF8E1' },
    { name: 'Mechanics', icon: 'construct-outline', color: '#ECEFF1' },
    { name: 'Home Repairs', icon: 'hammer-outline', color: '#EFEBE9' },
    { name: 'ICT & Tech', icon: 'laptop-outline', color: '#E8EAF6' },
    { name: 'Delivery', icon: 'bicycle-outline', color: '#FBE9E7' },
    { name: 'More', icon: 'apps-outline', color: '#F5F5F5' },
  ];

  const nearbyServices = [
    { name: 'Plumbers', count: 12, distance: '0.5 km' },
    { name: 'Electricians', count: 8, distance: '0.8 km' },
    { name: 'Hair Stylists', count: 15, distance: '0.3 km' },
    { name: 'Mechanics', count: 6, distance: '1.2 km' },
  ];

  const topProviders = [
    { name: 'John the Plumber', rating: 4.9, reviews: 156, category: 'Plumbing' },
    { name: 'Sarah Hair Studio', rating: 4.8, reviews: 234, category: 'Hair & Beauty' },
    { name: 'QuickFix Electric', rating: 4.7, reviews: 89, category: 'Electrical' },
  ];

  const recentServices = [
    { name: 'David the Mechanic', category: 'Car Repair', date: '2 days ago' },
    { name: 'Grace Tutor', category: 'Math Tutoring', date: '1 week ago' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>MUNOLINK</Text>
          <Text style={styles.tagline}>For Better Connections</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('MyCart')}>
            <Ionicons name="cart-outline" size={24} color="#212121" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('PlumbingServices')}>
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
        {/* Location */}
        <TouchableOpacity style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#006B3F" />
          <Text style={styles.locationText}>Jinja City</Text>
          <Ionicons name="chevron-down" size={14} color="#888" />
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="What service do you need?"
              placeholderTextColor="#CCCCCC"
            />
          </View>
          <TouchableOpacity style={styles.searchBtn}>
            <Ionicons name="search" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTitle}>Get trusted services near you</Text>
            <Text style={styles.heroSubtitle}>Book, connect, and pay with confidence.</Text>
            <TouchableOpacity style={styles.heroBtn}>
              <Text style={styles.heroBtnText}>Explore Services</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroRight}>
            <View style={styles.heroAvatar}>
              <Ionicons name="person" size={36} color="#006B3F" />
            </View>
            <View style={styles.heroToolIcon}>
              <Ionicons name="construct-outline" size={16} color="#006B3F" />
            </View>
          </View>
        </View>

        {/* Browse by Category */}
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.name} 
            style={styles.categoryItem}>
                
              <View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
                <Ionicons name={cat.icon} size={24} color="#006B3F" />
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nearby Services */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Services</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nearbyScroll}>
          {nearbyServices.map((service) => (
            <TouchableOpacity key={service.name} style={styles.nearbyCard}>
              <Ionicons name="location-outline" size={20} color="#006B3F" />
              <Text style={styles.nearbyName}>{service.name}</Text>
              <Text style={styles.nearbyCount}>{service.count} providers</Text>
              <Text style={styles.nearbyDistance}>📍 {service.distance}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Top Rated Providers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Rated Providers</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {topProviders.map((provider, index) => (
          <TouchableOpacity key={index} style={styles.providerCard}>
            <View style={styles.providerAvatar}>
              <Text style={styles.providerInitial}>{provider.name.charAt(0)}</Text>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <Text style={styles.providerCategory}>{provider.category}</Text>
              <View style={styles.providerMeta}>
                <Ionicons name="star" size={12} color="#FFB300" />
                <Text style={styles.providerRating}>{provider.rating}</Text>
                <Text style={styles.providerReviews}>({provider.reviews} reviews)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bookBtn}>
              <Text style={styles.bookBtnText}>Book</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {/* Emergency Services */}
        <View style={styles.emergencyBanner}>
          <View style={styles.emergencyLeft}>
            <View style={styles.emergencyIcon}>
              <Ionicons name="warning-outline" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.emergencyTitle}>Emergency Services</Text>
              <Text style={styles.emergencySubtitle}>Urgent plumbing, electrical, or mechanical help</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.callNowBtn}>
            <Ionicons name="call" size={16} color="#FFFFFF" />
            <Text style={styles.callNowText}>Call Now</Text>
          </TouchableOpacity>
        </View>

        {/* Recently Used */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Used</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentServices.map((service, index) => (
          <TouchableOpacity key={index} style={styles.recentCard}>
            <View style={styles.recentIcon}>
              <Ionicons name="time-outline" size={20} color="#006B3F" />
            </View>
            <View style={styles.recentInfo}>
              <Text style={styles.recentName}>{service.name}</Text>
              <Text style={styles.recentCategory}>{service.category}</Text>
            </View>
            <Text style={styles.recentDate}>{service.date}</Text>
            <Ionicons name="chevron-forward" size={16} color="#CCC" />
          </TouchableOpacity>
        ))}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="briefcase-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.payNavButton}
          onPress={() => navigation.navigate('PaymentConfirm')}
        >
          <Ionicons name="card-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bookmark-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>My Shops</Text>
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
  logo: { fontSize: 20, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 10, color: '#888' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { position: 'relative' },
  cartBadge: {
    position: 'absolute', top: -4, right: -6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  notifBadge: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#D32F2F',
  },
  profilePic: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14,
  },
  locationText: { fontSize: 14, fontWeight: '600', color: '#212121' },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, height: 50,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#212121', marginLeft: 10 },
  searchBtn: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  heroBanner: {
    flexDirection: 'row', backgroundColor: '#E8F5E9', borderRadius: 20, padding: 20,
    marginBottom: 24, overflow: 'hidden',
  },
  heroLeft: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#212121', marginBottom: 6 },
  heroSubtitle: { fontSize: 13, color: '#666', marginBottom: 14 },
  heroBtn: {
    backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 20, alignSelf: 'flex-start',
  },
  heroBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  heroRight: {
    justifyContent: 'center', alignItems: 'center', paddingLeft: 10, position: 'relative',
  },
  heroAvatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  heroToolIcon: {
    position: 'absolute', bottom: -4, right: -4,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#212121', marginBottom: 14 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  categoryItem: { width: '22%', alignItems: 'center', marginBottom: 8 },
  categoryIcon: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  categoryName: { fontSize: 10, fontWeight: '600', color: '#333', textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  viewAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  nearbyScroll: { marginBottom: 22 },
  nearbyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginRight: 12, width: 130,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    alignItems: 'center', gap: 4,
  },
  nearbyName: { fontSize: 13, fontWeight: '700', color: '#212121' },
  nearbyCount: { fontSize: 11, color: '#006B3F', fontWeight: '500' },
  nearbyDistance: { fontSize: 11, color: '#888' },
  providerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  providerAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  providerInitial: { fontSize: 20, fontWeight: '700', color: '#006B3F' },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 2 },
  providerCategory: { fontSize: 11, color: '#888', marginBottom: 4 },
  providerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  providerRating: { fontSize: 12, fontWeight: '600', color: '#555' },
  providerReviews: { fontSize: 11, color: '#888' },
  bookBtn: {
    backgroundColor: '#006B3F', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 18,
  },
  bookBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  emergencyBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#D32F2F', borderRadius: 16, padding: 16, marginBottom: 22,
  },
  emergencyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  emergencyIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  emergencyTitle: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  emergencySubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  callNowBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 20, gap: 6,
  },
  callNowText: { fontSize: 13, fontWeight: '800', color: '#D32F2F' },
  recentCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 12, padding: 12, marginBottom: 8, gap: 10,
  },
  recentIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 13, fontWeight: '600', color: '#212121', marginBottom: 2 },
  recentCategory: { fontSize: 11, color: '#888' },
  recentDate: { fontSize: 11, color: '#AAA', marginRight: 4 },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
  payNavButton: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#006B3F',
    justifyContent: 'center', alignItems: 'center', marginTop: -20,
    shadowColor: '#006B3F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },
});