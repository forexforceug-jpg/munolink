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

export default function Categories({ navigation }) {
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Products', 'Services', 'Shops'];

  const categoryGrid = [
    { name: 'Groceries', icon: 'cart-outline', color: '#E8F5E9' },
    { name: 'Electronics', icon: 'phone-portrait-outline', color: '#E3F2FD' },
    { name: 'Fashion', icon: 'shirt-outline', color: '#FCE4EC' },
    { name: 'Services', icon: 'construct-outline', color: '#FFF3E0' },
    { name: 'Pharmacy', icon: 'medkit-outline', color: '#F3E5F5' },
    { name: 'Hardware', icon: 'hammer-outline', color: '#ECEFF1' },
    { name: 'Restaurants', icon: 'restaurant-outline', color: '#FFF8E1' },
    { name: 'Transport', icon: 'car-outline', color: '#E0F7FA' },
  ];

  const topDeals = [
    { id: 1, name: 'Milk 500ml', oldPrice: '3,500', newPrice: '2,800', discount: '-20%' },
    { id: 2, name: 'Bread Loaf', oldPrice: '4,000', newPrice: '3,200', discount: '-20%' },
    { id: 3, name: 'Sugar 1kg', oldPrice: '5,000', newPrice: '4,000', discount: '-20%' },
    { id: 4, name: 'Cooking Oil', oldPrice: '8,000', newPrice: '6,400', discount: '-20%' },
  ];

  const features = [
    { icon: 'shield-checkmark', label: 'Trusted Shops' },
    { icon: 'pricetag', label: 'Best Prices' },
    { icon: 'flash', label: 'Fast Delivery' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>MUNOLINK</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.badge} />
          </TouchableOpacity>
          <TouchableOpacity>
            <View style={styles.profilePic}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
         <TouchableOpacity
  style={styles.cartCard}
  onPress={() => navigation.navigate('MyCart')}
>
  <Ionicons name="cart-outline" size={18} color="#006B3F" />
  <Text style={styles.cartText}>My Cart</Text>
</TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>Explore products, shops and services.</Text>

        {/* Search + Filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search categories..."
              placeholderTextColor="#CCCCCC"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.savedButton}>
            <Ionicons name="bookmark-outline" size={16} color="#006B3F" />
            <Text style={styles.savedText}>Saved</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTitle}>Discover Local Deals</Text>
            <Text style={styles.heroSubtitle}>Save up to 50% today</Text>
            <TouchableOpacity style={styles.heroButton}>
              <Text style={styles.heroButtonText}>Explore Now</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroRight}>
            <Text style={styles.heroEmoji}>🛒</Text>
            <Text style={styles.heroEmoji}>🏷️</Text>
          </View>
        </View>

        {/* Category Grid */}
        <View style={styles.grid}>
 {categoryGrid.map((cat) => (
  <TouchableOpacity
    key={cat.name}
    style={styles.gridItem}
    onPress={() => {
      if (cat.name === 'Groceries') navigation.navigate('Groceries');
    }}
  >
    <View style={[styles.gridIcon, { backgroundColor: cat.color }]}>
      <Ionicons name={cat.icon} size={26} color="#006B3F" />
    </View>
    <Text style={styles.gridLabel}>{cat.name}</Text>
  </TouchableOpacity>
))}
        </View>

        {/* Features Strip */}
        <View style={styles.featuresStrip}>
          {features.map((feat, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name={feat.icon} size={18} color="#006B3F" />
              <Text style={styles.featureText}>{feat.label}</Text>
            </View>
          ))}
        </View>

        {/* Top Deals */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Deals</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dealsScroll}
        >
          {topDeals.map((deal) => (
            <View key={deal.id} style={styles.dealCard}>
              <View style={styles.dealBadge}>
                <Text style={styles.dealBadgeText}>{deal.discount}</Text>
              </View>
              <View style={styles.dealImage}>
                <Ionicons name="cube-outline" size={28} color="#006B3F" />
              </View>
              <Text style={styles.dealName}>{deal.name}</Text>
              <View style={styles.dealPriceRow}>
                <Text style={styles.dealOldPrice}>UGX {deal.oldPrice}</Text>
                <Text style={styles.dealNewPrice}>UGX {deal.newPrice}</Text>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Bottom spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="grid" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanButton}>
          <Ionicons name="camera-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="receipt-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#006B3F',
    letterSpacing: 3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D32F2F',
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#006B3F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  cartText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006B3F',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#212121',
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
    marginBottom: 18,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#212121',
    marginLeft: 10,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#006B3F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  tabActive: {
    backgroundColor: '#006B3F',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  savedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 4,
  },
  savedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#006B3F',
  },
  heroBanner: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  heroButton: {
    backgroundColor: '#006B3F',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroRight: {
    justifyContent: 'center',
    gap: 8,
    paddingLeft: 10,
  },
  heroEmoji: {
    fontSize: 28,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 24,
  },
  gridItem: {
    width: '22%',
    alignItems: 'center',
  },
  gridIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  featuresStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006B3F',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#212121',
  },
  seeAll: {
    fontSize: 13,
    color: '#006B3F',
    fontWeight: '600',
  },
  dealsScroll: {
    marginBottom: 20,
  },
  dealCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    position: 'relative',
  },
  dealBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#D32F2F',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 1,
  },
  dealBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dealImage: {
    width: '100%',
    height: 70,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  dealName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  dealPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dealOldPrice: {
    fontSize: 11,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  dealNewPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#006B3F',
  },
  addButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#006B3F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    gap: 2,
  },
  navLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#006B3F',
    fontWeight: '700',
  },
  scanButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#006B3F',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#006B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});