import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RouteNavigation({ navigation }) {
  const [selectedTransport, setSelectedTransport] = useState('driving');

  const transports = [
    { mode: 'driving', icon: 'car-outline', time: '8 min', distance: '2.4 km', active: true },
    { mode: 'cycling', icon: 'bicycle-outline', time: '12 min', distance: '2.6 km', active: false },
    { mode: 'walking', icon: 'walk-outline', time: '28 min', distance: '2.2 km', active: false },
  ];

  const directions = [
    { icon: 'arrow-up-circle', color: '#1976D2', text: 'Start – Head north on Jinja Main Street', distance: '30 m' },
    { icon: 'arrow-redo-circle', color: '#006B3F', text: 'Turn right onto Nile View Road', distance: '450 m' },
    { icon: 'arrow-up-circle', color: '#1976D2', text: 'Continue straight onto Busoga Road', distance: '1.2 km' },
    { icon: 'arrow-undo-circle', color: '#006B3F', text: 'Turn left onto Main Street', distance: '550 m' },
    { icon: 'flag', color: '#D32F2F', text: 'You have arrived – Bright Electricals will be on your left', distance: '' },
  ];

  const journeySummary = [
    { label: 'Time', value: '8 min', icon: 'time-outline' },
    { label: 'Distance', value: '2.4 km', icon: 'map-outline' },
    { label: 'Traffic', value: 'Light', icon: 'speedometer-outline' },
    { label: 'Route', value: 'Best', icon: 'sparkles-outline' },
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
            <Text style={styles.tagline}>For Better Connections</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>5</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity>
            <View style={styles.profilePic}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
              <View style={styles.onlineDot} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.pageTitle}>Route Navigation</Text>
        <Text style={styles.pageSubtitle}>Navigate easily to your destination.</Text>

        {/* Location Cards */}
        <View style={styles.locationSection}>
          {/* Start */}
          <View style={styles.locationCard}>
            <View style={styles.locationDotLine}>
              <View style={[styles.locationDot, { backgroundColor: '#1976D2' }]} />
              <View style={styles.locationLine} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>My Location</Text>
              <Text style={styles.locationAddress}>Jinja City, Uganda</Text>
            </View>
            <TouchableOpacity style={styles.locationAction}>
              <Ionicons name="locate-outline" size={18} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Destination */}
          <View style={styles.locationCard}>
            <View style={styles.locationDotLine}>
              <View style={[styles.locationDot, { backgroundColor: '#D32F2F' }]} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Bright Electricals</Text>
              <Text style={styles.locationAddress}>Plot 15, Main Street, Jinja City</Text>
            </View>
            <TouchableOpacity style={styles.locationAction}>
              <Ionicons name="swap-vertical-outline" size={18} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Transport Selector */}
        <View style={styles.transportRow}>
          {transports.map((t) => (
            <TouchableOpacity
              key={t.mode}
              style={[styles.transportCard, selectedTransport === t.mode && styles.transportCardActive]}
              onPress={() => setSelectedTransport(t.mode)}
            >
              <Ionicons
                name={t.icon}
                size={22}
                color={selectedTransport === t.mode ? '#FFFFFF' : '#006B3F'}
              />
              <Text style={[styles.transportTime, selectedTransport === t.mode && styles.transportTimeActive]}>
                {t.time}
              </Text>
              <Text style={[styles.transportDistance, selectedTransport === t.mode && styles.transportDistanceActive]}>
                {t.distance}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>📍 Interactive Map</Text>
            <Text style={styles.mapSubtext}>Jinja City Area</Text>
            {/* Route badge */}
            <View style={styles.routeBadge}>
              <Ionicons name="car-outline" size={12} color="#FFFFFF" />
              <Text style={styles.routeBadgeText}>8 min · 2.4 km</Text>
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
          </View>
        </View>

        {/* Destination Info Card */}
        <View style={styles.destCard}>
          <View style={styles.destTop}>
            <View style={styles.destImage}>
              <Ionicons name="flash-outline" size={28} color="#006B3F" />
            </View>
            <View style={styles.destInfo}>
              <View style={styles.destNameRow}>
                <Text style={styles.destName}>Bright Electricals</Text>
                <Ionicons name="checkmark-circle" size={16} color="#006B3F" />
              </View>
              <Text style={styles.destCategory}>Electrical Services</Text>
              <View style={styles.destMeta}>
                <Ionicons name="star" size={12} color="#FFB300" />
                <Text style={styles.destRating}>4.9</Text>
                <Text style={styles.destReviews}>(128 reviews)</Text>
              </View>
              <View style={styles.openBadge}>
                <View style={styles.openDot} />
                <Text style={styles.openText}>Open now</Text>
              </View>
            </View>
            <View style={styles.destActions}>
              <TouchableOpacity style={styles.viewProfileBtn}>
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
            <Text style={styles.destAddressText}>Plot 15, Main Street, Jinja City</Text>
          </View>
        </View>

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
              <Ionicons name={step.icon} size={22} color={step.color} />
              <Text style={styles.directionText}>{step.text}</Text>
              {step.distance ? (
                <Text style={styles.directionDistance}>{step.distance}</Text>
              ) : null}
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.startNavBtn}>
            <Ionicons name="navigate-outline" size={20} color="#FFFFFF" />
            <Text style={styles.startNavText}>Start Navigation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn}>
            <Ionicons name="share-outline" size={20} color="#006B3F" />
            <Text style={styles.shareText}>Share Route</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="grid-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Connections</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Messages')}>
          <Ionicons name="chatbubbles-outline" size={22} color="#888" />
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>3</Text>
          </View>
          <Text style={styles.navLabel}>Messages</Text>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 9, color: '#888' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { position: 'relative' },
  notifBadge: {
    position: 'absolute', top: -4, right: -6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
  },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  profilePic: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#FFFFFF',
  },
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
  },
  mapPlaceholder: { alignItems: 'center' },
  mapText: { fontSize: 18, fontWeight: '700', color: '#006B3F' },
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
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  openText: { fontSize: 11, fontWeight: '600', color: '#4CAF50' },
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
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10,
  },
  directionText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 18 },
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
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  navItem: { alignItems: 'center', gap: 2, position: 'relative' },
  navBadge: {
    position: 'absolute', top: -6, right: 6,
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
  },
  navBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
});