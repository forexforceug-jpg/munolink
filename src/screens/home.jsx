import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Home({ navigation, route }) {
  const phoneNumber = route?.params?.phoneNumber;
  const firstName = route?.params?.firstName || 'User';
  const { user, login } = useAuth();

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [userData, setUserData] = useState(null);
  const [flashDeals, setFlashDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    loadShopsAndProducts();
  }, []);

  const loadUserData = async () => {
    if (user?.id) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setUserData(data);
        login({
          ...user,
          walletBalance: data.wallet_balance,
          lifetimeSavings: data.lifetime_savings,
          fullName: data.full_name,
        });
      }
    } else if (phoneNumber) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (data) {
        setUserData(data);
        login({
          id: data.id,
          phoneNumber: data.phone_number,
          fullName: data.full_name,
          walletBalance: data.wallet_balance,
          lifetimeSavings: data.lifetime_savings,
          role: data.role,
        });
      }
    }
  };

  const loadShopsAndProducts = async () => {
    const { data: shops } = await supabase
      .from('shops')
      .select('*')
      .eq('is_verified', true)
      .limit(5);

    const { data: shopProducts } = await supabase
      .from('shop_products')
      .select('*, catalog(name, category), shops(name, rating, distance, discount_percentage)')
      .eq('in_stock', true)
      .limit(8);

    if (shopProducts && shopProducts.length > 0) {
      const deals = shopProducts.map((item) => {
        const shop = item.shops;
        const product = item.catalog;
        const discountPercent = shop?.discount_percentage || 10;
        const regularPrice = item.regular_price;
        const munolinkPrice = Math.round(regularPrice * (1 - discountPercent / 100));

        return {
          id: item.id,
          name: product?.name || 'Product',
          oldPrice: regularPrice.toLocaleString(),
          newPrice: munolinkPrice.toLocaleString(),
          discount: `-${discountPercent}%`,
          shopName: shop?.name || 'Local Shop',
          shopRating: shop?.rating || 4.0,
          shopDistance: shop?.distance || '1.0 km',
          regularPrice: regularPrice,
          munolinkPrice: munolinkPrice,
        };
      });

      setFlashDeals(deals);
    }

    setLoading(false);
  };

  const walletBalance = userData?.wallet_balance || user?.walletBalance || 0;
  const lifetimeSavings = userData?.lifetime_savings || user?.lifetimeSavings || 0;
  const displayName = userData?.full_name || user?.fullName || firstName || 'User';

  const categories = [
    { name: 'Best Prices', icon: 'pricetag', color: '#E8F5E9' },
    { name: 'Discounts', icon: 'pricetags', color: '#FFF3E0' },
    { name: 'Groceries', icon: 'cart', color: '#E3F2FD' },
    { name: 'Delivery', icon: 'bicycle', color: '#FCE4EC' },
    { name: 'Airtime', icon: 'phone-portrait', color: '#F3E5F5' },
    { name: 'More', icon: 'apps', color: '#ECEFF1' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>MUNOLINK</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={styles.profilePic}>
              <Text style={styles.profileInitial}>
                {displayName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting + Location */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>Hello, {displayName} 👋</Text>
            <Text style={styles.subGreeting}>Let's make every purchase smarter.</Text>
          </View>
          <TouchableOpacity style={styles.locationSelector}>
            <Text style={styles.locationText}>📍 Jinja, Uganda</Text>
            <Ionicons name="chevron-down" size={14} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Wallet + Quick Actions Row */}
        <View style={styles.topCardsRow}>
          {/* Wallet Card */}
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
                <Ionicons
                  name={balanceVisible ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.walletBalance}>
              {balanceVisible ? `UGX ${walletBalance.toLocaleString()}` : '****'}
            </Text>
            <Text style={styles.walletSaved}>
              Saved: UGX {lifetimeSavings.toLocaleString()}
            </Text>
            <View style={styles.walletButtons}>
              <TouchableOpacity
                style={styles.walletBtn}
                onPress={() => navigation.navigate('TopUp')}
              >
                <Text style={styles.walletBtnText}>Top Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.walletBtnOutline}
                onPress={() => navigation.navigate('MyWallet')}
              >
                <Text style={styles.walletBtnOutlineText}>View Wallet</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions Card */}
          <View style={styles.quickActionsCard}>
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={styles.quickIconCircle}>
                <Ionicons name="card-outline" size={18} color="#006B3F" />
              </View>
              <Text style={styles.quickLabel}>Pay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem}>
              <View style={styles.quickIconCircle}>
                <Ionicons name="camera-outline" size={18} color="#006B3F" />
              </View>
              <Text style={styles.quickLabel}>Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('MyOrders')}
            >
              <View style={styles.quickIconCircle}>
                <Ionicons name="time-outline" size={18} color="#006B3F" />
              </View>
              <Text style={styles.quickLabel}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('TopUp')}
            >
              <View style={styles.quickIconCircle}>
                <Ionicons name="add-circle-outline" size={18} color="#006B3F" />
              </View>
              <Text style={styles.quickLabel}>Top Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('SearchResults')}
        >
          <Ionicons name="search-outline" size={20} color="#888" />
          <Text style={styles.searchPlaceholder}>Search for products, shops, services...</Text>
          <TouchableOpacity>
            <Ionicons name="options-outline" size={20} color="#888" />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Category Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity key={cat.name} style={styles.categoryBtn}>
              <View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
                <Ionicons name={cat.icon} size={18} color="#006B3F" />
              </View>
              <Text style={styles.categoryText}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoLeft}>
            <Text style={styles.promoTitle}>Discover Local Deals</Text>
            <Text style={styles.promoSubtitle}>Save up to 50% today</Text>
            <TouchableOpacity style={styles.promoButton}>
              <Text style={styles.promoButtonText}>Explore Shops</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.promoRight}>
            <Text style={styles.promoEmoji}>🛒</Text>
            <Text style={styles.promoEmoji}>🏷️</Text>
          </View>
        </View>

        {/* Flash Deals */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Flash Deals</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dealsScroll}
        >
          {loading ? (
            <Text style={styles.loadingText}>Loading deals...</Text>
          ) : flashDeals.length === 0 ? (
            <Text style={styles.loadingText}>No deals available yet.</Text>
          ) : (
            flashDeals.map((deal, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dealCard}
                onPress={() =>
                  navigation.navigate('ProductDetails', {
                    product: {
                      name: deal.name,
                      category: 'General',
                      regularPrice: deal.regularPrice,
                      munolinkPrice: deal.munolinkPrice,
                      discount: parseInt(deal.discount.replace('%', '').replace('-', '')),
                      description: 'Quality product from a verified Munolink shop.',
                      features: ['Verified Shop', 'Best Price', 'Fast Service'],
                      shop: {
                        name: deal.shopName,
                        rating: deal.shopRating,
                        distance: deal.shopDistance,
                        isOpen: true,
                        isPartner: true,
                      },
                    },
                  })
                }
              >
                <View style={styles.dealDiscountBadge}>
                  <Text style={styles.dealDiscountText}>{deal.discount}</Text>
                </View>
                <View style={styles.dealImagePlaceholder}>
                  <Ionicons name="cube-outline" size={28} color="#006B3F" />
                </View>
                <Text style={styles.dealName}>{deal.name}</Text>
                <View style={styles.dealPriceRow}>
                  <Text style={styles.dealOldPrice}>UGX {deal.oldPrice}</Text>
                  <Text style={styles.dealNewPrice}>UGX {deal.newPrice}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Categories')}
        >
          <Ionicons name="grid-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('PaymentConfirm')}
        >
          <Ionicons name="camera-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('MyOrders')}
        >
          <Ionicons name="receipt-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
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
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12, backgroundColor: '#FFFFFF',
  },
  logo: { fontSize: 22, fontWeight: '800', color: '#006B3F', letterSpacing: 3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerIcon: { position: 'relative' },
  notificationBadge: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#D32F2F',
  },
  profilePic: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  profileInitial: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  greetingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20,
  },
  greeting: { fontSize: 24, fontWeight: '800', color: '#212121' },
  subGreeting: { fontSize: 13, color: '#888888', marginTop: 2 },
  locationSelector: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4,
  },
  locationText: { fontSize: 12, color: '#555', fontWeight: '500' },
  topCardsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  walletCard: {
    flex: 2, backgroundColor: '#006B3F', borderRadius: 20, padding: 16, justifyContent: 'space-between',
  },
  walletHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  walletLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  walletBalance: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  walletSaved: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 14 },
  walletButtons: { flexDirection: 'row', gap: 8 },
  walletBtn: {
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
  },
  walletBtnText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  walletBtnOutline: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
  },
  walletBtnOutlineText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  quickActionsCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 10,
    flexDirection: 'row', flexWrap: 'wrap',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    justifyContent: 'center', alignContent: 'center', gap: 6,
  },
  quickActionItem: { width: '42%', alignItems: 'center', paddingVertical: 6 },
  quickIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  quickLabel: { fontSize: 10, fontWeight: '600', color: '#555' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, height: 50,
    marginBottom: 16, borderWidth: 1, borderColor: '#ECECEC',
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: '#CCCCCC', marginHorizontal: 10 },
  categoriesScroll: { marginBottom: 20 },
  categoryBtn: { alignItems: 'center', marginRight: 16, paddingVertical: 4 },
  categoryIcon: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  categoryText: { fontSize: 11, color: '#888', fontWeight: '500' },
  promoBanner: {
    flexDirection: 'row', backgroundColor: '#E8F5E9', borderRadius: 18,
    padding: 18, marginBottom: 20, overflow: 'hidden',
  },
  promoLeft: { flex: 1, justifyContent: 'center' },
  promoTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 4 },
  promoSubtitle: { fontSize: 12, color: '#666', marginBottom: 12 },
  promoButton: {
    backgroundColor: '#006B3F', paddingVertical: 8, paddingHorizontal: 18,
    borderRadius: 20, alignSelf: 'flex-start',
  },
  promoButtonText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  promoRight: { justifyContent: 'center', gap: 8, paddingLeft: 10 },
  promoEmoji: { fontSize: 22 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#212121' },
  seeAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  dealsScroll: { marginBottom: 24 },
  loadingText: { fontSize: 14, color: '#888', paddingVertical: 20 },
  dealCard: {
    width: 155, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginRight: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, position: 'relative',
  },
  dealDiscountBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: '#D32F2F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, zIndex: 1,
  },
  dealDiscountText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  dealImagePlaceholder: {
    width: '100%', height: 80, backgroundColor: '#F5F5F5',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 10,
  },
  dealName: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 4 },
  dealPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dealOldPrice: { fontSize: 11, color: '#888', textDecorationLine: 'line-through' },
  dealNewPrice: { fontSize: 13, fontWeight: '800', color: '#006B3F' },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
  scanButton: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#006B3F',
    justifyContent: 'center', alignItems: 'center', marginTop: -20,
    shadowColor: '#006B3F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },
});