import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import LogoImage from '../../assets/logo.png';

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
  lightBg: '#EEF3FF',
  greenBg: '#E8F5E9',
};

export default function RouteNavigation({ navigation, route }) {
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState('driving');
  const [userLocation, setUserLocation] = useState(null);

  const shopId = route?.params?.shopId || null;
  const providerId = route?.params?.providerId || null;

  const [transports, setTransports] = useState([
    { mode: 'driving', icon: 'car-outline', time: '-- min', distance: '-- km', active: true },
    { mode: 'cycling', icon: 'bicycle-outline', time: '-- min', distance: '-- km', active: false },
    { mode: 'walking', icon: 'walk-outline', time: '-- min', distance: '-- km', active: false },
  ]);

  const [journeySummary, setJourneySummary] = useState([
    { label: 'Time', value: '--', icon: 'time-outline' },
    { label: 'Distance', value: '--', icon: 'map-outline' },
    { label: 'Traffic', value: 'Checking...', icon: 'speedometer-outline' },
    { label: 'Route', value: 'Best', icon: 'sparkles-outline' },
  ]);

  const [directions, setDirections] = useState([]);

  useEffect(() => { fetchDestinationAndCalculateRoute(); }, []);

  const fetchDestinationAndCalculateRoute = async () => {
    setLoading(true);
    try {
      let dest = null;
      if (shopId) {
        const { data: shop } = await supabase.from('shops').select('*').eq('id', shopId).maybeSingle();
        if (shop) { const d = parseFloat(shop.distance) || (Math.random() * 3 + 0.5).toFixed(1); dest = { name: shop.name, category: shop.category || 'Shop', address: shop.address || 'Jinja City', rating: Number(shop.rating || 4.5), reviews: shop.review_count || 0, isOpen: shop.is_open ?? true, isPartner: shop.is_anchor_partner || false, distance: d, imageIcon: 'storefront-outline' }; }
      } else if (providerId) {
        const { data: provider } = await supabase.from('users').select('id, full_name').eq('id', providerId).maybeSingle();
        if (provider) { const d = (Math.random() * 3 + 0.5).toFixed(1); dest = { name: provider.full_name || 'Provider', category: 'Service Provider', address: 'Jinja City', rating: 4.5, reviews: 0, isOpen: true, isPartner: false, distance: d, imageIcon: 'person-outline' }; }
      }
      if (!dest) dest = { name: 'Bright Electricals', category: 'Electrical Services', address: 'Plot 15, Main Street, Jinja City', rating: 4.9, reviews: 128, isOpen: true, isPartner: true, distance: '2.4', imageIcon: 'flash-outline' };
      setDestination(dest);

      const dist = parseFloat(dest.distance);
      const dt = Math.round(dist * 3.5), ct = Math.round(dist * 5), wt = Math.round(dist * 12);
      setTransports([{ mode: 'driving', icon: 'car-outline', time: `${dt} min`, distance: `${dist} km`, active: true },{ mode: 'cycling', icon: 'bicycle-outline', time: `${ct} min`, distance: `${(dist*1.1).toFixed(1)} km`, active: false },{ mode: 'walking', icon: 'walk-outline', time: `${wt} min`, distance: `${(dist*0.9).toFixed(1)} km`, active: false }]);
      const hour = new Date().getHours(); let traffic = 'Light'; if (hour>=7&&hour<=9) traffic='Heavy'; else if (hour>=16&&hour<=19) traffic='Moderate';
      setJourneySummary([{ label: 'Time', value: `${dt} min`, icon: 'time-outline' },{ label: 'Distance', value: `${dist} km`, icon: 'map-outline' },{ label: 'Traffic', value: traffic, icon: 'speedometer-outline' },{ label: 'Route', value: 'Best', icon: 'sparkles-outline' }]);
      setDirections([{ icon: 'arrow-up-circle', color: '#1976D2', text: `Start – Head toward ${dest.name}`, distance: `${(dist*0.1).toFixed(0)} m` },{ icon: 'arrow-redo-circle', color: C.primary, text: 'Turn right onto Main Road', distance: `${(dist*0.2).toFixed(0)} m` },{ icon: 'arrow-up-circle', color: '#1976D2', text: 'Continue straight on Jinja Road', distance: `${(dist*0.4).toFixed(1)} km` },{ icon: 'arrow-undo-circle', color: C.primary, text: `Turn left toward ${dest.address?.split(',')[0]||'destination'}`, distance: `${(dist*0.2).toFixed(0)} m` },{ icon: 'flag', color: C.danger, text: `You have arrived – ${dest.name}`, distance: '' }]);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleTransportSelect = (mode) => { setSelectedTransport(mode); setTransports(prev => prev.map(t=>({...t,active:t.mode===mode}))); const s = transports.find(t=>t.mode===mode); if(s) setJourneySummary(prev=>prev.map(i=>({...i,value:i.label==='Time'?s.time:i.label==='Distance'?s.distance:i.value}))); };

  if (loading) return (<View style={styles.container}><View style={styles.header}><TouchableOpacity onPress={()=>navigation.goBack()}><Ionicons name="arrow-back" size={24} color={C.text}/></TouchableOpacity><Image source={LogoImage} style={styles.headerLogo} resizeMode="contain"/></View><View style={styles.loadingContainer}><ActivityIndicator size="large" color={C.accent}/></View></View>);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()}><Ionicons name="arrow-back" size={24} color={C.text}/></TouchableOpacity>
        <Image source={LogoImage} style={styles.headerLogo} resizeMode="contain"/>
        <TouchableOpacity onPress={()=>navigation.navigate('Notifications')}><Ionicons name="notifications-outline" size={24} color={C.text}/><View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Route Navigation</Text>
        <Text style={styles.pageSubtitle}>Navigate to {destination?.name||'destination'}</Text>

        <View style={styles.locationSection}>
          <View style={styles.locationCard}><View style={styles.locationDotLine}><View style={[styles.locationDot,{backgroundColor:'#1976D2'}]}/><View style={styles.locationLine}/></View><View style={styles.locationInfo}><Text style={styles.locationLabel}>My Location</Text><Text style={styles.locationAddress}>Jinja City, Uganda</Text></View></View>
          <View style={styles.locationCard}><View style={styles.locationDotLine}><View style={[styles.locationDot,{backgroundColor:C.danger}]}/></View><View style={styles.locationInfo}><Text style={styles.locationLabel}>{destination?.name||'Destination'}</Text><Text style={styles.locationAddress}>{destination?.address||'Jinja City'}</Text></View></View>
        </View>

        <View style={styles.transportRow}>{transports.map(t=>(<TouchableOpacity key={t.mode} style={[styles.transportCard,t.active&&styles.transportCardActive]} onPress={()=>handleTransportSelect(t.mode)}><Ionicons name={t.icon} size={22} color={t.active?C.white:C.accent}/><Text style={[styles.transportTime,t.active&&styles.transportTimeActive]}>{t.time}</Text><Text style={[styles.transportDistance,t.active&&styles.transportDistanceActive]}>{t.distance}</Text></TouchableOpacity>))}</View>

        <View style={styles.mapContainer}><View style={styles.mapPlaceholder}><Ionicons name="map-outline" size={48} color={C.accent} style={{opacity:0.4}}/><Text style={styles.mapText}>Interactive Map</Text><View style={styles.routeBadge}><Ionicons name={selectedTransport==='walking'?'walk-outline':selectedTransport==='cycling'?'bicycle-outline':'car-outline'} size={12} color={C.white}/><Text style={styles.routeBadgeText}>{journeySummary[0].value} · {journeySummary[1].value}</Text></View></View></View>

        {destination&&(<View style={styles.destCard}><View style={styles.destTop}><View style={styles.destImage}><Ionicons name={destination.imageIcon} size={28} color={C.accent}/></View><View style={styles.destInfo}><View style={styles.destNameRow}><Text style={styles.destName}>{destination.name}</Text>{destination.isPartner&&<Ionicons name="checkmark-circle" size={16} color={C.accent}/>}</View><Text style={styles.destCategory}>{destination.category}</Text><View style={styles.destMeta}><Ionicons name="star" size={12} color="#FFB300"/><Text style={styles.destRating}>{destination.rating}</Text></View></View></View><View style={styles.destAddress}><Ionicons name="location-outline" size={14} color={C.muted}/><Text style={styles.destAddressText}>{destination.address}</Text></View></View>)}

        <View style={styles.journeyRow}>{journeySummary.map((item,i)=>(<View key={i} style={styles.journeyItem}><Ionicons name={item.icon} size={18} color={C.accent}/><Text style={styles.journeyValue}>{item.value}</Text><Text style={styles.journeyLabel}>{item.label}</Text></View>))}</View>

        <View style={styles.directionsCard}><Text style={styles.directionsTitle}>Directions</Text>{directions.map((step,i)=>(<View key={i} style={styles.directionRow}><Ionicons name={step.icon} size={22} color={step.color}/><View style={styles.directionContent}><Text style={styles.directionText}>{step.text}</Text></View>{step.distance?<Text style={styles.directionDistance}>{step.distance}</Text>:null}</View>))}</View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.startNavBtn}><Ionicons name="navigate-outline" size={20} color={C.white}/><Text style={styles.startNavText}>Start Navigation</Text></TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn}><Ionicons name="share-outline" size={20} color={C.accent}/><Text style={styles.shareText}>Share</Text></TouchableOpacity>
        </View>
        <View style={{height:40}}/>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12, backgroundColor: C.white },
  headerLogo: { width: 110, height: 28, resizeMode: 'contain' },
  headerIcon: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: C.danger, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: C.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: C.muted, marginBottom: 16 },
  locationSection: { marginBottom: 14 },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 4, borderWidth: 1, borderColor: C.border },
  locationDotLine: { alignItems: 'center', marginRight: 12, width: 20 },
  locationDot: { width: 12, height: 12, borderRadius: 6 },
  locationLine: { width: 2, height: 24, backgroundColor: C.border, marginTop: -2 },
  locationInfo: { flex: 1 },
  locationLabel: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  locationAddress: { fontSize: 12, color: C.muted },
  transportRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  transportCard: { flex: 1, alignItems: 'center', backgroundColor: C.white, borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: C.border },
  transportCardActive: { backgroundColor: C.accent, borderColor: C.accent },
  transportTime: { fontSize: 14, fontWeight: '800', color: C.accent, marginTop: 4 },
  transportTimeActive: { color: C.white },
  transportDistance: { fontSize: 11, color: C.muted, marginTop: 2 },
  transportDistanceActive: { color: 'rgba(255,255,255,0.8)' },
  mapContainer: { height: 200, backgroundColor: C.lightBg, borderRadius: 18, marginBottom: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  mapPlaceholder: { alignItems: 'center' },
  mapText: { fontSize: 18, fontWeight: '700', color: C.accent, marginTop: 8 },
  routeBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: C.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, gap: 4 },
  routeBadgeText: { fontSize: 11, fontWeight: '700', color: C.white },
  destCard: { backgroundColor: C.white, borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  destTop: { flexDirection: 'row' },
  destImage: { width: 56, height: 56, borderRadius: 14, backgroundColor: C.lightBg, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  destInfo: { flex: 1 },
  destNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  destName: { fontSize: 15, fontWeight: '800', color: C.text },
  destCategory: { fontSize: 11, color: C.muted, marginBottom: 4 },
  destMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  destRating: { fontSize: 12, fontWeight: '600', color: '#555' },
  destAddress: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  destAddressText: { fontSize: 12, color: C.muted },
  journeyRow: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  journeyItem: { flex: 1, alignItems: 'center', gap: 2 },
  journeyValue: { fontSize: 13, fontWeight: '800', color: C.text },
  journeyLabel: { fontSize: 9, color: C.muted, fontWeight: '500' },
  directionsCard: { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: C.border },
  directionsTitle: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 14 },
  directionRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  directionContent: { flex: 1 },
  directionText: { fontSize: 13, color: '#555', lineHeight: 18 },
  directionDistance: { fontSize: 12, fontWeight: '700', color: C.accent, marginLeft: 4 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  startNavBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.accent, paddingVertical: 14, borderRadius: 25, gap: 8 },
  startNavText: { fontSize: 14, fontWeight: '700', color: C.white },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.accent, paddingVertical: 14, borderRadius: 25, gap: 6 },
  shareText: { fontSize: 13, fontWeight: '700', color: C.accent },
});