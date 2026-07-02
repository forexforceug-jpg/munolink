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

export default function PlumbingServices({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('Nearby');
  const [sortBy, setSortBy] = useState('Nearest');

  const filters = ['Nearby', 'Top Rated', 'Available Now', 'Price'];

  const providers = [
    {
      id: 1,
      name: 'John the Plumber',
      rating: 4.9,
      reviews: 234,
      distance: '0.5 km',
      available: true,
      availableTime: 'Available now',
      inspectionFee: 'Free inspection',
      startingPrice: 20000,
      verified: true,
      backgroundChecked: true,
      insured: true,
      topRated: true,
      initial: 'J',
    },
    {
      id: 2,
      name: 'QuickFix Plumbing',
      rating: 4.7,
      reviews: 189,
      distance: '0.8 km',
      available: true,
      availableTime: 'Available in 15 min',
      inspectionFee: 'UGX 5,000',
      startingPrice: 25000,
      verified: true,
      backgroundChecked: true,
      insured: true,
      topRated: false,
      initial: 'Q',
    },
    {
      id: 3,
      name: 'Sam Pipe Masters',
      rating: 4.5,
      reviews: 156,
      distance: '1.2 km',
      available: false,
      availableTime: 'Available tomorrow',
      inspectionFee: 'Free inspection',
      startingPrice: 18000,
      verified: true,
      backgroundChecked: false,
      insured: true,
      topRated: false,
      initial: 'S',
    },
    {
      id: 4,
      name: 'Ace Plumbing Co.',
      rating: 4.8,
      reviews: 312,
      distance: '1.5 km',
      available: true,
      availableTime: 'Available now',
      inspectionFee: 'UGX 3,000',
      startingPrice: 30000,
      verified: true,
      backgroundChecked: true,
      insured: true,
      topRated: true,
      initial: 'A',
    },
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
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
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
        {/* Category Title */}
        <View style={styles.categoryTitleRow}>
          <View style={styles.categoryIconLarge}>
            <Ionicons name="water-outline" size={28} color="#006B3F" />
          </View>
          <View>
            <Text style={styles.categoryTitle}>Plumbing</Text>
            <Text style={styles.categorySubtitle}>Find trusted plumbers nearby for any job</Text>
          </View>
        </View>

        {/* Search + Filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search plumbing services..."
              placeholderTextColor="#CCCCCC"
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results Info */}
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsCount}>24 plumbers found near Jinja City</Text>
          <TouchableOpacity style={styles.sortBtn}>
            <Text style={styles.sortText}>Sort: {sortBy}</Text>
            <Ionicons name="chevron-down" size={14} color="#006B3F" />
          </TouchableOpacity>
        </View>

        {/* Provider Cards */}
        {providers.map((provider) => (
          <View key={provider.id} style={styles.providerCard}>
            {/* Provider Photo */}
            <View style={styles.providerPhoto}>
              <Text style={styles.providerInitial}>{provider.initial}</Text>
              {provider.available && <View style={styles.availableDot} />}
            </View>

            {/* Provider Info */}
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{provider.name}</Text>

              <View style={styles.providerMeta}>
                <Ionicons name="star" size={13} color="#FFB300" />
                <Text style={styles.providerRating}>{provider.rating}</Text>
                <Text style={styles.providerReviews}>({provider.reviews} reviews)</Text>
              </View>

              <View style={styles.providerStatus}>
                {provider.available ? (
                  <View style={styles.availableBadge}>
                    <View style={styles.availableDotSmall} />
                    <Text style={styles.availableText}>{provider.availableTime}</Text>
                  </View>
                ) : (
                  <Text style={styles.unavailableText}>{provider.availableTime}</Text>
                )}
                <Text style={styles.providerDistance}>· {provider.distance}</Text>
              </View>

              <Text style={styles.inspectionFee}>{provider.inspectionFee}</Text>

              {/* Trust Badges */}
              <View style={styles.trustBadges}>
                {provider.verified && (
                  <View style={styles.trustBadge}>
                    <Ionicons name="shield-checkmark" size={10} color="#006B3F" />
                    <Text style={styles.trustBadgeText}>Verified</Text>
                  </View>
                )}
                {provider.backgroundChecked && (
                  <View style={styles.trustBadge}>
                    <Ionicons name="document-text-outline" size={10} color="#006B3F" />
                    <Text style={styles.trustBadgeText}>Background Checked</Text>
                  </View>
                )}
                {provider.insured && (
                  <View style={styles.trustBadge}>
                    <Ionicons name="shield-outline" size={10} color="#006B3F" />
                    <Text style={styles.trustBadgeText}>Insured</Text>
                  </View>
                )}
                {provider.topRated && (
                  <View style={styles.trustBadgeTop}>
                    <Ionicons name="star" size={10} color="#FFFFFF" />
                    <Text style={styles.trustBadgeTopText}>Top Rated</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Price & Actions */}
            <View style={styles.providerActions}>
              <TouchableOpacity style={styles.favBtn}>
                <Ionicons name="heart-outline" size={18} color="#CCC" />
              </TouchableOpacity>

              <Text style={styles.startingPrice}>From</Text>
              <Text style={styles.priceValue}>UGX {provider.startingPrice.toLocaleString()}</Text>

              <TouchableOpacity style={styles.viewBtn}
                onPress={() => navigation.navigate('ServiceProviderProfile')}
>
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.bookBtn}>
                <Text style={styles.bookBtnText}>Book</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Emergency Banner */}
        <View style={styles.emergencyBanner}>
          <View style={styles.emergencyLeft}>
            <View style={styles.emergencyIcon}>
              <Ionicons name="warning-outline" size={28} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.emergencyTitle}>Need urgent help?</Text>
              <Text style={styles.emergencySubtitle}>Burst pipes, severe leaks, or flooding</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.emergencyCallBtn}>
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <Text style={styles.emergencyCallText}>Emergency Call</Text>
          </TouchableOpacity>
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
          <Ionicons name="briefcase" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Services</Text>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
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
  categoryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  categoryIconLarge: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center',
  },
  categoryTitle: { fontSize: 22, fontWeight: '800', color: '#212121' },
  categorySubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, height: 48,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#212121', marginLeft: 10 },
  filterBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  filtersRow: { marginBottom: 14 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFFFFF', marginRight: 8,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  filterChipActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#888' },
  filterTextActive: { color: '#FFFFFF' },
  resultsInfo: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  resultsCount: { fontSize: 13, color: '#888', fontWeight: '500' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  providerCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  providerPhoto: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center',
    marginRight: 12, position: 'relative',
  },
  providerInitial: { fontSize: 24, fontWeight: '700', color: '#006B3F' },
  availableDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#FFFFFF',
  },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 4 },
  providerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  providerRating: { fontSize: 12, fontWeight: '600', color: '#555' },
  providerReviews: { fontSize: 11, color: '#888' },
  providerStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  availableBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availableDotSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  availableText: { fontSize: 11, fontWeight: '600', color: '#4CAF50' },
  unavailableText: { fontSize: 11, color: '#F59E0B', fontWeight: '500' },
  providerDistance: { fontSize: 11, color: '#888' },
  inspectionFee: { fontSize: 11, color: '#888', marginBottom: 8 },
  trustBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  trustBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, gap: 3,
  },
  trustBadgeText: { fontSize: 9, fontWeight: '600', color: '#006B3F' },
  trustBadgeTop: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#006B3F', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, gap: 3,
  },
  trustBadgeTopText: { fontSize: 9, fontWeight: '600', color: '#FFFFFF' },
  providerActions: { alignItems: 'flex-end', justifyContent: 'center', width: 100 },
  favBtn: { marginBottom: 4 },
  startingPrice: { fontSize: 10, color: '#888' },
  priceValue: { fontSize: 16, fontWeight: '800', color: '#006B3F', marginBottom: 8 },
  viewBtn: {
    borderWidth: 1.5, borderColor: '#006B3F',
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, marginBottom: 6, width: '100%', alignItems: 'center',
  },
  viewBtnText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  bookBtn: {
    backgroundColor: '#006B3F', paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 16, width: '100%', alignItems: 'center',
  },
  bookBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  emergencyBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#D32F2F', borderRadius: 16, padding: 18, marginTop: 8,
  },
  emergencyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  emergencyIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  emergencyTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  emergencySubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  emergencyCallBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 18,
    borderRadius: 22, gap: 6,
  },
  emergencyCallText: { fontSize: 13, fontWeight: '800', color: '#D32F2F' },
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