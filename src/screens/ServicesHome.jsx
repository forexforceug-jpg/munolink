import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function ServicesHome({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allProviders, setAllProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [recentServices, setRecentServices] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const iconMap = {
    'Plumbing': 'water-outline',
    'Electrical': 'flash-outline',
    'Beauty': 'cut-outline',
    'Healthcare': 'medkit-outline',
    'Education': 'school-outline',
    'Transport': 'car-outline',
    'Cleaning': 'sparkles-outline',
    'Automotive': 'construct-outline',
    'Events': 'calendar-outline',
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: psData, error: psError } = await supabase
        .from('provider_services')
        .select('id, price, is_active, user_id, service_id')
        .eq('is_active', true);

      if (psError) {
        console.error('provider_services error:', psError);
        setLoading(false);
        return;
      }

      if (!psData || psData.length === 0) {
        setAllProviders([]);
        setFilteredProviders([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(psData.map(ps => ps.user_id))];
      const serviceIds = [...new Set(psData.map(ps => ps.service_id))];

      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', userIds);

      const { data: catalogData } = await supabase
        .from('service_catalog')
        .select('id, name, category')
        .in('id', serviceIds);

      const userMap = {};
      if (usersData) usersData.forEach(u => { userMap[u.id] = u; });

      const catalogMap = {};
      if (catalogData) catalogData.forEach(c => { catalogMap[c.id] = c; });

      // Categories
      const categorySet = new Set();
      if (catalogData) catalogData.forEach(c => categorySet.add(c.category));

      const categoryIcons = {
        'Plumbing': 'water-outline', 'Electrical': 'flash-outline', 'Beauty': 'cut-outline',
        'Healthcare': 'medkit-outline', 'Education': 'school-outline', 'Transport': 'car-outline',
        'Cleaning': 'sparkles-outline', 'Automotive': 'construct-outline', 'Events': 'calendar-outline',
      };
      setCategories([...categorySet].map(cat => ({
        name: cat,
        icon: categoryIcons[cat] || 'apps-outline',
      })));

      // Group by user
      const providerMap = new Map();
      psData.forEach(ps => {
        const usr = userMap[ps.user_id];
        const catalog = catalogMap[ps.service_id];
        if (!usr || !catalog) return;

        if (!providerMap.has(usr.id)) {
          providerMap.set(usr.id, {
            id: usr.id,
            name: usr.full_name || 'Service Provider',
            services: [],
            categorySet: new Set(),
            minPrice: ps.price,
            totalServices: 0,
          });
        }
        const provider = providerMap.get(usr.id);
        provider.services.push({
          id: ps.id,
          serviceName: catalog.name,
          category: catalog.category,
          price: ps.price,
        });
        provider.categorySet.add(catalog.category);
        if (ps.price < provider.minPrice) provider.minPrice = ps.price;
        provider.totalServices++;
      });

      const providersArray = Array.from(providerMap.values()).map((p, i) => ({
        ...p,
        categories: [...p.categorySet],
        primaryCategory: [...p.categorySet][0] || 'Services',
        rating: 4.0 + Math.random() * 1.0,
        reviews: Math.floor(Math.random() * 200) + 10,
        distance: `${(Math.random() * 3 + 0.3).toFixed(1)} km`,
        isOpen: true,
        isPartner: i === 0,
      }));

      providersArray.sort((a, b) => b.totalServices - a.totalServices);
      setAllProviders(providersArray);
      setFilteredProviders(providersArray);
    } catch (error) {
      console.error('Error fetching services data:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter providers whenever search query or active category changes
  useEffect(() => {
    let filtered = [...allProviders];

    if (activeCategory) {
      filtered = filtered.filter(p => p.categories.includes(activeCategory));
    }

    if (searchQuery.trim().length >= 2) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.services.some(s => s.serviceName.toLowerCase().includes(q)) ||
        p.categories.some(c => c.toLowerCase().includes(q))
      );
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }

    setFilteredProviders(filtered);
  }, [searchQuery, activeCategory, allProviders]);

  const handleCategoryPress = (category) => {
    if (activeCategory === category) {
      setActiveCategory(null);
      setSearchQuery('');
    } else {
      setActiveCategory(category);
      setSearchQuery('');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveCategory(null);
  };

  const handleProviderPress = (provider) => {
    navigation.navigate('ServiceProviderProfile', { providerId: provider.id });
  };

  const handleBookNow = (provider) => {
    navigation.navigate('BookService', {
      providerId: provider.id,
      providerName: provider.name,
      serviceId: provider.services[0]?.id,
    });
  };

  const handleNavigateToProvider = (provider) => {
    navigation.navigate('RouteNavigation', { providerId: provider.id });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#212121" />
            </TouchableOpacity>
            <View>
              <Text style={styles.logo}>MUNOLINK</Text>
              <Text style={styles.tagline}>For Better Connections</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006B3F" />
          <Text style={styles.loadingText}>Loading service providers...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <View>
            <Text style={styles.logo}>MUNOLINK</Text>
            <Text style={styles.tagline}>For Better Connections</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#212121" />
          <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Title */}
        {!isSearching && !activeCategory && (
          <>
            <Text style={styles.pageTitle}>Service Providers</Text>
            <Text style={styles.pageSubtitle}>Find trusted professionals near you</Text>
          </>
        )}

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search providers or services..."
              placeholderTextColor="#CCCCCC"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {(searchQuery.length > 0 || activeCategory) && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons name="close-circle" size={18} color="#CCC" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Active filter indicator */}
        {(isSearching || activeCategory) && (
          <View style={styles.filterIndicator}>
            <Text style={styles.filterIndicatorText}>
              {isSearching ? `Results for "${searchQuery}"` : `Category: ${activeCategory}`}
            </Text>
            <Text style={styles.filterCount}>{filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} found</Text>
          </View>
        )}

        {/* Categories */}
        {!isSearching && (
          <>
            <Text style={styles.sectionTitle}>Browse by Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={[styles.categoryItem, activeCategory === cat.name && styles.categoryItemActive]}
                  onPress={() => handleCategoryPress(cat.name)}
                >
                  <View style={[styles.categoryIcon, activeCategory === cat.name && styles.categoryIconActive]}>
                    <Ionicons name={cat.icon} size={22} color={activeCategory === cat.name ? '#FFFFFF' : '#006B3F'} />
                  </View>
                  <Text style={[styles.categoryName, activeCategory === cat.name && styles.categoryNameActive]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Filtered Results */}
        {filteredProviders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No providers found</Text>
            <Text style={styles.emptySubtext}>Try a different search or category</Text>
            <TouchableOpacity style={styles.clearFilterBtn} onPress={handleClearSearch}>
              <Text style={styles.clearFilterText}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Show section title only when not searching */}
            {!isSearching && !activeCategory && filteredProviders.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>All Providers</Text>
                <Text style={styles.viewAll}>{filteredProviders.length} providers</Text>
              </View>
            )}

            {filteredProviders.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={styles.providerCard}
                onPress={() => handleProviderPress(provider)}
                activeOpacity={0.7}
              >
                <View style={styles.providerAvatar}>
                  <Text style={styles.providerInitial}>{provider.name.charAt(0)}</Text>
                </View>
                <View style={styles.providerInfo}>
                  <View style={styles.providerNameRow}>
                    <Text style={styles.providerName}>{provider.name}</Text>
                    {provider.isPartner && (
                      <Ionicons name="checkmark-circle" size={14} color="#006B3F" />
                    )}
                  </View>
                  <Text style={styles.providerCategory}>
                    {provider.primaryCategory}
                    {provider.categories.length > 1 ? ` +${provider.categories.length - 1}` : ''}
                  </Text>
                  <View style={styles.providerMeta}>
                    <Ionicons name="star" size={12} color="#FFB300" />
                    <Text style={styles.providerRating}>{provider.rating.toFixed(1)}</Text>
                    <Text style={styles.providerReviews}>({provider.reviews})</Text>
                    <View style={styles.metaDot} />
                    <Text style={styles.providerDistance}>{provider.distance}</Text>
                  </View>
                  <View style={styles.serviceTags}>
                    {provider.categories.slice(0, 3).map((cat, i) => (
                      <View key={i} style={styles.serviceTag}>
                        <Text style={styles.serviceTagText}>{cat}</Text>
                      </View>
                    ))}
                    <Text style={styles.serviceCount}>{provider.totalServices} services</Text>
                  </View>
                </View>
                <View style={styles.providerActions}>
                  <TouchableOpacity style={styles.bookBtn} onPress={() => handleBookNow(provider)}>
                    <Text style={styles.bookBtnText}>Book</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.navigateBtn} onPress={() => handleNavigateToProvider(provider)}>
                    <Ionicons name="navigate-outline" size={16} color="#006B3F" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  tagline: { fontSize: 9, color: '#888' },
  headerIcon: { position: 'relative' },
  notifBadge: {
    position: 'absolute', top: -4, right: -6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
  },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#888', fontWeight: '500' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, height: 48,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#212121', marginLeft: 8, outlineStyle: 'none' },
  filterIndicator: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, paddingHorizontal: 4,
  },
  filterIndicatorText: { fontSize: 16, fontWeight: '700', color: '#212121' },
  filterCount: { fontSize: 12, color: '#888' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  categoryItem: { width: '22%', alignItems: 'center', marginBottom: 6 },
  categoryItemActive: { transform: [{ scale: 1.05 }] },
  categoryIcon: {
    width: 54, height: 54, borderRadius: 16,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  categoryIconActive: { backgroundColor: '#006B3F' },
  categoryName: { fontSize: 10, fontWeight: '600', color: '#555', textAlign: 'center' },
  categoryNameActive: { color: '#006B3F', fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  viewAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  providerCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  providerAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  providerInitial: { fontSize: 20, fontWeight: '800', color: '#006B3F' },
  providerInfo: { flex: 1 },
  providerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  providerName: { fontSize: 14, fontWeight: '700', color: '#212121' },
  providerCategory: { fontSize: 11, color: '#888', marginBottom: 4, fontWeight: '500' },
  providerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  providerRating: { fontSize: 12, fontWeight: '600', color: '#555' },
  providerReviews: { fontSize: 11, color: '#888' },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#CCC', marginHorizontal: 2 },
  providerDistance: { fontSize: 11, color: '#006B3F', fontWeight: '500' },
  serviceTags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  serviceTag: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  serviceTagText: { fontSize: 9, fontWeight: '600', color: '#006B3F' },
  serviceCount: { fontSize: 9, color: '#888', fontWeight: '500' },
  providerActions: { alignItems: 'center', gap: 6, marginLeft: 8 },
  bookBtn: {
    backgroundColor: '#006B3F', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 16,
  },
  bookBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  navigateBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#888' },
  emptySubtext: { fontSize: 13, color: '#AAA' },
  clearFilterBtn: {
    marginTop: 8, backgroundColor: '#006B3F',
    paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20,
  },
  clearFilterText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});