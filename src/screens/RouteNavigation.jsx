import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function RouteNavigation({ navigation, route }) {
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState('driving');
  const [userLocation, setUserLocation] = useState(null);

  const shopId = route?.params?.shopId || null;
  const providerId = route?.params?.providerId || null;

  // Transport options with dynamic times/distances
  const [transports, setTransports] = useState([
    { mode: 'driving', icon: 'car-outline', time: '-- min', distance: '-- km', active: true },
    { mode: 'cycling', icon: 'bicycle-outline', time: '-- min', distance: '-- km', active: false },
    { mode: 'walking', icon: 'walk-outline', time: '-- min', distance: '-- km', active: false },
  ]);

  // Journey summary with dynamic values
  const [journeySummary, setJourneySummary] = useState([
    { label: 'Time', value: '--', icon: 'time-outline' },
    { label: 'Distance', value: '--', icon: 'map-outline' },
    { label: 'Traffic', value: 'Checking...', icon: 'speedometer-outline' },
    { label: 'Route', value: 'Best', icon: 'sparkles-outline' },
  ]);

  // Turn-by-turn directions (generated based on destination)
  const [directions, setDirections] = useState([]);

  useEffect(() => {
    fetchDestinationAndCalculateRoute();
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    // Try to get user's saved location or default to Jinja
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('location_name, latitude, longitude')
          .eq('id', user.id)
          .single();
        if (userData?.location_name) {
          setUserLocation({ name: userData.location_name, lat: userData.latitude, lng: userData.longitude });
          return;
        }
      }
    } catch (e) {}
    setUserLocation({ name: 'Jinja City, Uganda', lat: 0.4347, lng: 33.2048 });
  };

  const fetchDestinationAndCalculateRoute = async () => {
    setLoading(true);
    try {
      let dest = null;

      if (shopId) {
        // Fetch shop data
        const { data: shop } = await supabase
          .from('shops')
          .select('*')
          .eq('id', shopId)
          .single();

        if (shop) {
          const distKm = shop.distance ? parseFloat(shop.distance) : (Math.random() * 3 + 0.5).toFixed(1);
          dest = {
            name: shop.name,
            category: shop.category || 'Shop',
            address: shop.location || shop.address || 'Jinja City',
            rating: shop.rating || 4.5,
            reviews: shop.review_count || 0,
            isOpen: shop.is_open ?? true,
            isPartner: shop.is_anchor_partner || false,
            distance: distKm,
            lat: shop.latitude || 0.4390,
            lng: shop.longitude || 33.2030,
            imageIcon: 'storefront-outline',
          };
        }
      } else if (providerId) {
        // Fetch service provider data
        const { data: provider } = await supabase
          .from('users')
          .select('*')
          .eq('id', providerId)
          .eq('role', 'service_provider')
          .single();

        if (provider) {
          const distKm = (Math.random() * 3 + 0.5).toFixed(1);
          dest = {
            name: provider.full_name || provider.business_name || 'Service Provider',
            category: provider.category || 'Service Provider',
            address: provider.location || provider.address || 'Jinja City',
            rating: provider.rating || 4.5,
            reviews: provider.review_count || 0,
            isOpen: provider.is_open ?? true,
            isPartner: false,
            distance: distKm,
            lat: provider.latitude || 0.4380,
            lng: provider.longitude || 33.2040,
            imageIcon: 'person-outline',
          };
        }
      } else {
        // Fallback to a default destination
        dest = {
          name: 'Bright Electricals',
          category: 'Electrical Services',
          address: 'Plot 15, Main Street, Jinja City',
          rating: 4.9,
          reviews: 128,
          isOpen: true,
          isPartner: true,
          distance: '2.4',
          lat: 0.4390,
          lng: 33.2040,
          imageIcon: 'flash-outline',
        };
      }

      setDestination(dest);

      // Calculate mock routes based on distance
      const dist = parseFloat(dest.distance);
      const drivingTime = Math.round(dist * 3.5);
      const cyclingTime = Math.round(dist * 5);
      const walkingTime = Math.round(dist * 12);

      setTransports([
        { mode: 'driving', icon: 'car-outline', time: `${drivingTime} min`, distance: `${dist} km`, active: true },
        { mode: 'cycling', icon: 'bicycle-outline', time: `${cyclingTime} min`, distance: `${(dist * 1.1).toFixed(1)} km`, active: false },
        { mode: 'walking', icon: 'walk-outline', time: `${walkingTime} min`, distance: `${(dist * 0.9).toFixed(1)} km`, active: false },
      ]);

      // Traffic condition based on time of day (mock)
      const hour = new Date().getHours();
      let traffic = 'Light';
      if (hour >= 7 && hour <= 9) traffic = 'Heavy';
      else if (hour >= 16 && hour <= 19) traffic = 'Moderate';
      else if (hour >= 10 && hour <= 15) traffic = 'Light';

      setJourneySummary([
        { label: 'Time', value: `${drivingTime} min`, icon: 'time-outline' },
        { label: 'Distance', value: `${dist} km`, icon: 'map-outline' },
        { label: 'Traffic', value: traffic, icon: 'speedometer-outline' },
        { label: 'Route', value: 'Best', icon: 'sparkles-outline' },
      ]);

      // Generate turn-by-turn directions based on destination
      generateDirections(dest, dist);

    } catch (error) {
      console.error('Error fetching destination:', error);
    }
    setLoading(false);
  };

  const generateDirections = (dest, distKm) => {
    const baseDirections = [
      { icon: 'arrow-up-circle', color: '#1976D2', text: `Start – Head toward ${dest.name}`, distance: `${(distKm * 0.1).toFixed(0)} m` },
      { icon: 'arrow-redo-circle', color: '#006B3F', text: 'Turn right onto Main Road', distance: `${(distKm * 0.2).toFixed(0)} m` },
      { icon: 'arrow-up-circle', color: '#1976D2', text: 'Continue straight on Jinja Road', distance: `${(distKm * 0.4).toFixed(1)} km` },
      { icon: 'arrow-undo-circle', color: '#006B3F', text: `Turn left toward ${dest.address?.split(',')[0] || 'destination'}`, distance: `${(distKm * 0.2).toFixed(0)} m` },
      { icon: 'flag', color: '#D32F2F', text: `You have arrived – ${dest.name} will be on your left`, distance: '' },
    ];
    setDirections(baseDirections);
  };

  const handleTransportSelect = (mode) => {
    setSelectedTransport(mode);
    setTransports(prev => prev.map(t => ({ ...t, active: t.mode === mode })));
    
    // Update journey summary based on selected transport
    const selected = transports.find(t => t.mode === mode);
    if (selected) {
      setJourneySummary(prev => prev.map(item => {
        if (item.label === 'Time') return { ...item, value: selected.time };
        if (item.label === 'Distance') return { ...item, value: selected.distance };
        return item;
      }));
    }
  };

  const handleStartNavigation = () => {
    // In a real app, this would open Google Maps or Apple Maps
    if (destination) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
      // Linking.openURL(url) would go here with expo-linking
      alert(`Starting navigation to ${destination.name}...\n\nIn production, this would open Google Maps.`);
    }
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
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006B3F" />
          <Text style={styles.loadingText}>Calculating best route...</Text>
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
        {/* Title */}
        <Text style={styles.pageTitle}>Route Navigation</Text>
        <Text style={styles.pageSubtitle}>Navigate to {destination?.name || 'your destination'}</Text>

        {/* Location Cards */}
        <View style={styles.locationSection}>
          {/* Start */}
          <TouchableOpacity style={styles.locationCard} activeOpacity={0.7}>
            <View style={styles.locationDotLine}>
              <View style={[styles.locationDot, { backgroundColor: '#1976D2' }]} />
              <View style={styles.locationLine} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>My Location</Text>
              <Text style={styles.locationAddress}>{userLocation?.name || 'Jinja City, Uganda'}</Text>
            </View>
            <View style={styles.locationAction}>
              <Ionicons name="locate-outline" size={18} color="#006B3F" />
            </View>
          </TouchableOpacity>

          {/* Destination */}
          <TouchableOpacity style={styles.locationCard} activeOpacity={0.7}>
            <View style={styles.locationDotLine}>
              <View style={[styles.locationDot, { backgroundColor: '#D32F2F' }]} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>{destination?.name || 'Destination'}</Text>
              <Text style={styles.locationAddress}>{destination?.address || 'Jinja City'}</Text>
            </View>
            <View style={styles.locationAction}>
              <Ionicons name="swap-vertical-outline" size={18} color="#888" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Transport Selector */}
        <View style={styles.transportRow}>
          {transports.map((t) => (
            <TouchableOpacity
              key={t.mode}
              style={[styles.transportCard, t.active && styles.transportCardActive]}
              onPress={() => handleTransportSelect(t.mode)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={t.icon}
                size={22}
                color={t.active ? '#FFFFFF' : '#006B3F'}
              />
              <Text style={[styles.transportTime, t.active && styles.transportTimeActive]}>
                {t.time}
              </Text>
              <Text style={[styles.transportDistance, t.active && styles.transportDistanceActive]}>
                {t.distance}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Map Preview */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color="#006B3F" style={{ opacity: 0.4 }} />
            <Text style={styles.mapText}>Interactive Map</Text>
            <Text style={styles.mapSubtext}>{destination?.address || 'Jinja City Area'}</Text>
            
            {/* Route badge */}
            <View style={styles.routeBadge}>
              <Ionicons name={selectedTransport === 'walking' ? 'walk-outline' : selectedTransport === 'cycling' ? 'bicycle-outline' : 'car-outline'} size={12} color="#FFFFFF" />
              <Text style={styles.routeBadgeText}>
                {journeySummary[0].value} · {journeySummary[1].value}
              </Text>
            </View>

            {/* Map controls */}
            <View style={styles.mapControls}>
              <TouchableOpacity style={styles.mapControlBtn}>
                <Ionicons name="locate-outline" size={18} color="#555" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.mapControlBtn}>
                <Ionicons name="add" size={18} color="#555" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.mapControlBtn}>
                <Ionicons name="remove" size={18} color="#555" />
              </TouchableOpacity>
            </View>

            {/* Start/End markers on map */}
            <View style={styles.mapStartMarker}>
              <View style={styles.startDot} />
              <Text style={styles.mapMarkerLabel}>You</Text>
            </View>
            <View style={styles.mapEndMarker}>
              <View style={styles.endDot} />
              <Text style={styles.mapMarkerLabel}>{destination?.name?.split(' ')[0] || 'Dest'}</Text>
            </View>
          </View>
        </View>

        {/* Destination Info Card */}
        {destination && (
          <View style={styles.destCard}>
            <View style={styles.destTop}>
              <View style={styles.destImage}>
                <Ionicons name={destination.imageIcon} size={28} color="#006B3F" />
              </View>
              <View style={styles.destInfo}>
                <View style={styles.destNameRow}>
                  <Text style={styles.destName}>{destination.name}</Text>
                  {destination.isPartner && (
                    <Ionicons name="checkmark-circle" size={16} color="#006B3F" />
                  )}
                </View>
                <Text style={styles.destCategory}>{destination.category}</Text>
                <View style={styles.destMeta}>
                  <Ionicons name="star" size={12} color="#FFB300" />
                  <Text style={styles.destRating}>{destination.rating}</Text>
                  <Text style={styles.destReviews}>({destination.reviews} reviews)</Text>
                </View>
                <View style={styles.openBadge}>
                  <View style={[styles.openDot, { backgroundColor: destination.isOpen ? '#4CAF50' : '#D32F2F' }]} />
                  <Text style={[styles.openText, { color: destination.isOpen ? '#4CAF50' : '#D32F2F' }]}>
                    {destination.isOpen ? 'Open now' : 'Closed'}
                  </Text>
                </View>
              </View>
              <View style={styles.destActions}>
                <TouchableOpacity 
                  style={styles.viewProfileBtn}
                  onPress={() => {
                    if (shopId) navigation.navigate('ShopProfile', { shopId });
                    else if (providerId) navigation.navigate('ServiceProviderProfile', { providerId });
                  }}
                >
                  <Text style={styles.viewProfileText}>View Profile</Text>
                </TouchableOpacity>
                <View style={styles.quickActions}>
                  <TouchableOpacity style={styles.quickBtn}>
                    <Ionicons name="call-outline" size={18} color="#006B3F" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickBtn}>
                    <Ionicons name="chatbubble-outline" size={18} color="#006B3F" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.destAddress}>
              <Ionicons name="location-outline" size={14} color="#888" />
              <Text style={styles.destAddressText}>{destination.address}</Text>
            </View>
          </View>
        )}

        {/* Journey Summary */}
        <View style={styles.journeyRow}>
          {journeySummary.map((item, index) => (
            <View key={index} style={styles.journeyItem}>
              <Ionicons name={item.icon} size={18} color="#006B3F" />
              <Text style={styles.journeyValue}>{item.value}</Text>
              <Text style={styles.journeyLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Turn-by-Turn Directions */}
        <View style={styles.directionsCard}>
          <Text style={styles.directionsTitle}>Turn-by-Turn Directions</Text>
          {directions.map((step, index) => (
            <View key={index} style={styles.directionRow}>
              <View style={styles.directionIconContainer}>
                <Ionicons name={step.icon} size={22} color={step.color} />
              </View>
              <View style={styles.directionContent}>
                <Text style={styles.directionText}>{step.text}</Text>
              </View>
              {step.distance ? (
                <Text style={styles.directionDistance}>{step.distance}</Text>
              ) : null}
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.startNavBtn}
            onPress={handleStartNavigation}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate-outline" size={20} color="#FFFFFF" />
            <Text style={styles.startNavText}>Start Navigation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={20} color="#006B3F" />
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  locationSection: { marginBottom: 14 },
  locationCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, marginBottom: 4,
  },
  locationDotLine: { alignItems: 'center', marginRight: 12, width: 20 },
  locationDot: { width: 12, height: 12, borderRadius: 6 },
  locationLine: { width: 2, height: 24, backgroundColor: '#E0E0E0', marginTop: -2 },
  locationInfo: { flex: 1 },
  locationLabel: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 2 },
  locationAddress: { fontSize: 12, color: '#888' },
  locationAction: { padding: 4 },
  transportRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  transportCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12,
    borderWidth: 1.5, borderColor: '#ECECEC',
  },
  transportCardActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  transportTime: { fontSize: 14, fontWeight: '800', color: '#006B3F', marginTop: 4 },
  transportTimeActive: { color: '#FFFFFF' },
  transportDistance: { fontSize: 11, color: '#888', marginTop: 2 },
  transportDistanceActive: { color: 'rgba(255,255,255,0.8)' },
  mapContainer: {
    height: 200, backgroundColor: '#E8F5E9', borderRadius: 18, marginBottom: 16,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
    overflow: 'hidden',
  },
  mapPlaceholder: { alignItems: 'center' },
  mapText: { fontSize: 18, fontWeight: '700', color: '#006B3F', marginTop: 8 },
  mapSubtext: { fontSize: 12, color: '#006B3F', fontWeight: '500', marginTop: 4 },
  routeBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#006B3F', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, gap: 4,
  },
  routeBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  mapControls: {
    position: 'absolute', right: 10, top: 40, gap: 6,
  },
  mapControlBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  mapStartMarker: {
    position: 'absolute', bottom: 30, left: 30, alignItems: 'center',
  },
  startDot: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: '#1976D2',
    borderWidth: 3, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3,
  },
  mapEndMarker: {
    position: 'absolute', bottom: 60, right: 40, alignItems: 'center',
  },
  endDot: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: '#D32F2F',
    borderWidth: 3, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3,
  },
  mapMarkerLabel: { fontSize: 9, fontWeight: '700', color: '#555', marginTop: 2 },
  destCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  destTop: { flexDirection: 'row' },
  destImage: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  destInfo: { flex: 1 },
  destNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  destName: { fontSize: 15, fontWeight: '800', color: '#212121' },
  destCategory: { fontSize: 11, color: '#888', marginBottom: 4 },
  destMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  destRating: { fontSize: 12, fontWeight: '600', color: '#555' },
  destReviews: { fontSize: 11, color: '#888' },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openText: { fontSize: 11, fontWeight: '600' },
  destActions: { alignItems: 'flex-end', gap: 6 },
  viewProfileBtn: {
    borderWidth: 1.5, borderColor: '#006B3F',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  viewProfileText: { fontSize: 11, fontWeight: '700', color: '#006B3F' },
  quickActions: { flexDirection: 'row', gap: 6 },
  quickBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  destAddress: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  destAddressText: { fontSize: 12, color: '#888' },
  journeyRow: {
    flexDirection: 'row', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12, marginBottom: 16,
  },
  journeyItem: { flex: 1, alignItems: 'center', gap: 2 },
  journeyValue: { fontSize: 13, fontWeight: '800', color: '#212121' },
  journeyLabel: { fontSize: 9, color: '#888', fontWeight: '500' },
  directionsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  directionsTitle: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 14 },
  directionRow: {
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10,
  },
  directionIconContainer: { width: 28, alignItems: 'center' },
  directionContent: { flex: 1 },
  directionText: { fontSize: 13, color: '#555', lineHeight: 18 },
  directionDistance: { fontSize: 12, fontWeight: '700', color: '#006B3F', marginLeft: 4 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  startNavBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#006B3F', paddingVertical: 14, borderRadius: 25, gap: 8,
  },
  startNavText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  shareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#006B3F', paddingVertical: 14, borderRadius: 25, gap: 6,
  },
  shareText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
});