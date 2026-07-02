import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ServiceProviderProfile({ navigation }) {
  const services = [
    { icon: 'search-outline', name: 'Leak Detection & Repair' },
    { icon: 'construct-outline', name: 'Pipe Installation & Replacement' },
    { icon: 'water-outline', name: 'Drain Cleaning & Unclogging' },
    { icon: 'home-outline', name: 'Bathroom Fittings' },
    { icon: 'flame-outline', name: 'Water Heater Services' },
    { icon: 'build-outline', name: 'Tap & Fixture Repairs' },
  ];

  const pricing = [
    { name: 'Minor Repairs', price: '20,000', desc: 'Leaks, clogs, small fixes' },
    { name: 'Standard Jobs', price: '50,000', desc: 'Installations, replacements' },
    { name: 'Major Jobs', price: '120,000', desc: 'Full bathroom, kitchen plumbing' },
    { name: 'Emergency Jobs', price: '80,000', desc: 'Urgent repairs, burst pipes' },
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
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Profile Photo */}
          <View style={styles.profilePhotoContainer}>
            <View style={styles.profilePhoto}>
              <Ionicons name="person" size={48} color="#006B3F" />
            </View>
            <View style={styles.availableBadge}>
              <View style={styles.availableDot} />
              <Text style={styles.availableText}>Available now</Text>
            </View>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <View style={styles.partnerBadge}>
              <Ionicons name="shield-checkmark" size={10} color="#006B3F" />
              <Text style={styles.partnerBadgeText}>Official Munolink Partner</Text>
            </View>
            <View style={styles.nameRow}>
              <Text style={styles.businessName}>John Plumbing Services</Text>
              <Ionicons name="checkmark-circle" size={18} color="#006B3F" />
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="star" size={14} color="#FFB300" />
              <Text style={styles.rating}>4.9</Text>
              <Text style={styles.reviews}>(312 reviews)</Text>
              <Text style={styles.jobs}>· 1.2K jobs completed</Text>
            </View>
            <Text style={styles.distance}>📍 0.8 km away in Jinja City</Text>
            <View style={styles.trustBadges}>
              <View style={styles.trustBadge}>
                <Ionicons name="shield-checkmark" size={10} color="#006B3F" />
                <Text style={styles.trustBadgeText}>Verified</Text>
              </View>
              <View style={styles.trustBadge}>
                <Ionicons name="document-text-outline" size={10} color="#006B3F" />
                <Text style={styles.trustBadgeText}>Background Checked</Text>
              </View>
              <View style={styles.trustBadge}>
                <Ionicons name="shield-outline" size={10} color="#006B3F" />
                <Text style={styles.trustBadgeText}>Insured</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="call-outline" size={18} color="#006B3F" />
            <Text style={styles.actionBtnText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={18} color="#006B3F" />
            <Text style={styles.actionBtnText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="navigate-outline" size={18} color="#006B3F" />
            <Text style={styles.actionBtnText}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookServiceBtn}>
            <Text style={styles.bookServiceText}>Book Service</Text>
          </TouchableOpacity>
        </View>

        {/* Safety Banner */}
        <View style={styles.safetyBanner}>
          <Ionicons name="shield-checkmark" size={20} color="#006B3F" />
          <Text style={styles.safetyText}>You're in safe hands. All Munolink Partners are verified for quality and trust.</Text>
        </View>

        {/* About John */}
        <Text style={styles.sectionTitle}>About John</Text>
        <Text style={styles.aboutText}>
          John is a professional plumber with over 8 years of experience in residential 
          and business plumbing services. He is known for his honest advice, fair pricing, 
          and quality workmanship. Whether it's a minor leak or a complete bathroom 
          renovation, John ensures every job is done right the first time.
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={22} color="#006B3F" />
            <Text style={styles.statValue}>8+</Text>
            <Text style={styles.statLabel}>Years Experience</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="happy-outline" size={22} color="#006B3F" />
            <Text style={styles.statValue}>1.2K+</Text>
            <Text style={styles.statLabel}>Happy Customers</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#006B3F" />
            <Text style={styles.statValue}>98%</Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>
        </View>

        {/* Services Offered */}
        <Text style={styles.sectionTitle}>Services Offered</Text>
        <View style={styles.servicesGrid}>
          {services.map((service, index) => (
            <View key={index} style={styles.serviceCard}>
              <View style={styles.serviceIcon}>
                <Ionicons name={service.icon} size={24} color="#006B3F" />
              </View>
              <Text style={styles.serviceName}>{service.name}</Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <Text style={styles.sectionTitle}>Pricing</Text>
        {pricing.map((item, index) => (
          <View key={index} style={styles.pricingCard}>
            <View style={styles.pricingInfo}>
              <Text style={styles.pricingName}>{item.name}</Text>
              <Text style={styles.pricingDesc}>{item.desc}</Text>
            </View>
            <View style={styles.pricingRight}>
              <Text style={styles.pricingLabel}>From</Text>
              <Text style={styles.pricingValue}>UGX {item.price}</Text>
            </View>
          </View>
        ))}

        {/* Munolink Pay Discount */}
        <View style={styles.discountBanner}>
          <View style={styles.discountLeft}>
            <Ionicons name="card-outline" size={24} color="#006B3F" />
            <View>
              <Text style={styles.discountTitle}>Pay with Munolink Pay</Text>
              <Text style={styles.discountSubtitle}>Get 5% off on all services</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.payNowBtn}
            onPress={() => navigation.navigate('PaymentConfirm')}
          >
            <Text style={styles.payNowText}>Pay Now</Text>
          </TouchableOpacity>
        </View>

        {/* Customer Reviews */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All 312</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.reviewsContainer}>
          <View style={styles.ratingSummary}>
            <Text style={styles.ratingBig}>4.9</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons key={star} name="star" size={16} color="#FFB300" />
              ))}
            </View>
            <Text style={styles.ratingCount}>312 reviews</Text>
            {[5, 4, 3, 2, 1].map((star) => (
              <View key={star} style={styles.ratingBarRow}>
                <Text style={styles.ratingBarLabel}>{star}</Text>
                <Ionicons name="star" size={10} color="#FFB300" />
                <View style={styles.ratingBar}>
                  <View style={[styles.ratingBarFill, { width: star === 5 ? '75%' : star === 4 ? '18%' : star === 3 ? '5%' : star === 2 ? '1%' : '1%' }]} />
                </View>
              </View>
            ))}
          </View>
          <View style={styles.reviewCard}>
            <View style={styles.reviewerAvatar}>
              <Text style={styles.reviewerInitial}>D</Text>
            </View>
            <View style={styles.reviewContent}>
              <Text style={styles.reviewerName}>David O.</Text>
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons key={star} name="star" size={11} color="#FFB300" />
                ))}
              </View>
              <Text style={styles.reviewDate}>2 weeks ago</Text>
              <Text style={styles.reviewText}>
                "John was fantastic! He arrived on time, diagnosed the problem quickly, 
                and fixed our burst pipe in under an hour. Very professional and fairly priced. 
                Highly recommend!"
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footerInfo}>
          <View style={styles.footerRow}>
            <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={16} color="#888" />
              <Text style={styles.footerLabel}>Working Hours</Text>
              <Text style={styles.footerValue}>Mon-Sat, 7AM-7PM</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="chatbubble-outline" size={16} color="#888" />
              <Text style={styles.footerLabel}>Response Time</Text>
              <Text style={styles.footerValue}>Under 30 minutes</Text>
            </View>
          </View>
          <View style={styles.footerRow}>
            <View style={styles.footerItem}>
              <Ionicons name="language-outline" size={16} color="#888" />
              <Text style={styles.footerLabel}>Languages</Text>
              <Text style={styles.footerValue}>English, Luganda</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="wallet-outline" size={16} color="#888" />
              <Text style={styles.footerLabel}>Payment Methods</Text>
              <Text style={styles.footerValue}>Munolink Pay, Cash</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="briefcase" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.payNavButton}
          onPress={() => navigation.navigate('PaymentConfirm')}
        >
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  heroSection: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  profilePhotoContainer: { alignItems: 'center', width: '30%' },
  profilePhoto: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  availableBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, gap: 4,
  },
  availableDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4CAF50' },
  availableText: { fontSize: 11, fontWeight: '600', color: '#4CAF50' },
  profileInfo: { flex: 1, justifyContent: 'center' },
  partnerBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6, gap: 4,
  },
  partnerBadgeText: { fontSize: 9, fontWeight: '700', color: '#006B3F' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  businessName: { fontSize: 18, fontWeight: '800', color: '#212121' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  rating: { fontSize: 13, fontWeight: '700', color: '#555' },
  reviews: { fontSize: 12, color: '#888' },
  jobs: { fontSize: 12, color: '#006B3F', fontWeight: '600' },
  distance: { fontSize: 12, color: '#888', marginBottom: 8 },
  trustBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  trustBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 4, gap: 4,
  },
  trustBadgeText: { fontSize: 9, fontWeight: '600', color: '#006B3F' },
  actionButtons: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingVertical: 12, gap: 5,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  bookServiceBtn: {
    flex: 1.2, backgroundColor: '#006B3F', borderRadius: 14,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
  },
  bookServiceText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  safetyBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', borderRadius: 14, padding: 14, marginBottom: 20, gap: 10,
  },
  safetyText: { flex: 1, fontSize: 13, color: '#006B3F', fontWeight: '600', lineHeight: 19 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#212121', marginBottom: 10 },
  aboutText: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  statCard: {
    flex: 1, backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#212121' },
  statLabel: { fontSize: 10, color: '#888', fontWeight: '500', textAlign: 'center' },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  serviceCard: {
    width: '47%', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  serviceIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  serviceName: { fontSize: 12, fontWeight: '600', color: '#333', flex: 1 },
  pricingCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, marginBottom: 8,
  },
  pricingInfo: { flex: 1 },
  pricingName: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 2 },
  pricingDesc: { fontSize: 11, color: '#888' },
  pricingRight: { alignItems: 'flex-end' },
  pricingLabel: { fontSize: 10, color: '#888' },
  pricingValue: { fontSize: 18, fontWeight: '800', color: '#006B3F' },
  discountBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F5E9', borderRadius: 16, padding: 16, marginTop: 14, marginBottom: 22,
  },
  discountLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  discountTitle: { fontSize: 14, fontWeight: '800', color: '#006B3F' },
  discountSubtitle: { fontSize: 11, color: '#006B3F', fontWeight: '500' },
  payNowBtn: {
    backgroundColor: '#006B3F', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20,
  },
  payNowText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  viewAll: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  reviewsContainer: { flexDirection: 'row', gap: 14, marginBottom: 22 },
  ratingSummary: { width: '35%' },
  ratingBig: { fontSize: 40, fontWeight: '800', color: '#212121', marginBottom: 4 },
  starsRow: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  ratingCount: { fontSize: 12, color: '#888', marginBottom: 10 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  ratingBarLabel: { fontSize: 10, color: '#888', width: 10 },
  ratingBar: { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  ratingBarFill: { height: '100%', backgroundColor: '#FFB300', borderRadius: 3 },
  reviewCard: { flex: 1, backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10 },
  reviewerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  reviewerInitial: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  reviewContent: { flex: 1 },
  reviewerName: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 2 },
  reviewStars: { flexDirection: 'row', gap: 2, marginBottom: 2 },
  reviewDate: { fontSize: 11, color: '#888', marginBottom: 6 },
  reviewText: { fontSize: 13, color: '#555', lineHeight: 19 },
  footerInfo: {
    backgroundColor: '#F8F8F8', borderRadius: 16, padding: 16, gap: 14,
  },
  footerRow: { flexDirection: 'row', gap: 12 },
  footerItem: { flex: 1, gap: 2 },
  footerLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  footerValue: { fontSize: 12, fontWeight: '600', color: '#212121' },
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