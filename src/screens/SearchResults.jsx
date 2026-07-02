import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function SearchResults({ navigation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Nearest');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  const filters = ['All', 'Products', 'Services'];

  // Fetch suggestions as user types (autocomplete)
  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    let allSuggestions = [];

    // Product suggestions
    if (activeFilter === 'All' || activeFilter === 'Products') {
      const { data: catalogItems } = await supabase
        .from('catalog')
        .select('name, category')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(5);

      if (catalogItems) {
        catalogItems.forEach((item) => {
          allSuggestions.push({
            text: item.name,
            type: 'product',
            category: item.category,
          });
        });
      }
    }

    // Service suggestions
    if (activeFilter === 'All' || activeFilter === 'Services') {
      const { data: serviceItems } = await supabase
        .from('service_catalog')
        .select('name, category')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(5);

      if (serviceItems) {
        serviceItems.forEach((item) => {
          allSuggestions.push({
            text: item.name,
            type: 'service',
            category: item.category,
          });
        });
      }
    }

    // Remove duplicates
    const unique = [];
    const seen = new Set();
    allSuggestions.forEach((s) => {
      if (!seen.has(s.text)) {
        seen.add(s.text);
        unique.push(s);
      }
    });

    setSuggestions(unique.slice(0, 8));
    setShowSuggestions(unique.length > 0);
  };

  // Full search when user taps a suggestion or presses enter
  const handleSearch = async (query) => {
    setSearchTerm(query);
    setShowSuggestions(false);

    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    let allResults = [];

    // ── PRODUCTS ──
    if (activeFilter === 'All' || activeFilter === 'Products') {
      const { data: catalogMatches } = await supabase
        .rpc('search_catalog', { search_query: query, limit_count: 20 });

      if (catalogMatches && catalogMatches.length > 0) {
        const catalogIds = catalogMatches.map((c) => c.id);

        const { data: products } = await supabase
          .from('shop_products')
          .select('*, catalog(name, category, description), shops(name, rating, review_count, distance, discount_percentage, is_open, is_anchor_partner)')
          .in('catalog_id', catalogIds)
          .eq('in_stock', true)
          .limit(10);

        if (products && products.length > 0) {
          const shopMap = {};
          products.forEach((item) => {
            const shopName = item.shops?.name || 'Shop';
            if (!shopMap[shopName]) {
              const shop = item.shops;
              const product = item.catalog;
              const discountPercent = shop?.discount_percentage || 10;
              const munolinkPrice = Math.round(item.regular_price * (1 - discountPercent / 100));
              const savings = item.regular_price - munolinkPrice;

              shopMap[shopName] = {
                id: item.id,
                type: 'product',
                shopName: shopName,
                category: product?.category || 'General',
                rating: shop?.rating || 4.0,
                reviews: shop?.review_count || 0,
                distance: shop?.distance || '1.0 km',
                regularPrice: item.regular_price,
                munolinkPrice: munolinkPrice,
                savings: savings,
                discount: discountPercent,
                open: shop?.is_open ?? true,
                isPartner: shop?.is_anchor_partner || false,
                productName: product?.name || '',
                matchCount: 1,
              };
            } else {
              shopMap[shopName].matchCount += 1;
            }
          });
          allResults = [...allResults, ...Object.values(shopMap)];
        }
      }
    }

    // ── SERVICES ──
    if (activeFilter === 'All' || activeFilter === 'Services') {
      const { data: serviceMatches } = await supabase
        .rpc('search_services', { search_query: query, limit_count: 20 });

      if (serviceMatches && serviceMatches.length > 0) {
        const serviceIds = serviceMatches.map((s) => s.id);

        const { data: services } = await supabase
          .from('provider_services')
          .select('*, service_catalog(name, category, description), users!provider_services_user_id_fkey(full_name)')
          .in('service_id', serviceIds)
          .eq('is_active', true)
          .limit(10);

        if (services && services.length > 0) {
          const providerMap = {};
          services.forEach((item) => {
            const providerName = item.users?.full_name || 'Service Provider';
            if (!providerMap[providerName]) {
              const service = item.service_catalog;
              providerMap[providerName] = {
                id: item.id,
                type: 'service',
                shopName: providerName,
                category: service?.category || 'Service',
                rating: 4.5,
                reviews: 0,
                distance: '1.0 km',
                regularPrice: item.price,
                munolinkPrice: item.price,
                savings: 0,
                discount: 0,
                open: true,
                isPartner: false,
                productName: service?.name || '',
                matchCount: 1,
              };
            } else {
              providerMap[providerName].matchCount += 1;
            }
          });
          allResults = [...allResults, ...Object.values(providerMap)];
        }
      }
    }

    setResults(allResults);
    setLoading(false);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    if (searchTerm.length >= 2) {
      handleSearch(searchTerm);
    }
  };

  const handleSuggestionTap = (suggestion) => {
    handleSearch(suggestion.text);
  };

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

      <View style={styles.searchContainer}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              value={searchTerm}
              onChangeText={(text) => {
                setSearchTerm(text);
                fetchSuggestions(text);
                if (text.length < 2) setResults([]);
              }}
              placeholder="Search products and services..."
              placeholderTextColor="#CCCCCC"
              onSubmitEditing={() => handleSearch(searchTerm)}
              autoFocus
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchTerm(''); setSuggestions([]); setResults([]); setShowSuggestions(false); }}>
                <Ionicons name="close-circle" size={18} color="#CCC" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.mapBtn}>
            <Ionicons name="map-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Autocomplete Dropdown */}
        {showSuggestions && (
          <View style={styles.suggestionsDropdown}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionRow}
                onPress={() => handleSuggestionTap(suggestion)}
              >
                <Ionicons
                  name={suggestion.type === 'service' ? 'person-outline' : 'cube-outline'}
                  size={18}
                  color="#006B3F"
                />
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>
                  <Text style={styles.suggestionCategory}>
                    {suggestion.category} · {suggestion.type === 'service' ? 'Service' : 'Product'}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color="#CCC" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Results Title */}
        {searchTerm.length > 0 && results.length > 0 && (
          <View style={styles.resultsTitleRow}>
            <View>
              <Text style={styles.resultsTitle}>Results for "{searchTerm}"</Text>
              <Text style={styles.resultsSubtitle}>
                {results.length} {results.length === 1 ? 'result' : 'results'} found near Jinja City
              </Text>
            </View>
            <TouchableOpacity style={styles.sortBtn}>
              <Text style={styles.sortText}>Sort: {sortBy}</Text>
              <Ionicons name="chevron-down" size={14} color="#006B3F" />
            </TouchableOpacity>
          </View>
        )}

        {/* Filter Chips */}
        {searchTerm.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                onPress={() => handleFilterChange(filter)}
              >
                <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Value Banner */}
        {searchTerm.length > 0 && (
          <View style={styles.valueBanner}>
            <Ionicons name="pricetag" size={18} color="#006B3F" />
            <Text style={styles.valueText}>Best Prices. Automatic Discounts.</Text>
            <TouchableOpacity>
              <Text style={styles.learnMore}>Learn More</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results */}
        {loading ? (
          <Text style={styles.loadingText}>Searching...</Text>
        ) : searchTerm.length === 0 ? (
          <Text style={styles.loadingText}>Type to search for products and services near you.</Text>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#CCC" />
            <Text style={styles.emptyTitle}>No results found for "{searchTerm}"</Text>
            <Text style={styles.emptySubtitle}>Try a different spelling or browse categories.</Text>
            <View style={styles.emptySuggestions}>
              <TouchableOpacity style={styles.emptyChip} onPress={() => handleSearch('medicine')}>
                <Text style={styles.emptyChipText}>Medicine</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emptyChip} onPress={() => handleSearch('grocery')}>
                <Text style={styles.emptyChipText}>Groceries</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emptyChip} onPress={() => handleSearch('plumbing')}>
                <Text style={styles.emptyChipText}>Plumbing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emptyChip} onPress={() => handleSearch('electrical')}>
                <Text style={styles.emptyChipText}>Electrical</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          results.map((shop) => (
            <View key={shop.id + shop.type} style={styles.resultCard}>
              <View style={styles.shopImage}>
                <Ionicons
                  name={shop.type === 'service' ? 'person' : 'storefront'}
                  size={36}
                  color="#006B3F"
                />
                {shop.isPartner && (
                  <View style={styles.partnerBadge}>
                    <Ionicons name="shield-checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
              </View>

              <View style={styles.shopInfo}>
                <View style={styles.shopNameRow}>
                  <Text style={styles.shopName}>{shop.shopName}</Text>
                  {shop.isPartner && (
                    <View style={styles.officialBadge}>
                      <Text style={styles.officialBadgeText}>Official Partner</Text>
                    </View>
                  )}
                  <View style={[styles.typeBadge, shop.type === 'service' ? styles.typeBadgeService : styles.typeBadgeProduct]}>
                    <Text style={[styles.typeBadgeText, shop.type === 'service' ? styles.typeBadgeTextService : styles.typeBadgeTextProduct]}>
                      {shop.type === 'service' ? 'Service' : 'Shop'}
                    </Text>
                  </View>
                </View>

                <View style={styles.productNameRow}>
                  <Ionicons name="cube-outline" size={12} color="#006B3F" />
                  <Text style={styles.resultProductName}>{shop.productName}</Text>
                  {shop.matchCount > 1 && (
                    <Text style={styles.matchCount}>+{shop.matchCount - 1} more</Text>
                  )}
                </View>

                <View style={styles.shopMeta}>
                  <Ionicons name="star" size={12} color="#FFB300" />
                  <Text style={styles.shopRating}>{shop.rating}</Text>
                  <Text style={styles.shopReviews}>({shop.reviews})</Text>
                  <Text style={styles.shopCategory}>· {shop.category}</Text>
                </View>

                <View style={styles.shopStatus}>
                  {shop.open ? (
                    <View style={styles.openBadge}>
                      <View style={styles.openDot} />
                      <Text style={styles.openText}>Open</Text>
                    </View>
                  ) : (
                    <View style={styles.closedBadge}>
                      <Text style={styles.closedText}>Closed</Text>
                    </View>
                  )}
                  <Text style={styles.shopDistance}>· {shop.distance}</Text>
                </View>

                {shop.discount > 0 && (
                  <View style={styles.deliveryBadge}>
                    <Ionicons name="pricetag" size={12} color="#006B3F" />
                    <Text style={styles.deliveryText}>{shop.discount}% off with Munolink</Text>
                  </View>
                )}
              </View>

              <View style={styles.priceSection}>
                <Text style={styles.munolinkPrice}>UGX {shop.munolinkPrice.toLocaleString()}</Text>
                {shop.savings > 0 && (
                  <>
                    <Text style={styles.regularPrice}>UGX {shop.regularPrice.toLocaleString()}</Text>
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveText}>Save {shop.savings}</Text>
                    </View>
                  </>
                )}

                {shop.type === 'product' ? (
                  <TouchableOpacity
                    style={styles.buyNowBtn}
                    onPress={() =>
                      navigation.navigate('ProductDetails', {
                        product: {
                          name: shop.productName,
                          category: shop.category,
                          regularPrice: shop.regularPrice,
                          munolinkPrice: shop.munolinkPrice,
                          discount: shop.discount,
                          description: 'Quality product from a verified Munolink shop.',
                          shop: { name: shop.shopName, rating: shop.rating, distance: shop.distance, isOpen: shop.open, isPartner: shop.isPartner },
                        },
                      })
                    }
                  >
                    <Text style={styles.buyNowText}>Buy Now</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.bookNowBtn}
                    onPress={() => navigation.navigate('ServiceProviderProfile')}
                  >
                    <Text style={styles.bookNowText}>Book Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.payNavButton} onPress={() => navigation.navigate('PaymentConfirm')}>
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
  searchContainer: { paddingHorizontal: 20, zIndex: 10 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 0 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, height: 48,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#212121', marginLeft: 10 },
  mapBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  suggestionsDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    gap: 10,
  },
  suggestionInfo: { flex: 1 },
  suggestionText: { fontSize: 14, fontWeight: '600', color: '#212121' },
  suggestionCategory: { fontSize: 11, color: '#888', marginTop: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  resultsTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14,
  },
  resultsTitle: { fontSize: 18, fontWeight: '800', color: '#212121' },
  resultsSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  filtersScroll: { marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFFFFF', marginRight: 8,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  filterChipActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#888' },
  filterTextActive: { color: '#FFFFFF' },
  valueBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12, marginBottom: 18, gap: 8,
  },
  valueText: { flex: 1, fontSize: 13, color: '#006B3F', fontWeight: '600' },
  learnMore: { fontSize: 12, color: '#006B3F', fontWeight: '700' },
  loadingText: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 30 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#555', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  emptySuggestions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  emptyChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#C8E6C9',
  },
  emptyChipText: { fontSize: 13, fontWeight: '600', color: '#006B3F' },
  resultCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  shopImage: {
    width: 70, height: 70, borderRadius: 14,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
    marginRight: 12, position: 'relative',
  },
  partnerBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  shopInfo: { flex: 1 },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  shopName: { fontSize: 15, fontWeight: '700', color: '#212121' },
  officialBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  officialBadgeText: { fontSize: 8, fontWeight: '700', color: '#006B3F' },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeBadgeProduct: { backgroundColor: '#E8F5E9' },
  typeBadgeService: { backgroundColor: '#FFF3E0' },
  typeBadgeText: { fontSize: 8, fontWeight: '700' },
  typeBadgeTextProduct: { color: '#006B3F' },
  typeBadgeTextService: { color: '#F57C00' },
  productNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  resultProductName: { fontSize: 13, fontWeight: '600', color: '#006B3F' },
  matchCount: { fontSize: 11, color: '#888', fontWeight: '500' },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  shopRating: { fontSize: 12, fontWeight: '600', color: '#555' },
  shopReviews: { fontSize: 11, color: '#888' },
  shopCategory: { fontSize: 11, color: '#888' },
  shopStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  openText: { fontSize: 11, fontWeight: '600', color: '#4CAF50' },
  closedBadge: { backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  closedText: { fontSize: 10, fontWeight: '600', color: '#D32F2F' },
  shopDistance: { fontSize: 11, color: '#888' },
  deliveryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  deliveryText: { fontSize: 11, color: '#006B3F', fontWeight: '600' },
  priceSection: { alignItems: 'flex-end', justifyContent: 'center', width: 110 },
  munolinkPrice: { fontSize: 18, fontWeight: '800', color: '#006B3F' },
  regularPrice: { fontSize: 12, color: '#888', textDecorationLine: 'line-through' },
  saveBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2, marginBottom: 8 },
  saveText: { fontSize: 10, fontWeight: '700', color: '#006B3F' },
  buyNowBtn: {
    backgroundColor: '#006B3F', paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 16, width: '100%', alignItems: 'center',
  },
  buyNowText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  bookNowBtn: {
    backgroundColor: '#F57C00', paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 16, width: '100%', alignItems: 'center',
  },
  bookNowText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  trustBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', borderRadius: 14, padding: 14, marginTop: 4, gap: 10,
  },
  trustText: { flex: 1, fontSize: 12, color: '#006B3F', fontWeight: '500' },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
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