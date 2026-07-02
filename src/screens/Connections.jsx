import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function Connections({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchHistory] = useState([
    'Bright Electricals',
    'FreshMart Supermarket',
    'Plumbing services',
    'Paracetamol',
    'Cafe Jinja',
  ]);

  const quickCategories = [
    { icon: 'storefront-outline', title: 'Shops Near You', desc: 'Discover local stores', color: '#006B3F', bg: '#E8F5E9' },
    { icon: 'briefcase-outline', title: 'Service Providers', desc: 'Find professionals', color: '#1976D2', bg: '#E3F2FD' },
    { icon: 'pricetag-outline', title: 'Deals For You', desc: 'Exclusive offers', color: '#F57C00', bg: '#FFF3E0' },
    { icon: 'star-outline', title: 'Top Rated', desc: 'Best businesses', color: '#9C27B0', bg: '#F3E5F5' },
    { icon: 'calendar-outline', title: 'Events Near You', desc: 'Upcoming events', color: '#D32F2F', bg: '#FFEBEE' },
  ];

  const recommendations = [
    { id: 1, name: 'FreshMart Supermarket', category: 'Grocery', distance: '0.5 km', rating: 4.8, badge: 'Recommended' },
    { id: 2, name: 'Bright Electricals', category: 'Electrical Services', distance: '0.8 km', rating: 4.9, badge: 'Popular' },
    { id: 3, name: 'Cafe Jinja', category: 'Restaurant', distance: '1.2 km', rating: 4.6, badge: 'New' },
  ];

  const continueItems = [
    { id: 1, name: 'Hardware World', category: 'Hardware', action: 'Viewed 2 days ago', btnText: 'View Again' },
    { id: 2, name: 'CoolFix Services', category: 'Plumbing', action: 'Messaged yesterday', btnText: 'Open Chat' },
  ];

  const recentConnections = [
    { name: 'PharmaCare', category: 'Pharmacy', online: true },
    { name: 'PlumbPro', category: 'Plumbing', online: false },
    { name: 'GreenLeaf', category: 'Groceries', online: true },
    { name: 'Beauty Hub', category: 'Beauty', online: false },
    { name: 'AutoPoint', category: 'Automotive', online: true },
  ];

  // ── Autocomplete ──
  const fetchSuggestions = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSuggestions(searchHistory.map((item) => ({ text: item, type: 'history' })));
      setShowSuggestions(searchHistory.length > 0);
      return;
    }

    let allSuggestions = [];

    const { data: catalogItems } = await supabase
      .from('catalog')
      .select('name, category')
      .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(4);

    if (catalogItems) {
      catalogItems.forEach((item) => {
        allSuggestions.push({ text: item.name, type: 'product', category: item.category });
      });
    }

    const { data: serviceItems } = await supabase
      .from('service_catalog')
      .select('name, category')
      .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(4);

    if (serviceItems) {
      serviceItems.forEach((item) => {
        allSuggestions.push({ text: item.name, type: 'service', category: item.category });
      });
    }

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

  // ── Full Search ──
  const runSearch = async (query) => {
    setSearchQuery(query);
    setShowSuggestions(false);
    setIsSearching(true);
    setLoading(true);

    let allResults = [];

    // Products
    const { data: catalogMatches } = await supabase
      .from('catalog')
      .select('id')
      .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(15);

    if (catalogMatches && catalogMatches.length > 0) {
      const catalogIds = catalogMatches.map((c) => c.id);
      const { data: products } = await supabase
        .from('shop_products')
        .select('*, catalog(name, category), shops(name, rating, review_count, distance, discount_percentage, is_open, is_anchor_partner)')
        .in('catalog_id', catalogIds)
        .eq('in_stock', true)
        .limit(8);

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

    // Services
    const { data: serviceMatches } = await supabase
      .from('service_catalog')
      .select('id')
      .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(10);

    if (serviceMatches && serviceMatches.length > 0) {
      const serviceIds = serviceMatches.map((s) => s.id);
      const { data: services } = await supabase
        .from('provider_services')
        .select('*, service_catalog(name, category), users!provider_services_user_id_fkey(full_name)')
        .in('service_id', serviceIds)
        .eq('is_active', true)
        .limit(8);

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

    setSearchResults(allResults);
    setLoading(false);
  };

  const handleSuggestionTap = (suggestion) => {
    runSearch(suggestion.text);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setShowSuggestions(false);
  };

  // ── RENDER ──
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu-outline" size={26} color="#212121" />
        </TouchableOpacity>
<View style={styles.headerCenter}>
          <Text style={styles.logo}>MUNOLINK</Text>
          <Text style={styles.tagline}>For Better Connections</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" onTouchStart={() => setShowSuggestions(false)}>
        {/* Title */}
        {!isSearching && (
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.pageTitle}>My Connections</Text>
              <Text style={styles.pageSubtitle}>Discover, connect and grow with trusted businesses & providers.</Text>
            </View>
            <TouchableOpacity style={styles.mapBtn}>
              <Ionicons name="location-outline" size={16} color="#006B3F" />
              <Text style={styles.mapBtnText}>Explore Map</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          {isSearching && (
            <TouchableOpacity style={styles.backArrow} onPress={handleClearSearch}>
              <Ionicons name="arrow-back" size={24} color="#212121" />
            </TouchableOpacity>
          )}
          <View style={[styles.searchRow, isSearching && styles.searchRowActive]}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#888" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={fetchSuggestions}
                placeholder="Search businesses, services, people..."
                placeholderTextColor="#CCCCCC"
                onFocus={() => {
                  if (searchQuery.length < 2 && !isSearching) {
                    setSuggestions(searchHistory.map((item) => ({ text: item, type: 'history' })));
                    setShowSuggestions(searchHistory.length > 0);
                  }
                }}
                onSubmitEditing={() => {
                  if (searchQuery.length >= 2) runSearch(searchQuery);
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch}>
                  <Ionicons name="close-circle" size={18} color="#CCC" />
                </TouchableOpacity>
              )}
            </View>
            {!isSearching && (
              <TouchableOpacity style={styles.filterBtn}>
                <Ionicons name="options-outline" size={18} color="#006B3F" />
                <Text style={styles.filterBtnText}>Filter</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Autocomplete Dropdown */}
          {showSuggestions && !isSearching && (
            <View style={styles.suggestionsDropdown}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionRow}
                  onPress={() => handleSuggestionTap(suggestion)}
                >
                  <Ionicons
                    name={suggestion.type === 'history' ? 'time-outline' : suggestion.type === 'service' ? 'person-outline' : 'cube-outline'}
                    size={16}
                    color={suggestion.type === 'history' ? '#888' : '#006B3F'}
                  />
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                    {suggestion.category && (
                      <Text style={styles.suggestionCategory}>{suggestion.category}</Text>
                    )}
                  </View>
                  <Ionicons name="arrow-forward" size={14} color="#CCC" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── SEARCH RESULTS MODE ── */}
        {isSearching ? (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Results for "{searchQuery}"</Text>
            <Text style={styles.resultsSubtitle}>{searchResults.length} found near Jinja City</Text>

            {loading ? (
              <Text style={styles.loadingText}>Searching...</Text>
            ) : searchResults.length === 0 ? (
              <Text style={styles.loadingText}>No results found. Try a different search.</Text>
            ) : (
              searchResults.map((shop) => (
                <View key={shop.id + shop.type} style={styles.resultCard}>
                  <View style={styles.resultImage}>
                    <Ionicons name={shop.type === 'service' ? 'person' : 'storefront'} size={36} color="#006B3F" />
                  </View>
                  <View style={styles.resultInfo}>
                    <View style={styles.resultNameRow}>
                      <Text style={styles.resultName}>{shop.shopName}</Text>
                      <View style={[styles.typeBadge, shop.type === 'service' ? styles.typeBadgeService : styles.typeBadgeProduct]}>
                        <Text style={styles.typeBadgeText}>{shop.type === 'service' ? 'Service' : 'Shop'}</Text>
                      </View>
                    </View>
                    <Text style={styles.resultProduct}>{shop.productName}</Text>
                    <View style={styles.resultMeta}>
                      <Ionicons name="star" size={11} color="#FFB300" />
                      <Text style={styles.resultRating}>{shop.rating}</Text>
                      <Text style={styles.resultDistance}>· {shop.distance}</Text>
                    </View>
                  </View>
                  <View style={styles.resultPrice}>
                    <Text style={styles.resultPriceText}>UGX {shop.munolinkPrice.toLocaleString()}</Text>
                    {shop.type === 'product' ? (
                      <TouchableOpacity style={styles.buyBtn}>
                        <Text style={styles.buyBtnText}>Buy</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.bookBtn}>
                        <Text style={styles.bookBtnText}>Book</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          /* ── DEFAULT CONNECTIONS VIEW ── */
          <>
            {/* Quick Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {quickCategories.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.categoryCard}
                  onPress={() => {
                    if (cat.title === 'Shops Near You') navigation.navigate('Categories');
                    else if (cat.title === 'Service Providers') navigation.navigate('ServicesHome');
                    else if (cat.title === 'Deals For You') navigation.navigate('Categories');
                    else if (cat.title === 'Top Rated') navigation.navigate('ShopProfile');
                    else if (cat.title === 'Events Near You') navigation.navigate('Notifications');
                  }}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: cat.bg }]}>
                    <Ionicons name={cat.icon} size={24} color={cat.color} />
                  </View>
                  <Text style={styles.categoryTitle}>{cat.title}</Text>
                  <Text style={styles.categoryDesc}>{cat.desc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Recommended For You</Text>
                <Ionicons name="information-circle-outline" size={16} color="#888" />
              </View>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendScroll}>
              {recommendations.map((item) => (
                <View key={item.id} style={styles.recommendCard}>
                  <View style={styles.recommendCover}>
                    <Ionicons name="storefront-outline" size={36} color="#006B3F" />
                    <View style={styles.recommendBadge}>
                      <Text style={styles.recommendBadgeText}>{item.badge}</Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={10} color="#FFB300" />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  </View>
                  <View style={styles.recommendInfo}>
                    <Text style={styles.recommendName}>{item.name}</Text>
                    <Text style={styles.recommendMeta}>{item.category} · {item.distance}</Text>
                    <TouchableOpacity style={styles.connectBtn}>
                      <Text style={styles.connectBtnText}>Connect</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue Where You Left Off</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {continueItems.map((item) => (
              <View key={item.id} style={styles.continueCard}>
                <View style={styles.continueLeft}>
                  <View style={styles.continueIcon}>
                    <Ionicons name="storefront-outline" size={22} color="#006B3F" />
                  </View>
                  <View>
                    <Text style={styles.continueName}>{item.name}</Text>
                    <Text style={styles.continueCategory}>{item.category}</Text>
                    <Text style={styles.continueAction}>{item.action}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.continueBtn}>
                  <Text style={styles.continueBtnText}>{item.btnText}</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Recent Connections</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
              {recentConnections.map((item, index) => (
                <View key={index} style={styles.recentCard}>
                  <View style={styles.recentAvatar}>
                    <Ionicons name="person" size={22} color="#006B3F" />
                    {item.online && <View style={styles.recentOnlineDot} />}
                  </View>
                  <Text style={styles.recentName}>{item.name}</Text>
                  <Text style={styles.recentCategory}>{item.category}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.expandBanner}>
              <View style={styles.expandLeft}>
                <View style={styles.expandIcon}>
                  <Ionicons name="people-outline" size={28} color="#006B3F" />
                </View>
                <View>
                  <Text style={styles.expandTitle}>Expand Your Network</Text>
                  <Text style={styles.expandSubtitle}>Connect with more verified businesses & professionals nearby.</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.expandBtn}>
                <Text style={styles.expandBtnText}>Find More Connections</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyOrders')}>
          <Ionicons name="grid-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Wallet</Text>
        </TouchableOpacity>
       <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyOrders')}>
          <Ionicons name="calendar-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Orders.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Connections</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Messages')}>
          <Ionicons name="chatbubbles-outline" size={22} color="#888" />
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>3</Text>
          </View>
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>
         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Account')}>
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
  pageSubtitle: { fontSize: 13, color: '#888', marginTop: 2, maxWidth: '80%' },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#006B3F', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4,
  },
  mapBtnText: { fontSize: 12, fontWeight: '600', color: '#006B3F' },
  searchContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18, zIndex: 10 },
  backArrow: { marginRight: 10, marginTop: 10 },
  searchRow: { flex: 1, flexDirection: 'row', gap: 8 },
  searchRowActive: { flex: 1 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: '#ECECEC',  boxShadow: 'none',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#212121', marginLeft: 8 },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 14, paddingHorizontal: 14, gap: 4,
  },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: '#006B3F' },
  suggestionsDropdown: {
    position: 'absolute', top: 50, left: 0, right: 60,
    backgroundColor: '#FFFFFF', borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
    borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 10,
  },
  suggestionInfo: { flex: 1 },
  suggestionText: { fontSize: 13, fontWeight: '600', color: '#212121' },
  suggestionCategory: { fontSize: 10, color: '#888', marginTop: 1 },
  // Results
  resultsContainer: { marginTop: 8 },
  resultsTitle: { fontSize: 18, fontWeight: '800', color: '#212121', marginBottom: 2 },
  resultsSubtitle: { fontSize: 12, color: '#888', marginBottom: 14 },
  loadingText: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 30 },
  resultCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  resultImage: {
    width: 50, height: 50, borderRadius: 12,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  resultInfo: { flex: 1 },
  resultNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  resultName: { fontSize: 14, fontWeight: '700', color: '#212121' },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeBadgeProduct: { backgroundColor: '#E8F5E9' },
  typeBadgeService: { backgroundColor: '#FFF3E0' },
  typeBadgeText: { fontSize: 8, fontWeight: '700', color: '#006B3F' },
  resultProduct: { fontSize: 12, color: '#006B3F', fontWeight: '500', marginBottom: 4 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultRating: { fontSize: 11, fontWeight: '600', color: '#555' },
  resultDistance: { fontSize: 11, color: '#888' },
  resultPrice: { alignItems: 'flex-end' },
  resultPriceText: { fontSize: 15, fontWeight: '800', color: '#006B3F', marginBottom: 4 },
  buyBtn: {
    backgroundColor: '#006B3F', paddingVertical: 5, paddingHorizontal: 14, borderRadius: 14,
  },
  buyBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  bookBtn: {
    backgroundColor: '#F57C00', paddingVertical: 5, paddingHorizontal: 14, borderRadius: 14,
  },
  bookBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  // Categories
  categoriesScroll: { marginBottom: 22 },
  categoryCard: {
    width: 140, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginRight: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  categoryIcon: {
    width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  categoryTitle: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 2 },
  categoryDesc: { fontSize: 10, color: '#888' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  seeAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  recommendScroll: { marginBottom: 22 },
  recommendCard: {
    width: 180, backgroundColor: '#FFFFFF', borderRadius: 16, marginRight: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  recommendCover: {
    height: 90, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  recommendBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: '#006B3F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  recommendBadgeText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },
  ratingBadge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 2,
  },
  ratingText: { fontSize: 10, fontWeight: '700', color: '#555' },
  recommendInfo: { padding: 12 },
  recommendName: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 2 },
  recommendMeta: { fontSize: 11, color: '#888', marginBottom: 10 },
  connectBtn: {
    borderWidth: 1.5, borderColor: '#006B3F', paddingVertical: 8, borderRadius: 16, alignItems: 'center',
  },
  connectBtnText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  continueCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, marginBottom: 8,
  },
  continueLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  continueIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  continueName: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 1 },
  continueCategory: { fontSize: 11, color: '#888', marginBottom: 2 },
  continueAction: { fontSize: 11, color: '#006B3F', fontWeight: '500' },
  continueBtn: {
    borderWidth: 1.5, borderColor: '#006B3F', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
  },
  continueBtnText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  recentScroll: { marginBottom: 22 },
  recentCard: { alignItems: 'center', marginRight: 16, width: 65 },
  recentAvatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 6, position: 'relative',
  },
  recentOnlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#FFFFFF',
  },
  recentName: { fontSize: 11, fontWeight: '600', color: '#212121', textAlign: 'center' },
  recentCategory: { fontSize: 9, color: '#888', textAlign: 'center' },
  expandBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F5E9', borderRadius: 18, padding: 16,
  },
  expandLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  expandIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  expandTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },
  expandSubtitle: { fontSize: 11, color: '#666' },
  expandBtn: {
    backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 18,
  },
  expandBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  searchInput: {
  flex: 1,
  fontSize: 13,
  color: '#212121',
  marginLeft: 8,
  outlineStyle: 'none',  // ← Add this line
},
headerLogo: {
  width: 120,
  height: 36,
  marginBottom: 2,
},
  navItem: { alignItems: 'center', gap: 2, position: 'relative' },
  navBadge: {
    position: 'absolute', top: -6, right: 6,
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
  },
  navBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
});