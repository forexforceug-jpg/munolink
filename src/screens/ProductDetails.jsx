import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProductDetails({ navigation, route }) {
  const product = route?.params?.product || {
    name: 'Paracetamol 500mg',
    category: 'Medicine',
    regularPrice: 3000,
    munolinkPrice: 2700,
    discount: 10,
    description: 'Effective pain relief for headaches, muscle pain, and fever.',
    features: ['Fast Pain Relief', 'Reduces Fever', 'Easy to Swallow', 'Trusted Quality'],
    shop: {
      name: 'QuickMart',
      rating: 4.8,
      distance: '0.4 km',
      isOpen: true,
      isPartner: true,
    },
  };

  const savings = product.regularPrice - product.munolinkPrice;

  const nearbyShops = [
    { name: 'QuickMart', distance: '0.4 km', price: 2700, discount: 10, inStock: true },
    { name: 'PharmaPlus', distance: '0.8 km', price: 2800, discount: 8, inStock: true },
    { name: 'City Chemist', distance: '1.2 km', price: 2650, discount: 12, inStock: true },
    { name: 'MediCare', distance: '1.5 km', price: 2900, discount: 5, inStock: false },
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
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge} />
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
        {/* Product Image + Info Row */}
        <View style={styles.topSection}>
          {/* Product Image */}
          <View style={styles.imageCard}>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{product.discount}% OFF</Text>
            </View>
            <View style={styles.productImage}>
              <Ionicons name="medkit-outline" size={56} color="#006B3F" />
            </View>
            <View style={styles.thumbnails}>
              <View style={[styles.thumb, styles.thumbActive]}>
                <Ionicons name="medkit-outline" size={18} color="#006B3F" />
              </View>
              <View style={styles.thumb}>
                <Ionicons name="cube-outline" size={18} color="#888" />
              </View>
              <View style={styles.thumb}>
                <Ionicons name="albums-outline" size={18} color="#888" />
              </View>
            </View>
          </View>

          {/* Product Info */}
          <View style={styles.infoCard}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDesc}>Effective pain relief for headaches, muscle pain, and fever.</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFB300" />
              <Text style={styles.rating}>4.8</Text>
              <Text style={styles.reviewCount}>(247 reviews)</Text>
            </View>

            {/* Price Card */}
            <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Regular Price</Text>
                <Text style={styles.regularPrice}>UGX {product.regularPrice.toLocaleString()}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Munolink Price</Text>
                <Text style={styles.munolinkPrice}>UGX {product.munolinkPrice.toLocaleString()}</Text>
              </View>
              <View style={styles.savingsBadge}>
                <Ionicons name="pricetag" size={12} color="#006B3F" />
                <Text style={styles.savingsText}>You save UGX {savings.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Shop Info Card */}
        <View style={styles.shopCard}>
          <View style={styles.shopTopRow}>
            <View style={styles.shopIcon}>
              <Ionicons name="storefront" size={22} color="#006B3F" />
            </View>
            <View style={styles.shopInfo}>
              <View style={styles.shopNameRow}>
                <Text style={styles.shopName}>{product.shop.name}</Text>
                <View style={styles.partnerBadge}>
                  <Ionicons name="shield-checkmark" size={10} color="#006B3F" />
                  <Text style={styles.partnerText}>Official Partner</Text>
                </View>
              </View>
              <View style={styles.shopMeta}>
                <Ionicons name="star" size={12} color="#FFB300" />
                <Text style={styles.shopRating}>{product.shop.rating}</Text>
                <Text style={styles.shopDistance}>· {product.shop.distance}</Text>
                <View style={styles.openBadge}>
                  <View style={styles.openDot} />
                  <Text style={styles.openText}>Open</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
  style={styles.viewShopBtn}
  onPress={() => navigation.navigate('ShopProfile')}
>
  <Text style={styles.viewShopText}>View Shop</Text>
</TouchableOpacity>
          </View>

          {/* Trust Indicators */}
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="checkmark-circle" size={14} color="#006B3F" />
              <Text style={styles.trustText}>Verified Shop</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="ribbon" size={14} color="#006B3F" />
              <Text style={styles.trustText}>Quality Products</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="pricetag" size={14} color="#006B3F" />
              <Text style={styles.trustText}>Great Prices</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="people" size={14} color="#006B3F" />
              <Text style={styles.trustText}>Trusted by 10K+</Text>
            </View>
          </View>
        </View>

        {/* About This Product */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About This Product</Text>
          <Text style={styles.aboutText}>
            Paracetamol 500mg provides effective relief from mild to moderate pain including headaches, 
            toothaches, muscle pain, and reduces fever. Suitable for adults and children over 12 years.
          </Text>
          <View style={styles.featuresList}>
            {product.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#006B3F" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Compare Prices Near You */}
        <View style={styles.compareSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Compare Prices Near You</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View all nearby shops</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.compareScroll}
          >
            {nearbyShops.map((shop, index) => (
              <View
                key={index}
                style={[
                  styles.compareCard,
                  index === 0 && styles.compareCardBest,
                ]}
              >
                {index === 0 && (
                  <View style={styles.bestPriceBadge}>
                    <Text style={styles.bestPriceText}>Best Price</Text>
                  </View>
                )}
                <Text style={styles.compareShopName}>{shop.name}</Text>
                <Text style={styles.compareDistance}>📍 {shop.distance}</Text>
                <View style={styles.comparePriceRow}>
                  <Text style={styles.comparePrice}>UGX {shop.price.toLocaleString()}</Text>
                  <Text style={styles.compareDiscount}>{shop.discount}% off</Text>
                </View>
                {shop.inStock ? (
                  <View style={styles.inStockBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#006B3F" />
                    <Text style={styles.inStockText}>In Stock</Text>
                  </View>
                ) : (
                  <View style={styles.outStockBadge}>
                    <Text style={styles.outStockText}>Out of Stock</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View>
          <Text style={styles.actionSavings}>You save UGX {savings.toLocaleString()}</Text>
          <Text style={styles.actionPrice}>UGX {product.munolinkPrice.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.saveLaterBtn}>
          <Ionicons name="bookmark-outline" size={18} color="#006B3F" />
          <Text style={styles.saveLaterText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.payBtn}>
          <Text style={styles.payBtnText}>Pay with Munolink</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.payNavButton}>
          <Ionicons name="card-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="pricetag-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Deals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Profile</Text>
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
  tagline: {
    fontSize: 10,
    color: '#888',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIcon: {
    position: 'relative',
  },
  notifBadge: {
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
    paddingTop: 8,
  },
  topSection: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  imageCard: {
    width: '48%',
    backgroundColor: '#F8F8F8',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#006B3F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 1,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  productImage: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  thumbnails: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbActive: {
    borderWidth: 2,
    borderColor: '#006B3F',
    backgroundColor: '#E8F5E9',
  },
  infoCard: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#006B3F',
  },
  productName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 4,
  },
  productDesc: {
    fontSize: 11,
    color: '#888',
    lineHeight: 16,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  rating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
  },
  reviewCount: {
    fontSize: 11,
    color: '#888',
  },
  priceCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 11,
    color: '#888',
  },
  regularPrice: {
    fontSize: 13,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  munolinkPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#006B3F',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006B3F',
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  shopTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  shopInfo: {
    flex: 1,
  },
  shopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  partnerText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#006B3F',
  },
  shopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopRating: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
  },
  shopDistance: {
    fontSize: 11,
    color: '#888',
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  openText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  viewShopBtn: {
    borderWidth: 1.5,
    borderColor: '#006B3F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewShopText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006B3F',
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  aboutSection: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  featuresList: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#444',
  },
  compareSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 12,
    color: '#006B3F',
    fontWeight: '600',
  },
  compareScroll: {
    marginLeft: -4,
  },
  compareCard: {
    width: 145,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  compareCardBest: {
    borderColor: '#006B3F',
    borderWidth: 2,
  },
  bestPriceBadge: {
    position: 'absolute',
    top: -8,
    right: 10,
    backgroundColor: '#006B3F',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bestPriceText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  compareShopName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212121',
    marginTop: 4,
    marginBottom: 4,
  },
  compareDistance: {
    fontSize: 11,
    color: '#888',
    marginBottom: 8,
  },
  comparePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  comparePrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#006B3F',
  },
  compareDiscount: {
    fontSize: 10,
    color: '#D32F2F',
    fontWeight: '700',
  },
  inStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inStockText: {
    fontSize: 11,
    color: '#006B3F',
    fontWeight: '600',
  },
  outStockBadge: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  outStockText: {
    fontSize: 10,
    color: '#D32F2F',
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
  },
  actionSavings: {
    fontSize: 10,
    color: '#006B3F',
    fontWeight: '600',
  },
  actionPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212121',
  },
  saveLaterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#006B3F',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 22,
    gap: 4,
  },
  saveLaterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006B3F',
  },
  payBtn: {
    flex: 1,
    backgroundColor: '#006B3F',
    paddingVertical: 12,
    borderRadius: 22,
    alignItems: 'center',
  },
  payBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
  payNavButton: {
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