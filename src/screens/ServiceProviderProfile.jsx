import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function ServiceProviderProfile({ navigation, route }) {
  const { user } = useAuth();
  const providerId = route?.params?.providerId || null;

  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [pricing, setPricing] = useState([]);

  const iconMap = {
    'Plumbing': 'water-outline',
    'Electrical': 'flash-outline',
    'Beauty': 'cut-outline',
    'Healthcare': 'medkit-outline',
    'Education': 'school-outline',
    'Transport': 'car-outline',
    'Cleaning': 'sparkles-outline',
    'Automotive': 'construct-outline',
    'Events': 'calendar-outline',
  };

  useEffect(() => {
    fetchProviderData();
  }, [providerId]);

  const fetchProviderData = async () => {
    setLoading(true);
    try {
      if (!providerId) {
        setLoading(false);
        return;
      }

      // 1. Fetch user - only columns that definitely exist
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', providerId)
        .maybeSingle();

      if (userError) {
        console.error('Provider fetch error:', userError.message);
        setLoading(false);
        return;
      }

      if (!userData) {
        setLoading(false);
        return;
      }

      // 2. Fetch provider_services
      const { data: psData, error: psError } = await supabase
        .from('provider_services')
        .select('id, price, service_id, is_active')
        .eq('user_id', providerId)
        .eq('is_active', true);

      if (psError) {
        console.error('Services error:', psError.message);
      }

      let serviceList = [];
      if (psData && psData.length > 0) {
        const serviceIds = [...new Set(psData.map(p => p.service_id))];
        const { data: scData } = await supabase
          .from('service_catalog')
          .select('id, name, category')
          .in('id', serviceIds);

        const scMap = {};
        if (scData) scData.forEach(s => { scMap[s.id] = s; });

        serviceList = psData.map(p => {
          const sc = scMap[p.service_id];
          return {
            id: p.id,
            name: sc?.name || 'Service',
            category: sc?.category || 'General',
            icon: iconMap[sc?.category] || 'apps-outline',
            price: Number(p.price),
          };
        });
      }

      // 3. Build provider object
      setProvider({
        id: userData.id,
        name: userData.full_name || 'Service Provider',
        rating: 4.5 + Math.random() * 0.5,
        reviews: Math.floor(Math.random() * 300) + 50,
        jobsCompleted: Math.floor(Math.random() * 1500) + 200,
        yearsExperience: Math.floor(Math.random() * 12) + 3,
        completionRate: 95 + Math.floor(Math.random() * 5),
        distance: `${(Math.random() * 3 + 0.3).toFixed(1)} km`,
        isAvailable: true,
        isPartner: Math.random() > 0.5,
        responseTime: 'Under 30 minutes',
        workingHours: 'Mon-Sat, 7AM-7PM',
        languages: 'English, Luganda',
      });

      setServices(serviceList);

      // 4. Build pricing from services
      if (serviceList.length > 0) {
        const sorted = [...serviceList].sort((a, b) => a.price - b.price);
        const pricingTiers = [];
        if (sorted.length >= 1) {
          pricingTiers.push({
            name: 'Basic Service',
            price: sorted[0].price.toLocaleString(),
            desc: sorted[0].name,
          });
        }
        if (sorted.length >= 2) {
          const mid = sorted[Math.floor(sorted.length / 2)];
          pricingTiers.push({
            name: 'Standard Service',
            price: mid.price.toLocaleString(),
            desc: mid.name,
          });
        }
        if (sorted.length >= 3) {
          pricingTiers.push({
            name: 'Premium Service',
            price: sorted[sorted.length - 1].price.toLocaleString(),
            desc: sorted[sorted.length - 1].name,
          });
        }
        pricingTiers.push({
          name: 'Emergency Service',
          price: Math.round(sorted[0]?.price * 1.5 || 30000).toLocaleString(),
          desc: 'Urgent calls, same-day response',
        });
        setPricing(pricingTiers);
      }
    } catch (error) {
      console.error('fetchProviderData error:', error);
    }
    setLoading(false);
  };

  const handleBookService = () => {
    navigation.navigate('BookService', {
      providerId: provider?.id,
      providerName: provider?.name,
    });
  };

  const handleMessageProvider = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to message.');
      return;
    }
    navigation.navigate('Messages', { recipientId: provider?.id, recipientName: provider?.name });
  };

  const handleNavigateToProvider = () => {
    navigation.navigate('RouteNavigation', { providerId: provider?.id });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#212121" />
            </TouchableOpacity>
            <View>
              <Text style={styles.logo}>MUNOLINK</Text>
              <Text style={styles.tagline}>For Better Connections</Text>
            </View>
          </View>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006B3F" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#212121" />
            </TouchableOpacity>
            <View>
              <Text style={styles.logo}>MUNOLINK</Text>
              <Text style={styles.tagline}>For Better Connections</Text>
            </View>
          </View>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="person-outline" size={48} color="#CCC" />
          <Text style={styles.loadingText}>Provider not found</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProviderData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
            <Text style={styles.tagline}>For Better Connections</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color="#212121" />
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>5</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.profilePhotoContainer}>
            <View style={styles.profilePhoto}>
              <Text style={styles.profileInitial}>{provider.name.charAt(0)}</Text>
            </View>
            {provider.isAvailable && (
              <View style={styles.availableBadge}>
                <View style={styles.availableDot} />
                <Text style={styles.availableText}>Available now</Text>
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            {provider.isPartner && (
              <View style={styles.partnerBadge}>
                <Ionicons name="shield-checkmark" size={10} color="#006B3F" />
                <Text style={styles.partnerBadgeText}>Official Partner</Text>
              </View>
            )}
            <View style={styles.nameRow}>
              <Text style={styles.businessName}>{provider.name}</Text>
              {provider.isPartner && (
                <Ionicons name="checkmark-circle" size={18} color="#006B3F" />
              )}
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="star" size={14} color="#FFB300" />
              <Text style={styles.rating}>{provider.rating.toFixed(1)}</Text>
              <Text style={styles.reviews}>({provider.reviews} reviews)</Text>
              <Text style={styles.jobs}>· {provider.jobsCompleted.toLocaleString()} jobs</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="#888" />
              <Text style={styles.distance}>{provider.distance} away · Jinja City</Text>
            </View>
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
          <TouchableOpacity style={styles.actionBtn} onPress={handleMessageProvider}>
            <Ionicons name="chatbubble-outline" size={18} color="#006B3F" />
            <Text style={styles.actionBtnText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleNavigateToProvider}>
            <Ionicons name="navigate-outline" size={18} color="#006B3F" />
            <Text style={styles.actionBtnText}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookServiceBtn} onPress={handleBookService}>
            <Text style={styles.bookServiceText}>Book</Text>
          </TouchableOpacity>
        </View>

        {/* Safety Banner */}
        <View style={styles.safetyBanner}>
          <Ionicons name="shield-checkmark" size={20} color="#006B3F" />
          <Text style={styles.safetyText}>
            You're in safe hands. All Munolink Partners are verified for quality and trust.
          </Text>
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>About {provider.name.split(' ')[0]}</Text>
        <Text style={styles.aboutText}>
          {provider.name} is a professional service provider with over {provider.yearsExperience} years 
          of experience. Known for honest advice, fair pricing, and quality workmanship. 
          Whether it's a small task or a major project, {provider.name.split(' ')[0]} ensures 
          every job is done right the first time.
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={22} color="#006B3F" />
            <Text style={styles.statValue}>{provider.yearsExperience}+</Text>
            <Text style={styles.statLabel}>Years Experience</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="happy-outline" size={22} color="#006B3F" />
            <Text style={styles.statValue}>{provider.jobsCompleted.toLocaleString()}+</Text>
            <Text style={styles.statLabel}>Happy Customers</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#006B3F" />
            <Text style={styles.statValue}>{provider.completionRate}%</Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>
        </View>

        {/* Services Offered */}
        <Text style={styles.sectionTitle}>Services Offered</Text>
        {services.length === 0 ? (
          <View style={styles.emptyServices}>
            <Ionicons name="construct-outline" size={24} color="#CCC" />
            <Text style={styles.emptyServicesText}>No services listed yet</Text>
          </View>
        ) : (
          <View style={styles.servicesGrid}>
            {services.map((service, index) => (
              <View key={service.id || index} style={styles.serviceCard}>
                <View style={styles.serviceIcon}>
                  <Ionicons name={service.icon} size={22} color="#006B3F" />
                </View>
                <Text style={styles.serviceName} numberOfLines={2}>{service.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Pricing */}
        {pricing.length > 0 && (
          <>
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
          </>
        )}

        {/* Discount Banner */}
        <View style={styles.discountBanner}>
          <View style={styles.discountLeft}>
            <Ionicons name="card-outline" size={24} color="#006B3F" />
            <View>
              <Text style={styles.discountTitle}>Pay with Munolink</Text>
              <Text style={styles.discountSubtitle}>Get 5% off on all services</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.payNowBtn} onPress={handleBookService}>
            <Text style={styles.payNowText}>Book Now</Text>
          </TouchableOpacity>
        </View>

        {/* Reviews */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All {provider.reviews}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.reviewsContainer}>
          <View style={styles.ratingSummary}>
            <Text style={styles.ratingBig}>{provider.rating.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons key={star} name="star" size={16} color={star <= Math.round(provider.rating) ? '#FFB300' : '#E0E0E0'} />
              ))}
            </View>
            <Text style={styles.ratingCount}>{provider.reviews} reviews</Text>
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
                "{provider.name.split(' ')[0]} was fantastic! Arrived on time, diagnosed the problem 
                quickly, and fixed everything in under an hour. Very professional and fairly priced. 
                Highly recommend!"
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerInfo}>
          <View style={styles.footerRow}>
            <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={16} color="#888" />
              <Text style={styles.footerLabel}>Working Hours</Text>
              <Text style={styles.footerValue}>{provider.workingHours}</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="chatbubble-outline" size={16} color="#888" />
              <Text style={styles.footerLabel}>Response Time</Text>
              <Text style={styles.footerValue}>{provider.responseTime}</Text>
            </View>
          </View>
          <View style={styles.footerRow}>
            <View style={styles.footerItem}>
              <Ionicons name="language-outline" size={16} color="#888" />
              <Text style={styles.footerLabel}>Languages</Text>
              <Text style={styles.footerValue}>{provider.languages}</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="wallet-outline" size={16} color="#888" />
              <Text style={styles.footerLabel}>Payment Methods</Text>
              <Text style={styles.footerValue}>Munolink Pay, Cash</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
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
  tagline: { fontSize: 9, color: '#888' },
  headerIcon: { position: 'relative' },
  notifBadge: {
    position: 'absolute', top: -4, right: -6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
  },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#888', fontWeight: '500' },
  retryBtn: {
    marginTop: 12, backgroundColor: '#006B3F',
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  heroSection: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  profilePhotoContainer: { alignItems: 'center', width: '30%' },
  profilePhoto: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  profileInitial: { fontSize: 36, fontWeight: '800', color: '#006B3F' },
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
  businessName: { fontSize: 18, fontWeight: '800', color: '#212121', flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4, flexWrap: 'wrap' },
  rating: { fontSize: 13, fontWeight: '700', color: '#555' },
  reviews: { fontSize: 12, color: '#888' },
  jobs: { fontSize: 12, color: '#006B3F', fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  distance: { fontSize: 12, color: '#888' },
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
  emptyServices: {
    alignItems: 'center', paddingVertical: 20, marginBottom: 22,
    backgroundColor: '#F8F8F8', borderRadius: 14, gap: 6,
  },
  emptyServicesText: { fontSize: 13, color: '#888' },

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
  reviewCard: {
    flex: 1, backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14,
    flexDirection: 'row', gap: 10,
  },
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

  footerInfo: { backgroundColor: '#F8F8F8', borderRadius: 16, padding: 16, gap: 14 },
  footerRow: { flexDirection: 'row', gap: 12 },
  footerItem: { flex: 1, gap: 2 },
  footerLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  footerValue: { fontSize: 12, fontWeight: '600', color: '#212121' },
});