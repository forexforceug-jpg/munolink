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

export default function Groceries({ navigation }) {
  const [activeChip, setActiveChip] = useState('All');
  const [sortBy, setSortBy] = useState('Popular');

  const chips = ['All', 'Rice & Grains', 'Cooking', 'Snacks', 'Beverages'];

  const products = [
    {
      id: 1,
      name: 'Fresh Milk 500ml',
      rating: 4.8,
      sold: 234,
      oldPrice: '3,500',
      newPrice: '2,800',
      discount: '-20%',
      shop: 'Fresh Mart',
      distance: '1.2km',
    },
    {
      id: 2,
      name: 'Whole Wheat Bread',
      rating: 4.6,
      sold: 189,
      oldPrice: '4,000',
      newPrice: '3,200',
      discount: '-20%',
      shop: 'Bake House',
      distance: '0.8km',
    },
    {
      id: 3,
      name: 'Brown Sugar 1kg',
      rating: 4.7,
      sold: 156,
      oldPrice: '5,000',
      newPrice: '4,000',
      discount: '-20%',
      shop: 'Fresh Mart',
      distance: '1.2km',
    },
    {
      id: 4,
      name: 'Cooking Oil 1L',
      rating: 4.5,
      sold: 312,
      oldPrice: '8,000',
      newPrice: '6,400',
      discount: '-20%',
      shop: 'Super Save',
      distance: '2.1km',
    },
    {
      id: 5,
      name: 'Rice 5kg Bag',
      rating: 4.9,
      sold: 421,
      oldPrice: '25,000',
      newPrice: '20,000',
      discount: '-20%',
      shop: 'Grain World',
      distance: '3.0km',
    },
    {
      id: 6,
      name: 'Tomato Paste',
      rating: 4.4,
      sold: 98,
      oldPrice: '2,500',
      newPrice: '2,000',
      discount: '-20%',
      shop: 'Fresh Mart',
      distance: '1.2km',
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
          <Text style={styles.logo}>MUNOLINK</Text>
        </View>
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
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Row */}
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <View style={styles.groceryIcon}>
              <Ionicons name="cart" size={22} color="#006B3F" />
            </View>
            <View>
              <Text style={styles.title}>Groceries</Text>
              <Text style={styles.subtitle}>Fresh essentials, delivered to you.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.cartCard}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>3</Text>
            </View>
            <Ionicons name="cart-outline" size={18} color="#006B3F" />
            <Text style={styles.cartValue}>UGX 12,400</Text>
          </TouchableOpacity>
        </View>

        {/* Search + Filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search groceries..."
              placeholderTextColor="#CCCCCC"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
        >
          {chips.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={[styles.chip, activeChip === chip && styles.chipActive]}
              onPress={() => setActiveChip(chip)}
            >
              <Text
                style={[styles.chipText, activeChip === chip && styles.chipTextActive]}
              >
                {chip}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTitle}>Fresh Groceries</Text>
            <Text style={styles.heroSubtitle}>Up to 50% off on essentials</Text>
            <TouchableOpacity style={styles.heroButton}>
              <Text style={styles.heroButtonText}>Explore Deals</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroRight}>
            <Text style={styles.heroEmoji}>🛒</Text>
            <Text style={styles.heroEmoji}>🏷️</Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            All Groceries <Text style={styles.productCount}>({products.length} products)</Text>
          </Text>
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortText}>Sort By: {sortBy}</Text>
            <Ionicons name="chevron-down" size={14} color="#006B3F" />
          </TouchableOpacity>
        </View>

        {/* Product Grid */}
        <View style={styles.productGrid}>
          {products.map((product) => (
            <TouchableOpacity key={product.id} style={styles.productCard}>
              {/* Discount Badge */}
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{product.discount}</Text>
              </View>
              {/* Favorite */}
              <TouchableOpacity style={styles.favoriteBtn}>
                <Ionicons name="heart-outline" size={16} color="#888" />
              </TouchableOpacity>
              {/* Product Image */}
              <View style={styles.productImage}>
                <Ionicons name="cube-outline" size={32} color="#006B3F" />
              </View>
              {/* Product Info */}
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#FFB300" />
                <Text style={styles.rating}>{product.rating}</Text>
                <Text style={styles.sold}>· {product.sold} sold</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.oldPrice}>UGX {product.oldPrice}</Text>
                <Text style={styles.newPrice}>UGX {product.newPrice}</Text>
              </View>
              <View style={styles.shopRow}>
                <Ionicons name="storefront-outline" size={10} color="#888" />
                <Text style={styles.shopName}>{product.shop}</Text>
                <Text style={styles.shopDistance}>· {product.distance}</Text>
              </View>
              {/* Add Button */}
              <TouchableOpacity style={styles.addBtn}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
  
        {/* Features Strip */}
        <View style={styles.featuresStrip}>
          <View style={styles.featureItem}>
            <Ionicons name="pricetag" size={18} color="#006B3F" />
            <Text style={styles.featureText}>Great Prices</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="flash" size={18} color="#006B3F" />
            <Text style={styles.featureText}>Fast Delivery</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={18} color="#006B3F" />
            <Text style={styles.featureText}>Quality Assured</Text>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Categories')}>
          <Ionicons name="grid-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Categories</Text>
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#006B3F',
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groceryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#212121',
  },
  subtitle: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  cartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cartValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006B3F',
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
  chipsScroll: {
    marginBottom: 18,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#006B3F',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  chipTextActive: {
    color: '#FFFFFF',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#212121',
  },
  productCount: {
    fontSize: 13,
    fontWeight: '400',
    color: '#888',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 13,
    color: '#006B3F',
    fontWeight: '600',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  productCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
    flexGrow: 1,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#D32F2F',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 1,
  },
  discountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  productImage: {
    width: '100%',
    height: 90,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 2,
  },
  rating: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
  },
  sold: {
    fontSize: 10,
    color: '#888',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  oldPrice: {
    fontSize: 11,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  newPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#006B3F',
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  shopName: {
    fontSize: 10,
    color: '#888',
  },
  shopDistance: {
    fontSize: 10,
    color: '#888',
  },
  addBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#006B3F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
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