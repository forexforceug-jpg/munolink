import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ShopProfile({ navigation }) {
  const [activeReview, setActiveReview] = useState(0);

  const popularProducts = [
    { id: 1, name: 'Paracetamol 500mg', pack: '10 tablets', regularPrice: 3000, munolinkPrice: 2500, savings: 500 },
    { id: 2, name: 'Cough Syrup', pack: '100ml bottle', regularPrice: 8500, munolinkPrice: 7200, savings: 1300 },
    { id: 3, name: 'Vitamin C', pack: '30 tablets', regularPrice: 16000, munolinkPrice: 13500, savings: 2500 },
    { id: 4, name: 'First Aid Kit', pack: 'Complete set', regularPrice: 32000, munolinkPrice: 27000, savings: 5000 },
  ];

  const reviews = [
    {
      id: 1,
      name: 'Sarah K.',
      initial: 'S',
      date: '2 days ago',
      rating: 5,
      text: 'Very professional service. The pharmacist was helpful and the prices are fair. Will definitely come back!',
    },
    {
      id: 2,
      name: 'David O.',
      initial: 'D',
      date: '1 week ago',
      rating: 5,
      text: 'Best pharmacy in Jinja. Always has what I need and the Munolink discount makes it even better.',
    },
    {
      id: 3,
      name: 'Grace N.',
      initial: 'G',
      date: '2 weeks ago',
      rating: 4,
      text: 'Good products and convenient location. Sometimes busy but worth the wait.',
    },
  ];

  const statCards = [
    { icon: 'calendar-outline', value: 'Since 2015', label: 'Established' },
    { icon: 'people-outline', value: '12K+', label: 'Customers' },
    { icon: 'time-outline', value: '30-45 min', label: 'Avg Delivery' },
    { icon: 'heart-outline', value: '2.4K', label: 'Followers' },
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
        {/* Shop Hero Section */}
        <View style={styles.heroSection}>
          {/* Shop Image */}
          <View style={styles.shopImageCard}>
            <View style={styles.shopImage}>
              <Ionicons name="storefront" size={48} color="#006B3F" />
            </View>
            <View style={styles.photosIndicator}>
              <Ionicons name="images-outline" size={12} color="#FFFFFF" />
              <Text style={styles.photosText}>5 photos</Text>
            </View>
          </View>

          {/* Shop Info */}
          <View style={styles.shopInfo}>
            <View style={styles.partnerBadge}>
              <Ionicons name="shield-checkmark" size={10} color="#006B3F" />
              <Text style={styles.partnerBadgeText}>Official Munolink Partner</Text>
            </View>
            <View style={styles.shopNameRow}>
              <Text style={styles.shopName}>Jinja Pharmacy</Text>
              <Ionicons name="checkmark-circle" size={18} color="#006B3F" />
            </View>
            <View style={styles.shopMeta}>
              <Ionicons name="star" size={13} color="#FFB300" />
              <Text style={styles.shopRating}>4.8</Text>
              <Text style={styles.shopReviews}>(247 reviews)</Text>
              <Text style={styles.shopCategory}>· Pharmacy</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.openBadge}>
                <View style={styles.openDot} />
                <Text style={styles.openText}>Open now</Text>
              </View>
              <Text style={styles.closesAt}>· Closes 9:00 PM</Text>
            </View>
            <Text style={styles.shopDistance}>📍 0.4 km away in Jinja City</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="navigate-outline" size={18} color="#006B3F" />
            <Text style={styles.actionBtnText}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="call-outline" size={18} color="#006B3F" />
            <Text style={styles.actionBtnText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={18} color="#006B3F" />
            <Text style={styles.actionBtnText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Discount Banner */}
        <View style={styles.discountBanner}>
          <View style={styles.discountLeft}>
            <Ionicons name="pricetag" size={20} color="#006B3F" />
            <View>
              <Text style={styles.discountTitle}>10% OFF with Munolink Pay</Text>
              <Text style={styles.discountSubtitle}>Automatic discount at checkout</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.payNowBtn}
            onPress={() => navigation.navigate('PaymentConfirm')}
          >
            <Text style={styles.payNowText}>Pay Now</Text>
          </TouchableOpacity>
        </View>

        {/* About This Shop */}
        <Text style={styles.sectionTitle}>About this Shop</Text>
        <Text style={styles.aboutText}>
          Jinja Pharmacy is your trusted neighborhood pharmacy providing quality medicines, 
          healthcare products, and professional advice. We've been serving the Jinja community 
          since 2015 with a commitment to genuine products and fair prices.
        </Text>

        {/* Trust Badges */}
        <View style={styles.trustBadges}>
          <View style={styles.trustBadge}>
            <Ionicons name="ribbon-outline" size={16} color="#006B3F" />
            <Text style={styles.trustBadgeText}>Genuine Products</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="pricetag-outline" size={16} color="#006B3F" />
            <Text style={styles.trustBadgeText}>Fair Prices</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="flash-outline" size={16} color="#006B3F" />
            <Text style={styles.trustBadgeText}>Fast Service</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="people-outline" size={16} color="#006B3F" />
            <Text style={styles.trustBadgeText}>Trusted by Thousands</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          {statCards.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Ionicons name={stat.icon} size={20} color="#006B3F" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Popular Products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Products</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.productsScroll}
        >
          {popularProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productImage}>
                <Ionicons name="cube-outline" size={30} color="#006B3F" />
              </View>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPack}>{product.pack}</Text>
              <Text style={styles.productMunolinkPrice}>UGX {product.munolinkPrice.toLocaleString()}</Text>
              <Text style={styles.productRegularPrice}>UGX {product.regularPrice.toLocaleString()}</Text>
              <View style={styles.productSaveBadge}>
                <Text style={styles.productSaveText}>Save {product.savings}</Text>
              </View>
              <TouchableOpacity style={styles.addBtn}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Customer Reviews */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All 247</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.reviewsContainer}>
          {/* Rating Summary */}
          <View style={styles.ratingSummary}>
            <Text style={styles.ratingBig}>4.8</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons key={star} name="star" size={14} color="#FFB300" />
              ))}
            </View>
            <Text style={styles.ratingCount}>247 reviews</Text>
            {/* Rating Bars */}
            {[5, 4, 3, 2, 1].map((star) => (
              <View key={star} style={styles.ratingBarRow}>
                <Text style={styles.ratingBarLabel}>{star}</Text>
                <Ionicons name="star" size={10} color="#FFB300" />
                <View style={styles.ratingBar}>
                  <View
                    style={[
                      styles.ratingBarFill,
                      { width: star === 5 ? '70%' : star === 4 ? '20%' : star === 3 ? '7%' : star === 2 ? '2%' : '1%' },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Review Card */}
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerAvatar}>
                <Text style={styles.reviewerInitial}>{reviews[activeReview].initial}</Text>
              </View>
              <View>
                <Text style={styles.reviewerName}>{reviews[activeReview].name}</Text>
                <Text style={styles.reviewDate}>{reviews[activeReview].date}</Text>
              </View>
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name="star"
                    size={12}
                    color={star <= reviews[activeReview].rating ? '#FFB300' : '#E0E0E0'}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.reviewText}>{reviews[activeReview].text}</Text>
            {/* Carousel Indicators */}
            <View style={styles.carouselDots}>
              {reviews.map((_, index) => (
                <View
                  key={index}
                  style={[styles.carouselDot, activeReview === index && styles.carouselDotActive]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Delivery Promo */}
        <View style={styles.deliveryPromo}>
          <View style={styles.deliveryPromoLeft}>
            <Ionicons name="bicycle-outline" size={32} color="#006B3F" />
            <View>
              <Text style={styles.deliveryPromoTitle}>Want it delivered?</Text>
              <Text style={styles.deliveryPromoSubtitle}>Get your items delivered to your doorstep.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.orderDeliveryBtn}>
            <Text style={styles.orderDeliveryText}>Order Delivery</Text>
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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SearchResults')}>
          <Ionicons name="search-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.payNavButton}
          onPress={() => navigation.navigate('PaymentConfirm')}
        >
          <Ionicons name="card-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bookmark" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>My Shops</Text>
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
  heroSection: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  shopImageCard: {
    width: '42%', backgroundColor: '#F5F5F5', borderRadius: 18, padding: 14,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  shopImage: { justifyContent: 'center', alignItems: 'center', height: 120 },
  photosIndicator: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4,
  },
  photosText: { fontSize: 10, color: '#FFFFFF', fontWeight: '600' },
  shopInfo: { flex: 1, justifyContent: 'center' },
  partnerBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6, gap: 4,
  },
  partnerBadgeText: { fontSize: 9, fontWeight: '700', color: '#006B3F' },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  shopName: { fontSize: 20, fontWeight: '800', color: '#212121' },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  shopRating: { fontSize: 13, fontWeight: '700', color: '#555' },
  shopReviews: { fontSize: 12, color: '#888' },
  shopCategory: { fontSize: 12, color: '#888' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  openDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4CAF50' },
  openText: { fontSize: 12, fontWeight: '600', color: '#4CAF50' },
  closesAt: { fontSize: 12, color: '#888' },
  shopDistance: { fontSize: 12, color: '#888', marginTop: 2 },
  actionButtons: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingVertical: 12, gap: 6,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  discountBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F5E9', borderRadius: 16, padding: 14, marginBottom: 20,
  },
  discountLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  discountTitle: { fontSize: 14, fontWeight: '800', color: '#006B3F' },
  discountSubtitle: { fontSize: 11, color: '#006B3F', fontWeight: '500' },
  payNowBtn: {
    backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20,
  },
  payNowText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 8 },
  aboutText: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 14 },
  trustBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  trustBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6,
  },
  trustBadgeText: { fontSize: 11, fontWeight: '600', color: '#006B3F' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  statCard: {
    flex: 1, backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: 14, fontWeight: '800', color: '#212121' },
  statLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  viewAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  productsScroll: { marginBottom: 22 },
  productCard: {
    width: 150, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginRight: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, position: 'relative',
  },
  productImage: {
    width: '100%', height: 80, backgroundColor: '#F5F5F5',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  productName: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 2 },
  productPack: { fontSize: 10, color: '#888', marginBottom: 4 },
  productMunolinkPrice: { fontSize: 15, fontWeight: '800', color: '#006B3F' },
  productRegularPrice: { fontSize: 12, color: '#888', textDecorationLine: 'line-through' },
  productSaveBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, alignSelf: 'flex-start', marginTop: 2,
  },
  productSaveText: { fontSize: 9, fontWeight: '700', color: '#006B3F' },
  addBtn: {
    position: 'absolute', bottom: 10, right: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  reviewsContainer: { flexDirection: 'row', gap: 14, marginBottom: 22 },
  ratingSummary: { width: '35%' },
  ratingBig: { fontSize: 40, fontWeight: '800', color: '#212121', marginBottom: 4 },
  starsRow: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  ratingCount: { fontSize: 12, color: '#888', marginBottom: 10 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  ratingBarLabel: { fontSize: 10, color: '#888', width: 10 },
  ratingBar: {
    flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden',
  },
  ratingBarFill: { height: '100%', backgroundColor: '#FFB300', borderRadius: 3 },
  reviewCard: { flex: 1, backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  reviewerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  reviewerInitial: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  reviewerName: { fontSize: 13, fontWeight: '700', color: '#212121' },
  reviewDate: { fontSize: 11, color: '#888' },
  reviewStars: { flexDirection: 'row', gap: 2, marginLeft: 'auto' },
  reviewText: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 10 },
  carouselDots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  carouselDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D0D0D0' },
  carouselDotActive: { backgroundColor: '#006B3F', width: 16 },
  deliveryPromo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F5E9', borderRadius: 16, padding: 16, marginBottom: 8,
  },
  deliveryPromoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  deliveryPromoTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },
  deliveryPromoSubtitle: { fontSize: 11, color: '#666' },
  orderDeliveryBtn: {
    backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20,
  },
  orderDeliveryText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
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