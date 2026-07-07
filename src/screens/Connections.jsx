import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  Modal, Switch, ActivityIndicator, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Connections({ navigation }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredShops, setFeaturedShops] = useState([]);
  const [serviceProviders, setServiceProviders] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [searchHistory] = useState([
    'Bright Electricals', 'FreshMart Supermarket', 'Plumbing services', 'Paracetamol', 'Cafe Jinja',
  ]);

  const recentNotifications = [
    { id: 1, icon: 'chatbubble-outline', color: '#006B3F', bg: '#E8F5E9', title: 'New message', time: '2 min ago', unread: true },
    { id: 2, icon: 'calendar-outline', color: '#1976D2', bg: '#E3F2FD', title: 'Booking confirmed', time: '15 min ago', unread: true },
    { id: 3, icon: 'cube-outline', color: '#F57C00', bg: '#FFF3E0', title: 'Order out for delivery', time: '1 hour ago', unread: false },
    { id: 4, icon: 'card-outline', color: '#9C27B0', bg: '#F3E5F5', title: 'Payment received', time: '2 hours ago', unread: false },
  ];

  const quickCategories = [
    { icon: 'storefront-outline', title: 'Shops Near You', desc: 'Discover local stores', color: '#006B3F', bg: '#E8F5E9' },
    { icon: 'briefcase-outline', title: 'Service Providers', desc: 'Find professionals', color: '#1976D2', bg: '#E3F2FD' },
    { icon: 'pricetag-outline', title: 'Deals For You', desc: 'Exclusive offers', color: '#F57C00', bg: '#FFF3E0' },
    { icon: 'star-outline', title: 'Top Rated', desc: 'Best businesses', color: '#9C27B0', bg: '#F3E5F5' },
    { icon: 'calendar-outline', title: 'Events Near You', desc: 'Upcoming events', color: '#D32F2F', bg: '#FFEBEE' },
  ];

  const getServiceIcon = (category) => {
    const icons = {
      'Plumbing': 'water-outline', 'Electrical': 'flash-outline', 'Beauty': 'cut-outline',
      'Healthcare': 'medkit-outline', 'Education': 'school-outline', 'Transport': 'car-outline',
      'Cleaning': 'sparkles-outline', 'Automotive': 'construct-outline', 'Events': 'calendar-outline',
    };
    return icons[category] || 'briefcase-outline';
  };

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setPageLoading(true);
    try {
      const { data: shops } = await supabase.from('shops').select('*').order('rating', { ascending: false }).limit(6);
      if (shops) setFeaturedShops(shops);

      const { data: spData } = await supabase
        .from('shop_products')
        .select('id, shop_id, catalog_id, regular_price, in_stock')
        .eq('in_stock', true).limit(20);

      if (spData && spData.length > 0) {
        const catalogIds = [...new Set(spData.map(p => p.catalog_id))];
        const shopIds = [...new Set(spData.map(p => p.shop_id))];
        const { data: catalogData } = await supabase.from('catalog').select('id, name, category, images').in('id', catalogIds);
        const { data: shopData } = await supabase.from('shops').select('id, name, rating, distance, discount_percentage, is_open, is_anchor_partner').in('id', shopIds);
        const catalogMap = {}; if (catalogData) catalogData.forEach(c => { catalogMap[c.id] = c; });
        const shopMap = {}; if (shopData) shopData.forEach(s => { shopMap[s.id] = s; });

        const mapped = spData.map(p => {
          const catalog = catalogMap[p.catalog_id]; const shop = shopMap[p.shop_id];
          if (!catalog || !shop) return null;
          const dp = shop.discount_percentage || 10;
          const mp = Math.round(Number(p.regular_price) * (1 - dp / 100));
          return {
            id: p.id, shopId: shop.id, shopName: shop.name, productName: catalog.name,
            category: catalog.category, images: catalog.images || [],
            rating: Number(shop.rating || 4.0), distance: shop.distance || '1.0 km',
            regularPrice: Number(p.regular_price), munolinkPrice: mp,
            savings: Number(p.regular_price) - mp, discount: dp,
            isOpen: shop.is_open ?? true, isPartner: shop.is_anchor_partner || false,
          };
        }).filter(Boolean);
        setFeaturedProducts(mapped);
      }

      const { data: psData } = await supabase
        .from('provider_services')
        .select('id, user_id, service_id, price, is_active')
        .eq('is_active', true).limit(20);

      if (psData && psData.length > 0) {
        const userIds = [...new Set(psData.map(p => p.user_id))];
        const serviceIds = [...new Set(psData.map(p => p.service_id))];
        const { data: usersData } = await supabase.from('users').select('id, full_name').in('id', userIds);
        const { data: scData } = await supabase.from('service_catalog').select('id, name, category, images').in('id', serviceIds);
        const userMap = {}; if (usersData) usersData.forEach(u => { userMap[u.id] = u; });
        const scMap = {}; if (scData) scData.forEach(s => { scMap[s.id] = s; });

        const providerMap = new Map();
        psData.forEach(p => {
          const u = userMap[p.user_id]; const sc = scMap[p.service_id];
          if (!u || !sc) return;
          if (!providerMap.has(u.id)) {
            providerMap.set(u.id, {
              id: u.id, name: u.full_name || 'Provider',
              primaryCategory: sc.category,
              services: [], rating: 4.0 + Math.random() * 1.0,
              reviews: Math.floor(Math.random() * 200) + 10,
              distance: `${(Math.random() * 3 + 0.3).toFixed(1)} km`,
            });
          }
          const prov = providerMap.get(u.id);
          prov.services.push({ id: p.id, serviceName: sc.name, category: sc.category, price: p.price });
        });
        setServiceProviders([...providerMap.values()]);
      }
    } catch (err) { console.error('fetchInitialData error:', err); }
    setPageLoading(false);
  };

  const fetchSuggestions = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSuggestions(searchHistory.map((item) => ({ text: item, type: 'history' })));
      setShowSuggestions(searchHistory.length > 0);
      return;
    }
    let all = [];
    const { data: c } = await supabase.from('catalog').select('name, category').or(`name.ilike.%${query}%,category.ilike.%${query}%`).limit(4);
    if (c) c.forEach(i => all.push({ text: i.name, type: 'product', category: i.category }));
    const { data: s } = await supabase.from('service_catalog').select('name, category').or(`name.ilike.%${query}%,category.ilike.%${query}%`).limit(4);
    if (s) s.forEach(i => all.push({ text: i.name, type: 'service', category: i.category }));
    const unique = []; const seen = new Set();
    all.forEach(x => { if (!seen.has(x.text)) { seen.add(x.text); unique.push(x); } });
    setSuggestions(unique.slice(0, 8));
    setShowSuggestions(unique.length > 0);
  };

  const runSearch = async (query) => {
    setSearchQuery(query); setShowSuggestions(false); setIsSearching(true); setLoading(true);
    let allResults = [];
    const { data: cm } = await supabase.from('catalog').select('id').or(`name.ilike.%${query}%,category.ilike.%${query}%`).limit(15);
    if (cm && cm.length > 0) {
      const cids = cm.map(x => x.id);
      const { data: prods } = await supabase.from('shop_products').select('id, shop_id, catalog_id, regular_price, in_stock').in('catalog_id', cids).eq('in_stock', true).limit(10);
      if (prods && prods.length > 0) {
        const pcids = [...new Set(prods.map(p => p.catalog_id))]; const psids = [...new Set(prods.map(p => p.shop_id))];
        const { data: cd } = await supabase.from('catalog').select('id, name, category, images').in('id', pcids);
        const { data: sd } = await supabase.from('shops').select('id, name, rating, distance, discount_percentage, is_open, is_anchor_partner').in('id', psids);
        const cmap = {}; if (cd) cd.forEach(x => { cmap[x.id] = x; });
        const smap = {}; if (sd) sd.forEach(x => { smap[x.id] = x; });
        prods.forEach(p => {
          const cat = cmap[p.catalog_id]; const sh = smap[p.shop_id];
          if (!cat || !sh) return;
          const dp = sh.discount_percentage || 10;
          allResults.push({
            id: p.id, shopId: sh.id, type: 'product', shopName: sh.name, productName: cat.name,
            category: cat.category, images: cat.images || [],
            rating: Number(sh.rating || 4.0), distance: sh.distance || '1.0 km',
            regularPrice: Number(p.regular_price), munolinkPrice: Math.round(Number(p.regular_price) * (1 - dp / 100)),
            savings: Math.round(Number(p.regular_price) * dp / 100), discount: dp,
            open: sh.is_open ?? true, isPartner: sh.is_anchor_partner || false,
          });
        });
      }
    }
    const { data: sm } = await supabase.from('service_catalog').select('id').or(`name.ilike.%${query}%,category.ilike.%${query}%`).limit(10);
    if (sm && sm.length > 0) {
      const sids = sm.map(x => x.id);
      const { data: psv } = await supabase.from('provider_services').select('id, user_id, service_id, price').in('service_id', sids).eq('is_active', true).limit(10);
      if (psv && psv.length > 0) {
        const uids = [...new Set(psv.map(p => p.user_id))]; const scids = [...new Set(psv.map(p => p.service_id))];
        const { data: ud } = await supabase.from('users').select('id, full_name').in('id', uids);
        const { data: scd } = await supabase.from('service_catalog').select('id, name, category, images').in('id', scids);
        const umap = {}; if (ud) ud.forEach(u => { umap[u.id] = u; });
        const scmap = {}; if (scd) scd.forEach(s => { scmap[s.id] = s; });
        const seen = new Set();
        psv.forEach(p => {
          const u = umap[p.user_id]; const sc = scmap[p.service_id];
          if (!u || !sc || seen.has(u.id)) return;
          seen.add(u.id);
          allResults.push({
            id: p.id, providerId: u.id, type: 'service', shopName: u.full_name || 'Provider',
            productName: sc.name, category: sc.category, images: sc.images || [],
            rating: 4.5, distance: '1.0 km', regularPrice: Number(p.price), munolinkPrice: Number(p.price),
            savings: 0, discount: 0, open: true, isPartner: false,
          });
        });
      }
    }
    setSearchResults(allResults); setLoading(false);
  };

  const handleSuggestionTap = (s) => runSearch(s.text);
  const handleClearSearch = () => { setSearchQuery(''); setSearchResults([]); setIsSearching(false); setShowSuggestions(false); setShowAllProducts(false); setShowAllServices(false); };
  const handleResultTap = (item) => {
    if (item.type === 'product') navigation.navigate('ProductDetails', { productId: item.id, shopId: item.shopId });
    else navigation.navigate('ServiceProviderProfile', { providerId: item.providerId });
  };
  const handleProductTap = (item) => navigation.navigate('ProductDetails', { productId: item.id, shopId: item.shopId });
  const handleProviderTap = (provider) => navigation.navigate('ServiceProviderProfile', { providerId: provider.id });

  const requireAuth = (action) => {
    if (!user) { setShowAuthPopup(true); return false; }
    action(); return true;
  };

  if (pageLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><View style={styles.headerCenter}><Text style={styles.logo}>MUNOLINK</Text><Text style={styles.tagline}>For Better Connections</Text></View></View>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#006B3F" /><Text style={styles.loadingText}>Loading...</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity><Ionicons name="menu-outline" size={26} color="#212121" /></TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.logo}>MUNOLINK</Text><Text style={styles.tagline}>For Better Connections</Text></View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => setShowNotifDropdown(!showNotifDropdown)}><Ionicons name="notifications-outline" size={24} color="#212121" /><View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View></TouchableOpacity>
          <TouchableOpacity onPress={() => setShowProfileDropdown(!showProfileDropdown)}><View style={styles.profilePic}><Ionicons name="person" size={20} color="#FFFFFF" />{user && <View style={styles.onlineDot} />}</View></TouchableOpacity>
        </View>
      </View>

      {showNotifDropdown && (
        <View style={styles.notifDropdown}>
          <View style={styles.notifDropdownHeader}><Text style={styles.notifDropdownTitle}>Notifications</Text><TouchableOpacity><Text style={styles.markReadText}>Mark all read</Text></TouchableOpacity></View>
          {recentNotifications.map((n) => (<TouchableOpacity key={n.id} style={styles.notifItem}><View style={[styles.notifIcon, { backgroundColor: n.bg }]}><Ionicons name={n.icon} size={16} color={n.color} /></View><View style={styles.notifInfo}><Text style={styles.notifTitle} numberOfLines={2}>{n.title}</Text><Text style={styles.notifTime}>{n.time}</Text></View>{n.unread && <View style={styles.notifUnreadDot} />}</TouchableOpacity>))}
          <TouchableOpacity style={styles.viewAllNotif} onPress={() => { setShowNotifDropdown(false); navigation.navigate('Notifications'); }}><Text style={styles.viewAllNotifText}>View all</Text><Ionicons name="arrow-forward" size={14} color="#006B3F" /></TouchableOpacity>
        </View>
      )}

      {showProfileDropdown && (
        <View style={styles.profileDropdown}>
          {user ? (<><View style={styles.profileDropdownUser}><View style={styles.profileDropdownAvatar}><Ionicons name="person" size={28} color="#006B3F" /></View><View><Text style={styles.profileDropdownName}>{user.fullName || 'User'}</Text></View></View><View style={styles.profileDropdownDivider} /><TouchableOpacity style={styles.profileDropdownItem} onPress={() => { setShowProfileDropdown(false); navigation.navigate('Account'); }}><Ionicons name="person-outline" size={18} color="#555" /><Text style={styles.profileDropdownItemText}>Profile</Text></TouchableOpacity><TouchableOpacity style={styles.profileDropdownItem} onPress={() => { setShowProfileDropdown(false); navigation.navigate('MyWallet'); }}><Ionicons name="wallet-outline" size={18} color="#555" /><Text style={styles.profileDropdownItemText}>Wallet</Text></TouchableOpacity><TouchableOpacity style={styles.profileDropdownItem} onPress={() => { setShowProfileDropdown(false); navigation.navigate('MyOrders'); }}><Ionicons name="receipt-outline" size={18} color="#555" /><Text style={styles.profileDropdownItemText}>Orders</Text></TouchableOpacity></>) : (<><View style={styles.profileDropdownGuest}><Ionicons name="person-circle-outline" size={48} color="#888" /><Text style={styles.profileDropdownGuestTitle}>Welcome</Text></View><TouchableOpacity style={styles.profileDropdownSignInBtn} onPress={() => { setShowProfileDropdown(false); navigation.navigate('SignIn'); }}><Text style={styles.profileDropdownSignInText}>Sign In</Text></TouchableOpacity></>)}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" onTouchStart={() => { setShowSuggestions(false); setShowNotifDropdown(false); setShowProfileDropdown(false); }}>
        {!isSearching && !showAllProducts && !showAllServices && (
          <View style={styles.titleRow}><View style={styles.titleLeft}><Text style={styles.pageTitle}>My Connections</Text><Text style={styles.pageSubtitle}>Discover, connect and grow with trusted businesses & providers.</Text></View><TouchableOpacity style={styles.mapBtn} onPress={() => navigation.navigate('RouteNavigation')}><Ionicons name="location-outline" size={16} color="#006B3F" /><Text style={styles.mapBtnText}>Map</Text></TouchableOpacity></View>
        )}

        <View style={styles.searchContainer}>
          {isSearching && <TouchableOpacity style={styles.backArrow} onPress={handleClearSearch}><Ionicons name="arrow-back" size={24} color="#212121" /></TouchableOpacity>}
          <View style={[styles.searchRow, isSearching && styles.searchRowActive]}>
            <View style={styles.searchBar}><Ionicons name="search-outline" size={18} color="#888" /><TextInput style={styles.searchInput} value={searchQuery} onChangeText={fetchSuggestions} placeholder="Search..." placeholderTextColor="#CCCCCC" onFocus={() => { if (searchQuery.length < 2 && !isSearching) { setSuggestions(searchHistory.map(i => ({ text: i, type: 'history' }))); setShowSuggestions(true); } }} onSubmitEditing={() => { if (searchQuery.length >= 2) runSearch(searchQuery); }} />{searchQuery.length > 0 && <TouchableOpacity onPress={handleClearSearch}><Ionicons name="close-circle" size={18} color="#CCC" /></TouchableOpacity>}</View>
            {!isSearching && <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(true)}><Ionicons name="options-outline" size={18} color="#006B3F" /><Text style={styles.filterBtnText}>Filter</Text></TouchableOpacity>}
          </View>
          {showSuggestions && !isSearching && (<View style={styles.suggestionsDropdown}>{suggestions.map((s, i) => (<TouchableOpacity key={i} style={styles.suggestionRow} onPress={() => handleSuggestionTap(s)}><Ionicons name={s.type === 'history' ? 'time-outline' : s.type === 'service' ? 'person-outline' : 'cube-outline'} size={16} color={s.type === 'history' ? '#888' : '#006B3F'} /><View style={styles.suggestionInfo}><Text style={styles.suggestionText}>{s.text}</Text></View></TouchableOpacity>))}</View>)}
        </View>

        {isSearching ? (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Results for "{searchQuery}"</Text>
            {loading ? <ActivityIndicator size="small" color="#006B3F" /> : searchResults.length === 0 ? <Text style={styles.loadingText}>No results found.</Text> : searchResults.map((item) => (
              <TouchableOpacity key={item.id + item.type} style={styles.resultCard} onPress={() => handleResultTap(item)} activeOpacity={0.7}>
                <View style={styles.resultImage}>{item.images?.[0] ? <Image source={{ uri: item.images[0] }} style={{ width: 50, height: 50, borderRadius: 12 }} /> : <Ionicons name={item.type === 'service' ? 'person' : 'storefront'} size={36} color="#006B3F" />}</View>
                <View style={styles.resultInfo}><Text style={styles.resultName}>{item.shopName}</Text><Text style={styles.resultProduct}>{item.productName}</Text><Text style={styles.resultMeta}>⭐ {item.rating} · {item.distance}</Text></View>
                <Text style={styles.resultPriceText}>UGX {item.munolinkPrice?.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : !showAllProducts && !showAllServices ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {quickCategories.map((cat, i) => (<TouchableOpacity key={i} style={styles.categoryCard} onPress={() => { if (cat.title === 'Shops Near You') navigation.navigate('Categories'); else if (cat.title === 'Service Providers') navigation.navigate('ServicesHome'); else if (cat.title === 'Deals For You') setShowAllProducts(true); else if (cat.title === 'Top Rated') setShowAllProducts(true); }}><View style={[styles.categoryIcon, { backgroundColor: cat.bg }]}><Ionicons name={cat.icon} size={24} color={cat.color} /></View><Text style={styles.categoryTitle}>{cat.title}</Text><Text style={styles.categoryDesc}>{cat.desc}</Text></TouchableOpacity>))}
            </ScrollView>

            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Products For You</Text><TouchableOpacity onPress={() => setShowAllProducts(true)}><Text style={styles.seeAll}>See all ({featuredProducts.length})</Text></TouchableOpacity></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendScroll}>
              {featuredProducts.slice(0, 6).map((item) => (
                <TouchableOpacity key={item.id} style={styles.recommendCard} onPress={() => handleProductTap(item)} activeOpacity={0.7}>
                  <View style={styles.recommendCover}>{item.images?.[0] ? <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: '100%' }} /> : <Ionicons name="cube-outline" size={36} color="#006B3F" />}<View style={styles.recommendBadge}><Text style={styles.recommendBadgeText}>{item.discount}% OFF</Text></View><View style={styles.ratingBadge}><Ionicons name="star" size={10} color="#FFB300" /><Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text></View></View>
                  <View style={styles.recommendInfo}><Text style={styles.recommendName} numberOfLines={1}>{item.productName}</Text><Text style={styles.recommendMeta}>{item.shopName} · {item.distance}</Text><Text style={styles.recommendPrice}>UGX {item.munolinkPrice.toLocaleString()}</Text></View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* SERVICES SECTION - Now shows individual services */}
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Services Near You</Text><TouchableOpacity onPress={() => navigation.navigate('ServicesHome')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendScroll}>
              {serviceProviders.slice(0, 6).map((provider) => {
                const firstService = provider.services?.[0];
                return (
                  <TouchableOpacity key={provider.id} style={styles.recommendCard} onPress={() => navigation.navigate('BookService', { providerId: provider.id, providerName: provider.name, serviceId: firstService?.id })} activeOpacity={0.7}>
                    <View style={[styles.recommendCover, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name={getServiceIcon(provider.primaryCategory)} size={36} color="#1976D2" />
                      <View style={styles.ratingBadge}><Ionicons name="star" size={10} color="#FFB300" /><Text style={styles.ratingText}>{provider.rating.toFixed(1)}</Text></View>
                    </View>
                    <View style={styles.recommendInfo}>
                      <Text style={styles.recommendName} numberOfLines={1}>{firstService?.serviceName || 'Service'}</Text>
                      <Text style={styles.recommendMeta}>{provider.name}</Text>
                      {firstService?.price && <Text style={styles.recommendPrice}>From UGX {firstService.price.toLocaleString()}</Text>}
                      <TouchableOpacity style={styles.bookServiceMiniBtn} onPress={() => navigation.navigate('BookService', { providerId: provider.id, providerName: provider.name })}><Text style={styles.bookServiceMiniText}>Book Now</Text></TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Shops Near You</Text><TouchableOpacity onPress={() => navigation.navigate('Categories')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
              {featuredShops.map((shop) => (<TouchableOpacity key={shop.id} style={styles.recentCard} onPress={() => navigation.navigate('ShopProfile', { shopId: shop.id })}><View style={styles.recentAvatar}><Ionicons name="storefront" size={22} color="#006B3F" />{shop.is_open && <View style={styles.recentOnlineDot} />}</View><Text style={styles.recentName} numberOfLines={1}>{shop.name}</Text><Text style={styles.recentCategory}>{shop.category}</Text></TouchableOpacity>))}
            </ScrollView>
          </>
        ) : showAllProducts ? (
          <View style={styles.fullSection}>
            <View style={styles.fullSectionHeader}><TouchableOpacity onPress={() => setShowAllProducts(false)}><Ionicons name="arrow-back" size={24} color="#212121" /></TouchableOpacity><Text style={styles.fullSectionTitle}>All Products</Text></View>
            <View style={styles.productGrid}>{featuredProducts.map((item) => (<TouchableOpacity key={item.id} style={styles.productGridCard} onPress={() => handleProductTap(item)}><View style={styles.productGridImage}>{item.images?.[0] ? <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: '100%', borderRadius: 10 }} /> : <Ionicons name="cube-outline" size={32} color="#006B3F" />}</View><Text style={styles.productGridName} numberOfLines={2}>{item.productName}</Text><Text style={styles.productGridShop}>{item.shopName}</Text><Text style={styles.productGridPrice}>UGX {item.munolinkPrice.toLocaleString()}</Text></TouchableOpacity>))}</View>
          </View>
        ) : null}
        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => requireAuth(() => navigation.navigate('MyWallet'))}><Ionicons name="wallet-outline" size={22} color="#888" /><Text style={styles.navLabel}>Wallet</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => requireAuth(() => navigation.navigate('MyOrders'))}><Ionicons name="calendar-outline" size={22} color="#888" /><Text style={styles.navLabel}>Orders</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Ionicons name="people" size={22} color="#006B3F" /><Text style={[styles.navLabel, styles.navLabelActive]}>Connections</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => requireAuth(() => navigation.navigate('Messages'))}><Ionicons name="chatbubbles-outline" size={22} color="#888" /><View style={styles.navBadge}><Text style={styles.navBadgeText}>3</Text></View><Text style={styles.navLabel}>Messages</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setShowProfileDropdown(!showProfileDropdown)}><Ionicons name="person-outline" size={22} color="#888" /><Text style={styles.navLabel}>Account</Text></TouchableOpacity>
      </View>

      <Modal visible={showFilter} animationType="slide" transparent onRequestClose={() => setShowFilter(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Filter</Text><TouchableOpacity onPress={() => setShowFilter(false)}><Ionicons name="close" size={24} color="#212121" /></TouchableOpacity></View><View style={styles.modalActions}><TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilter(false)}><Text style={styles.applyBtnText}>Apply</Text></TouchableOpacity></View></View></View>
      </Modal>

      <Modal visible={showAuthPopup} animationType="fade" transparent onRequestClose={() => setShowAuthPopup(false)}>
        <View style={styles.authPopupOverlay}><View style={styles.authPopupCard}><View style={styles.authPopupIcon}><Ionicons name="lock-closed" size={40} color="#006B3F" /></View><Text style={styles.authPopupTitle}>Sign in Required</Text><TouchableOpacity style={styles.authPopupSignUpBtn} onPress={() => { setShowAuthPopup(false); navigation.navigate('AccountType'); }}><Text style={styles.authPopupSignUpText}>Create Account</Text></TouchableOpacity><TouchableOpacity style={styles.authPopupSignInBtn} onPress={() => { setShowAuthPopup(false); navigation.navigate('SignIn'); }}><Text style={styles.authPopupSignInText}>Sign In</Text></TouchableOpacity></View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerCenter: { alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 9, color: '#888' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  profilePic: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#888', fontWeight: '500' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8 },
  titleLeft: { flex: 1, minWidth: 0 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121' },
  pageSubtitle: { fontSize: 13, color: '#888', marginTop: 2, flexShrink: 1 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#006B3F', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4, flexShrink: 0, alignSelf: 'flex-start', marginTop: 4 },
  mapBtnText: { fontSize: 12, fontWeight: '600', color: '#006B3F' },
  searchContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18, zIndex: 10 },
  backArrow: { marginRight: 10, marginTop: 10 },
  searchRow: { flex: 1, flexDirection: 'row', gap: 8 },
  searchRowActive: { flex: 1 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: '#ECECEC' },
  searchInput: { flex: 1, fontSize: 13, color: '#212121', marginLeft: 8, outlineStyle: 'none' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 14, paddingHorizontal: 14, gap: 4 },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: '#006B3F' },
  suggestionsDropdown: { position: 'absolute', top: 50, left: 0, right: 60, backgroundColor: '#FFFFFF', borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden' },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 10 },
  suggestionInfo: { flex: 1 },
  suggestionText: { fontSize: 13, fontWeight: '600', color: '#212121' },
  resultsContainer: { marginTop: 8 },
  resultsTitle: { fontSize: 18, fontWeight: '800', color: '#212121', marginBottom: 2 },
  resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  resultImage: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 14, fontWeight: '700', color: '#212121' },
  resultProduct: { fontSize: 12, color: '#888' },
  resultMeta: { fontSize: 11, color: '#888' },
  resultPriceText: { fontSize: 15, fontWeight: '800', color: '#006B3F' },
  categoriesScroll: { marginBottom: 22 },
  categoryCard: { width: 140, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginRight: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  categoryIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  categoryTitle: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 2 },
  categoryDesc: { fontSize: 10, color: '#888' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  seeAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  recommendScroll: { marginBottom: 22 },
  recommendCard: { width: 160, backgroundColor: '#FFFFFF', borderRadius: 16, marginRight: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  recommendCover: { height: 80, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  recommendBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#006B3F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  recommendBadgeText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },
  ratingBadge: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 2 },
  ratingText: { fontSize: 10, fontWeight: '700', color: '#555' },
  recommendInfo: { padding: 10 },
  recommendName: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 2 },
  recommendMeta: { fontSize: 11, color: '#888', marginBottom: 4 },
  recommendPrice: { fontSize: 14, fontWeight: '800', color: '#006B3F' },
  bookServiceMiniBtn: { backgroundColor: '#1976D2', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 14, marginTop: 8, alignSelf: 'flex-start' },
  bookServiceMiniText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  recentScroll: { marginBottom: 22 },
  recentCard: { alignItems: 'center', marginRight: 16, width: 70 },
  recentAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 6, position: 'relative' },
  recentOnlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#FFFFFF' },
  recentName: { fontSize: 11, fontWeight: '600', color: '#212121', textAlign: 'center' },
  recentCategory: { fontSize: 9, color: '#888', textAlign: 'center' },
  fullSection: { marginTop: 8 },
  fullSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  fullSectionTitle: { fontSize: 20, fontWeight: '800', color: '#212121', flex: 1 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  productGridCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 10, marginBottom: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  productGridImage: { width: '100%', height: 90, backgroundColor: '#F5F5F5', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden' },
  productGridName: { fontSize: 12, fontWeight: '700', color: '#212121', marginBottom: 2, lineHeight: 16 },
  productGridShop: { fontSize: 10, color: '#888', marginBottom: 4 },
  productGridPrice: { fontSize: 14, fontWeight: '800', color: '#006B3F' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25, borderTopWidth: 1, borderTopColor: '#F0F0F0', position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem: { alignItems: 'center', gap: 2, position: 'relative' },
  navBadge: { position: 'absolute', top: -6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  navBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#212121' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  applyBtn: { flex: 1, backgroundColor: '#006B3F', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
  applyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  notifDropdown: { position: 'absolute', top: 95, right: 16, width: 300, backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8, zIndex: 100, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden' },
  notifDropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  notifDropdownTitle: { fontSize: 15, fontWeight: '800', color: '#212121' },
  markReadText: { fontSize: 12, color: '#006B3F', fontWeight: '600' },
  notifItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 10 },
  notifIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  notifInfo: { flex: 1 },
  notifTitle: { fontSize: 12, fontWeight: '600', color: '#212121', lineHeight: 17 },
  notifTime: { fontSize: 10, color: '#AAA', marginTop: 2 },
  notifUnreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#006B3F' },
  viewAllNotif: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, gap: 4, backgroundColor: '#FAFAFA' },
  viewAllNotifText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  profileDropdown: { position: 'absolute', top: 95, right: 16, width: 220, backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8, zIndex: 100, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden' },
  profileDropdownUser: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 14 },
  profileDropdownAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  profileDropdownName: { fontSize: 14, fontWeight: '700', color: '#212121' },
  profileDropdownDivider: { height: 1, backgroundColor: '#F0F0F0' },
  profileDropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 10 },
  profileDropdownItemText: { fontSize: 13, fontWeight: '600', color: '#555' },
  profileDropdownGuest: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 14, gap: 6 },
  profileDropdownGuestTitle: { fontSize: 15, fontWeight: '700', color: '#212121' },
  profileDropdownSignInBtn: { backgroundColor: '#006B3F', marginHorizontal: 14, paddingVertical: 12, borderRadius: 22, alignItems: 'center' },
  profileDropdownSignInText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  authPopupOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  authPopupCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 28, alignItems: 'center', width: '100%' },
  authPopupIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  authPopupTitle: { fontSize: 20, fontWeight: '800', color: '#212121', marginBottom: 8 },
  authPopupSignUpBtn: { backgroundColor: '#006B3F', width: '100%', paddingVertical: 14, borderRadius: 25, alignItems: 'center', marginBottom: 10 },
  authPopupSignUpText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  authPopupSignInBtn: { borderWidth: 1.5, borderColor: '#006B3F', width: '100%', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
  authPopupSignInText: { fontSize: 15, fontWeight: '700', color: '#006B3F' },
});