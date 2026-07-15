import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  Modal, Switch, ActivityIndicator, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LogoImage from '../../assets/logo.png';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ ADD THIS C CONSTANT BACK - IT WAS MISSING!
const C = {
  primary: '#1F2F5F',
  accent: '#4A7DFF',
  white: '#FFFFFF',
  background: '#F5F6FA',
  border: '#DCE5FF',
  muted: '#8E99B3',
  text: '#1F2F5F',
  success: '#4CAF50',
  danger: '#F44336',
  warning: '#FF9800',
  purple: '#9C27B0',
  lightBg: '#EEF3FF',
  greenBg: '#E8F5E9',
  blueBg: '#E3F2FD',
  orangeBg: '#FFF3E0',
  purpleBg: '#F3E5F5',
  redBg: '#FFEBEE',
};

export default function Connections({ navigation }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const insets = useSafeAreaInsets();
  
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

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredShops, setFeaturedShops] = useState([]);
  const [serviceProviders, setServiceProviders] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const searchHistory = ['Bright Electricals', 'FreshMart Supermarket', 'Plumbing services', 'Paracetamol', 'Cafe Jinja'];

  const recentNotifications = [
    { id: 1, icon: 'chatbubble-outline', color: C.accent, bg: C.blueBg, title: 'New message', time: '2 min ago', unread: true },
    { id: 2, icon: 'calendar-outline', color: '#1976D2', bg: C.blueBg, title: 'Booking confirmed', time: '15 min ago', unread: true },
    { id: 3, icon: 'cube-outline', color: C.warning, bg: C.orangeBg, title: 'Order out for delivery', time: '1 hour ago', unread: false },
    { id: 4, icon: 'card-outline', color: C.purple, bg: C.purpleBg, title: 'Payment received', time: '2 hours ago', unread: false },
  ];

  const getServiceIcon = (category) => {
    const icons = {
      'Plumbing': 'water-outline', 'Electrical': 'flash-outline', 'Beauty': 'cut-outline',
      'Healthcare': 'medkit-outline', 'Education': 'school-outline', 'Transport': 'car-outline',
      'Cleaning': 'sparkles-outline', 'Automotive': 'construct-outline', 'Events': 'calendar-outline',
    };
    return icons[category] || 'briefcase-outline';
  };

  // Define requireAuth function
  const requireAuth = (action) => {
    if (!user) {
      setShowAuthPopup(true);
      return false;
    }
    action();
    return true;
  };

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setPageLoading(true);
    try {
      const { data: shops } = await supabase.from('shops').select('*').order('rating', { ascending: false }).limit(6);
      if (shops) setFeaturedShops(shops);
      const { data: spData } = await supabase.from('shop_products').select('id, shop_id, catalog_id, regular_price, in_stock').eq('in_stock', true).limit(20);
      if (spData && spData.length > 0) {
        const catalogIds = [...new Set(spData.map(p => p.catalog_id))];
        const shopIds = [...new Set(spData.map(p => p.shop_id))];
        const { data: catalogData } = await supabase.from('catalog').select('id, name, category, images').in('id', catalogIds);
        const { data: shopData } = await supabase.from('shops').select('id, name, rating, distance, discount_percentage, is_open, is_anchor_partner').in('id', shopIds);
        const catalogMap = {}; if (catalogData) catalogData.forEach(c => { catalogMap[c.id] = c; });
        const shopMap = {}; if (shopData) shopData.forEach(s => { shopMap[s.id] = s; });
        setFeaturedProducts(spData.map(p => {
          const catalog = catalogMap[p.catalog_id]; const shop = shopMap[p.shop_id];
          if (!catalog || !shop) return null;
          const dp = shop.discount_percentage || 10;
          const mp = Math.round(Number(p.regular_price) * (1 - dp / 100));
          return { id: p.id, shopId: shop.id, shopName: shop.name, productName: catalog.name, category: catalog.category, images: catalog.images || [], rating: Number(shop.rating || 4.0), distance: shop.distance || '1.0 km', regularPrice: Number(p.regular_price), munolinkPrice: mp, savings: Number(p.regular_price) - mp, discount: dp, isOpen: shop.is_open ?? true, isPartner: shop.is_anchor_partner || false };
        }).filter(Boolean));
      }
      const { data: psData } = await supabase.from('provider_services').select('id, user_id, service_id, price, is_active').eq('is_active', true).limit(20);
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
          if (!providerMap.has(u.id)) providerMap.set(u.id, { id: u.id, name: u.full_name || 'Provider', primaryCategory: sc.category, services: [], rating: 4.0 + Math.random() * 1.0, reviews: Math.floor(Math.random() * 200) + 10, distance: `${(Math.random() * 3 + 0.3).toFixed(1)} km` });
          providerMap.get(u.id).services.push({ id: p.id, serviceId: sc.id, serviceName: sc.name, category: sc.category, price: p.price, images: sc.images || [] });
        });
        setServiceProviders([...providerMap.values()]);
      }
    } catch (err) { console.error(err); }
    setPageLoading(false);
  };

  const fetchSuggestions = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSuggestions(searchHistory.map(i => ({ text: i, type: 'history' }))); setShowSuggestions(true); return; }
    let all = [];
    const { data: c } = await supabase.from('catalog').select('name, category').or(`name.ilike.%${query}%,category.ilike.%${query}%`).limit(4);
    if (c) c.forEach(i => all.push({ text: i.name, type: 'product', category: i.category }));
    const { data: s } = await supabase.from('service_catalog').select('name, category').or(`name.ilike.%${query}%,category.ilike.%${query}%`).limit(4);
    if (s) s.forEach(i => all.push({ text: i.name, type: 'service', category: i.category }));
    const unique = []; const seen = new Set();
    all.forEach(x => { if (!seen.has(x.text)) { seen.add(x.text); unique.push(x); } });
    setSuggestions(unique.slice(0, 8)); setShowSuggestions(unique.length > 0);
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
        const cmap = {}; if (cd) cd.forEach(x => { cmap[x.id] = x; }); const smap = {}; if (sd) sd.forEach(x => { smap[x.id] = x; });
        prods.forEach(p => {
          const cat = cmap[p.catalog_id]; const sh = smap[p.shop_id]; if (!cat || !sh) return;
          const dp = sh.discount_percentage || 10;
          allResults.push({ id: p.id, shopId: sh.id, type: 'product', shopName: sh.name, productName: cat.name, category: cat.category, images: cat.images || [], rating: Number(sh.rating || 4.0), distance: sh.distance || '1.0 km', regularPrice: Number(p.regular_price), munolinkPrice: Math.round(Number(p.regular_price) * (1 - dp / 100)), savings: Math.round(Number(p.regular_price) * dp / 100), discount: dp, open: sh.is_open ?? true, isPartner: sh.is_anchor_partner || false });
        });
      }
    }
    setSearchResults(allResults); setLoading(false);
  };

  const handleSuggestionTap = (s) => runSearch(s.text);
  const handleClearSearch = () => { setSearchQuery(''); setSearchResults([]); setIsSearching(false); setShowSuggestions(false); setShowAllProducts(false); };
  const handleResultTap = (item) => { if (item.type === 'product') navigation.navigate('ProductDetails', { productId: item.id, shopId: item.shopId }); else navigation.navigate('ServiceProviderProfile', { providerId: item.providerId }); };
  const handleProductTap = (item) => navigation.navigate('ProductDetails', { productId: item.id, shopId: item.shopId });

  if (pageLoading) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={LogoImage} style={styles.headerLogo} resizeMode="contain" />
        </View>
      </View>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={LogoImage} style={styles.headerLogo} resizeMode="contain" />
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon} onPress={() => setShowNotifDropdown(!showNotifDropdown)}>
              <Ionicons name="notifications-outline" size={24} color={C.text} />
              <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowProfileDropdown(!showProfileDropdown)}>
              <View style={styles.profilePic}>
                <Ionicons name="person" size={20} color={C.white} />
                {user && <View style={styles.onlineDot} />}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {showNotifDropdown && (<View style={styles.notifDropdown}><View style={styles.notifDropdownHeader}><Text style={styles.notifDropdownTitle}>Notifications</Text></View>{recentNotifications.map(n => (<TouchableOpacity key={n.id} style={styles.notifItem}><View style={[styles.notifIcon,{backgroundColor:n.bg}]}><Ionicons name={n.icon} size={16} color={n.color} /></View><View style={styles.notifInfo}><Text style={styles.notifTitle}>{n.title}</Text><Text style={styles.notifTime}>{n.time}</Text></View>{n.unread&&<View style={styles.notifUnreadDot} />}</TouchableOpacity>))}<TouchableOpacity style={styles.viewAllNotif} onPress={()=>{setShowNotifDropdown(false);navigation.navigate('Notifications');}}><Text style={styles.viewAllNotifText}>View all</Text></TouchableOpacity></View>)}
        {showProfileDropdown && (<View style={styles.profileDropdown}>{user ? (<><View style={styles.profileDropdownUser}><View style={styles.profileDropdownAvatar}><Ionicons name="person" size={28} color={C.accent} /></View><View><Text style={styles.profileDropdownName}>{user.fullName||'User'}</Text></View></View><TouchableOpacity style={styles.profileDropdownItem} onPress={()=>{setShowProfileDropdown(false);navigation.navigate('Account');}}><Text style={styles.profileDropdownItemText}>Profile</Text></TouchableOpacity><TouchableOpacity style={styles.profileDropdownItem} onPress={()=>{setShowProfileDropdown(false);navigation.navigate('MyWallet');}}><Text style={styles.profileDropdownItemText}>Wallet</Text></TouchableOpacity></>) : (<><TouchableOpacity style={styles.profileDropdownSignInBtn} onPress={()=>{setShowProfileDropdown(false);navigation.navigate('SignIn');}}><Text style={styles.profileDropdownSignInText}>Sign In</Text></TouchableOpacity></>)}</View>)}

        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 90 + insets.bottom }]} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!isSearching && !showAllProducts && (
            <View style={styles.titleRow}>
              <View style={styles.titleLeft}>
                <Text style={styles.pageTitle}>My Connections</Text>
                <Text style={styles.pageSubtitle}>Discover, connect and grow with trusted businesses & providers.</Text>
              </View>
              <TouchableOpacity style={styles.mapBtn} onPress={()=>navigation.navigate('RouteNavigation')}>
                <Ionicons name="location-outline" size={16} color={C.accent} />
                <Text style={styles.mapBtnText}>Map</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.searchContainer}>
            {isSearching && <TouchableOpacity style={styles.backArrow} onPress={handleClearSearch}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>}
            <View style={[styles.searchRow, isSearching && styles.searchRowActive]}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color={C.muted} />
                <TextInput 
                  style={styles.searchInput} 
                  value={searchQuery} 
                  onChangeText={fetchSuggestions} 
                  placeholder="Search..." 
                  placeholderTextColor={C.muted} 
                  onFocus={()=>{if(searchQuery.length<2&&!isSearching){setSuggestions(searchHistory.map(i=>({text:i,type:'history'})));setShowSuggestions(true);}}} 
                  onSubmitEditing={()=>{if(searchQuery.length>=2)runSearch(searchQuery);}} 
                />
                {searchQuery.length>0&&<TouchableOpacity onPress={handleClearSearch}><Ionicons name="close-circle" size={18} color="#CCC" /></TouchableOpacity>}
              </View>
              {!isSearching && <TouchableOpacity style={styles.filterBtn} onPress={()=>setShowFilter(true)}><Ionicons name="options-outline" size={18} color={C.accent} /><Text style={styles.filterBtnText}>Filter</Text></TouchableOpacity>}
            </View>
            {showSuggestions && !isSearching && (<View style={styles.suggestionsDropdown}>{suggestions.map((s,i)=>(<TouchableOpacity key={i} style={styles.suggestionRow} onPress={()=>handleSuggestionTap(s)} activeOpacity={0.7}><Ionicons name={s.type==='history'?'time-outline':s.type==='service'?'person-outline':'cube-outline'} size={16} color={s.type==='history'?C.muted:C.accent} /><View style={styles.suggestionInfo}><Text style={styles.suggestionText}>{s.text}</Text></View></TouchableOpacity>))}</View>)}
          </View>

          {isSearching ? (
            <View style={styles.resultsContainer}><Text style={styles.resultsTitle}>Results for "{searchQuery}"</Text>{loading ? <ActivityIndicator size="small" color={C.accent} /> : searchResults.length===0 ? <Text style={styles.loadingText}>No results found.</Text> : searchResults.map(item=>(<TouchableOpacity key={item.id+item.type} style={styles.resultCard} onPress={()=>handleResultTap(item)} activeOpacity={0.7}><View style={styles.resultImage}>{item.images?.[0]?<Image source={{uri:item.images[0]}} style={{width:50,height:50,borderRadius:12}} />:<Ionicons name={item.type==='service'?'person':'storefront'} size={36} color={C.accent} />}</View><View style={styles.resultInfo}><Text style={styles.resultName}>{item.shopName}</Text><Text style={styles.resultProduct}>{item.productName}</Text></View><Text style={styles.resultPriceText}>UGX {item.munolinkPrice?.toLocaleString()}</Text></TouchableOpacity>))}</View>
          ) : !showAllProducts ? (<>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shops Near You</Text>
              <TouchableOpacity onPress={()=>navigation.navigate('Categories')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
              {featuredShops.map(shop => (
                <TouchableOpacity 
                  key={shop.id} 
                  style={styles.recentCard} 
                  onPress={() => navigation.navigate('ShopProfile', { shopId: shop.id })}
                >
                  <View style={styles.recentAvatar}>
                    <Ionicons name="storefront" size={22} color={C.accent} />
                    {shop.is_open && <View style={styles.recentOnlineDot}/>}
                  </View>
                  <Text style={styles.recentName} numberOfLines={1}>{shop.name}</Text>
                  <Text style={styles.recentCategory}>{shop.category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Products For You</Text><TouchableOpacity onPress={()=>setShowAllProducts(true)}><Text style={styles.seeAll}>See all ({featuredProducts.length})</Text></TouchableOpacity></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendScroll}>{featuredProducts.slice(0,6).map(item=>(<TouchableOpacity key={item.id} style={styles.recommendCard} onPress={()=>handleProductTap(item)} activeOpacity={0.7}><View style={styles.recommendCover}>{item.images?.[0]?<Image source={{uri:item.images[0]}} style={{width:'100%',height:'100%'}}/>:<Ionicons name="cube-outline" size={36} color={C.accent} />}<View style={styles.recommendBadge}><Text style={styles.recommendBadgeText}>{item.discount}% OFF</Text></View></View><View style={styles.recommendInfo}><Text style={styles.recommendName} numberOfLines={1}>{item.productName}</Text><Text style={styles.recommendMeta}>{item.shopName} · {item.distance}</Text><Text style={styles.recommendPrice}>UGX {item.munolinkPrice.toLocaleString()}</Text></View></TouchableOpacity>))}</ScrollView>
            
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Services Near You</Text><TouchableOpacity onPress={()=>navigation.navigate('ServicesHome')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendScroll}>{serviceProviders.slice(0,6).map(provider=>{const fs=provider.services?.[0];return(<TouchableOpacity key={provider.id} style={styles.recommendCard} onPress={()=>{if(fs?.serviceId)navigation.navigate('ServiceDetails',{serviceId:fs.serviceId});}} activeOpacity={0.7}><View style={[styles.recommendCover,{backgroundColor:C.blueBg}]}>{fs?.images&&fs.images.length>0?<Image source={{uri:fs.images[0]}} style={{width:'100%',height:'100%'}} resizeMode="cover"/>:<Ionicons name={getServiceIcon(provider.primaryCategory)} size={36} color="#1976D2"/>}<View style={styles.ratingBadge}><Ionicons name="star" size={10} color="#FFB300"/><Text style={styles.ratingText}>{provider.rating.toFixed(1)}</Text></View></View><View style={styles.recommendInfo}><Text style={styles.recommendName} numberOfLines={1}>{fs?.serviceName||'Service'}</Text><Text style={styles.recommendMeta}>{provider.name}</Text>{fs?.price&&<Text style={styles.recommendPrice}>From UGX {fs.price.toLocaleString()}</Text>}<TouchableOpacity style={styles.bookServiceMiniBtn} onPress={()=>navigation.navigate('BookService',{providerId:provider.id,providerName:provider.name})}><Text style={styles.bookServiceMiniText}>Book Now</Text></TouchableOpacity></View></TouchableOpacity>);})}</ScrollView>
          </>) : (
            <View style={styles.fullSection}><View style={styles.fullSectionHeader}><TouchableOpacity onPress={()=>setShowAllProducts(false)}><Ionicons name="arrow-back" size={24} color={C.text}/></TouchableOpacity><Text style={styles.fullSectionTitle}>All Products</Text></View><View style={styles.productGrid}>{featuredProducts.map(item=>(<TouchableOpacity key={item.id} style={styles.productGridCard} onPress={()=>handleProductTap(item)}><View style={styles.productGridImage}>{item.images?.[0]?<Image source={{uri:item.images[0]}} style={{width:'100%',height:'100%',borderRadius:10}}/>:<Ionicons name="cube-outline" size={32} color={C.accent}/>}</View><Text style={styles.productGridName}>{item.productName}</Text><Text style={styles.productGridShop}>{item.shopName}</Text><Text style={styles.productGridPrice}>UGX {item.munolinkPrice.toLocaleString()}</Text></TouchableOpacity>))}</View></View>
          )}
          
        </ScrollView>

        <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity style={styles.navItem} onPress={()=>requireAuth(()=>navigation.navigate('MyWallet'))}>
            <Ionicons name="wallet-outline" size={22} color={C.muted}/>
            <Text style={styles.navLabel}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={()=>requireAuth(()=>navigation.navigate('MyOrders'))}>
            <Ionicons name="calendar-outline" size={22} color={C.muted}/>
            <Text style={styles.navLabel}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="people" size={22} color={C.accent}/>
            <Text style={[styles.navLabel,styles.navLabelActive]}>Connections</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={()=>requireAuth(()=>navigation.navigate('Messages'))}>
            <Ionicons name="chatbubbles-outline" size={22} color={C.muted}/>
            <View style={styles.navBadge}><Text style={styles.navBadgeText}>3</Text></View>
            <Text style={styles.navLabel}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={()=>setShowProfileDropdown(!showProfileDropdown)}>
            <Ionicons name="person-outline" size={22} color={C.muted}/>
            <Text style={styles.navLabel}>Account</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showFilter} animationType="slide" transparent><TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={()=>setShowFilter(false)}><View style={styles.modalContent} onStartShouldSetResponder={()=>true}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Filter Results</Text><TouchableOpacity onPress={()=>setShowFilter(false)}><Ionicons name="close" size={24} color={C.text}/></TouchableOpacity></View><Text style={styles.filterSectionTitle}>Category</Text><View style={styles.filterChips}>{['All','Pharmacy','Grocery','Hardware','Electronics','Services'].map(c=><TouchableOpacity key={c} style={styles.filterChip}><Text style={styles.filterChipText}>{c}</Text></TouchableOpacity>)}</View><Text style={styles.filterSectionTitle}>Distance</Text><View style={styles.filterChips}>{['Any','Under 1 km','1-3 km','3-5 km','5+ km'].map(d=><TouchableOpacity key={d} style={styles.filterChip}><Text style={styles.filterChipText}>{d}</Text></TouchableOpacity>)}</View><Text style={styles.filterSectionTitle}>Rating</Text><View style={styles.filterChips}>{['Any','4.5+','4.0+','3.5+','3.0+'].map(r=><TouchableOpacity key={r} style={styles.filterChip}><Text style={styles.filterChipText}>{r}</Text></TouchableOpacity>)}</View><View style={styles.filterSwitchRow}><Text style={styles.filterSwitchLabel}>Open Now Only</Text><Switch value={false}/></View><View style={styles.filterSwitchRow}><Text style={styles.filterSwitchLabel}>Official Partners Only</Text><Switch value={false}/></View><View style={styles.modalActions}><TouchableOpacity style={styles.resetBtn} onPress={()=>setShowFilter(false)}><Text style={styles.resetBtnText}>Reset</Text></TouchableOpacity><TouchableOpacity style={styles.applyBtn} onPress={()=>setShowFilter(false)}><Text style={styles.applyBtnText}>Apply Filters</Text></TouchableOpacity></View></View></TouchableOpacity></Modal>

        <Modal visible={showAuthPopup} animationType="fade" transparent><TouchableOpacity style={styles.authPopupOverlay} activeOpacity={1} onPress={()=>setShowAuthPopup(false)}><View style={styles.authPopupCard} onStartShouldSetResponder={()=>true}><View style={styles.authPopupIcon}><Ionicons name="lock-closed" size={40} color={C.accent}/></View><Text style={styles.authPopupTitle}>Sign in Required</Text><Text style={styles.authPopupSubtitle}>Create a free account to access all Munolink features.</Text><TouchableOpacity style={styles.authPopupSignUpBtn} onPress={()=>{setShowAuthPopup(false);navigation.navigate('AccountType');}}><Text style={styles.authPopupSignUpText}>Create Free Account</Text></TouchableOpacity><TouchableOpacity style={styles.authPopupSignInBtn} onPress={()=>{setShowAuthPopup(false);navigation.navigate('SignIn');}}><Text style={styles.authPopupSignInText}>I already have an account</Text></TouchableOpacity><TouchableOpacity onPress={()=>setShowAuthPopup(false)}><Text style={styles.authPopupLater}>Maybe Later</Text></TouchableOpacity></View></TouchableOpacity></Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.white,
  },
  container: { 
    flex: 1, 
    backgroundColor: C.background,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 12, 
    paddingBottom: 12, 
    backgroundColor: C.white,
    zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 130, height: 35, resizeMode: 'contain' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: C.danger, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: C.white },
  profilePic: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: C.success, borderWidth: 2, borderColor: C.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: C.muted, fontWeight: '500' },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingTop: 8,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8 },
  titleLeft: { flex: 1, minWidth: 0 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: C.text },
  pageSubtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: C.accent, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4, alignSelf: 'flex-start', marginTop: 4 },
  mapBtnText: { fontSize: 12, fontWeight: '600', color: C.accent },
  searchContainer: { marginBottom: 18 },
  backArrow: { marginRight: 10, marginTop: 10 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchRowActive: { flex: 1 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.background, borderRadius: 14, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontSize: 13, color: C.text, marginLeft: 8 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, gap: 4, backgroundColor: C.white },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: C.accent },
  suggestionsDropdown: { backgroundColor: C.white, borderRadius: 14, elevation: 10, borderWidth: 1, borderColor: C.border, marginTop: 4 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  suggestionInfo: { flex: 1 },
  suggestionText: { fontSize: 13, fontWeight: '600', color: C.text },
  resultsContainer: { marginTop: 8 },
  resultsTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 2 },
  resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 14, padding: 12, marginBottom: 8, elevation: 1 },
  resultImage: { width: 50, height: 50, borderRadius: 12, backgroundColor: C.background, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 14, fontWeight: '700', color: C.text },
  resultProduct: { fontSize: 12, color: C.muted },
  resultPriceText: { fontSize: 15, fontWeight: '800', color: C.primary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  seeAll: { fontSize: 13, color: C.accent, fontWeight: '600' },
  recommendScroll: { marginBottom: 22 },
  recommendCard: { width: 160, backgroundColor: C.white, borderRadius: 16, marginRight: 12, overflow: 'hidden', elevation: 2 },
  recommendCover: { height: 80, backgroundColor: C.background, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  recommendBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: C.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  recommendBadgeText: { fontSize: 9, fontWeight: '700', color: C.white },
  ratingBadge: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 2 },
  ratingText: { fontSize: 10, fontWeight: '700', color: '#555' },
  recommendInfo: { padding: 10 },
  recommendName: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  recommendMeta: { fontSize: 11, color: C.muted, marginBottom: 4 },
  recommendPrice: { fontSize: 14, fontWeight: '800', color: C.primary },
  bookServiceMiniBtn: { backgroundColor: C.accent, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 14, marginTop: 8, alignSelf: 'flex-start' },
  bookServiceMiniText: { fontSize: 11, fontWeight: '700', color: C.white },
  recentScroll: { marginBottom: 22 },
  recentCard: { alignItems: 'center', marginRight: 16, width: 70 },
  recentAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.lightBg, justifyContent: 'center', alignItems: 'center', marginBottom: 6, position: 'relative' },
  recentOnlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: C.success, borderWidth: 2, borderColor: C.white },
  recentName: { fontSize: 11, fontWeight: '600', color: C.text, textAlign: 'center' },
  recentCategory: { fontSize: 9, color: C.muted, textAlign: 'center' },
  fullSection: { marginTop: 8 },
  fullSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  fullSectionTitle: { fontSize: 20, fontWeight: '800', color: C.text, flex: 1 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  productGridCard: { width: '47%', backgroundColor: C.white, borderRadius: 14, padding: 10, elevation: 1 },
  productGridImage: { width: '100%', height: 90, backgroundColor: C.background, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden' },
  productGridName: { fontSize: 12, fontWeight: '700', color: C.text, lineHeight: 16 },
  productGridShop: { fontSize: 10, color: C.muted, marginBottom: 4 },
  productGridPrice: { fontSize: 14, fontWeight: '800', color: C.primary },
  bottomNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    backgroundColor: C.white, 
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1, 
    borderTopColor: C.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  navItem: { alignItems: 'center', gap: 2, position: 'relative', paddingHorizontal: 4 },
  navBadge: { position: 'absolute', top: -6, right: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: C.danger, justifyContent: 'center', alignItems: 'center' },
  navBadgeText: { fontSize: 9, fontWeight: '800', color: C.white },
  navLabel: { fontSize: 10, color: C.muted, fontWeight: '500' },
  navLabelActive: { color: C.accent, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  filterSectionTitle: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 10, marginTop: 8 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.background, borderWidth: 1, borderColor: C.border },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  filterSwitchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  filterSwitchLabel: { fontSize: 14, fontWeight: '600', color: '#555' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border },
  resetBtn: { flex: 1, borderWidth: 1.5, borderColor: C.border, paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
  resetBtnText: { fontSize: 14, fontWeight: '700', color: C.muted },
  applyBtn: { flex: 2, backgroundColor: C.accent, paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
  applyBtnText: { fontSize: 14, fontWeight: '700', color: C.white },
  notifDropdown: { position: 'absolute', top: 60, right: 16, width: 300, backgroundColor: C.white, borderRadius: 16, elevation: 8, zIndex: 200, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  notifDropdownHeader: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  notifDropdownTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  notifItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  notifIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  notifInfo: { flex: 1 },
  notifTitle: { fontSize: 12, fontWeight: '600', color: C.text },
  notifTime: { fontSize: 10, color: C.muted, marginTop: 2 },
  notifUnreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  viewAllNotif: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, gap: 4, backgroundColor: C.background },
  viewAllNotifText: { fontSize: 13, fontWeight: '700', color: C.accent },
  profileDropdown: { position: 'absolute', top: 60, right: 16, width: 220, backgroundColor: C.white, borderRadius: 16, elevation: 8, zIndex: 200, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  profileDropdownUser: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 14 },
  profileDropdownAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.lightBg, justifyContent: 'center', alignItems: 'center' },
  profileDropdownName: { fontSize: 14, fontWeight: '700', color: C.text },
  profileDropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 10 },
  profileDropdownItemText: { fontSize: 13, fontWeight: '600', color: '#555' },
  profileDropdownSignInBtn: { backgroundColor: C.accent, marginHorizontal: 14, paddingVertical: 12, borderRadius: 22, alignItems: 'center' },
  profileDropdownSignInText: { fontSize: 14, fontWeight: '700', color: C.white },
  authPopupOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  authPopupCard: { backgroundColor: C.white, borderRadius: 20, padding: 28, alignItems: 'center', width: '100%' },
  authPopupIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.lightBg, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  authPopupTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 8 },
  authPopupSubtitle: { fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 20 },
  authPopupSignUpBtn: { backgroundColor: C.accent, width: '100%', paddingVertical: 14, borderRadius: 25, alignItems: 'center', marginBottom: 10 },
  authPopupSignUpText: { fontSize: 15, fontWeight: '700', color: C.white },
  authPopupSignInBtn: { borderWidth: 1.5, borderColor: C.accent, width: '100%', paddingVertical: 14, borderRadius: 25, alignItems: 'center', marginBottom: 14 },
  authPopupSignInText: { fontSize: 15, fontWeight: '700', color: C.accent },
  authPopupLater: { fontSize: 13, color: C.muted, fontWeight: '600', marginTop: 4 },
});