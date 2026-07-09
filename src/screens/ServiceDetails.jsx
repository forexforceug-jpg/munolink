import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Image,
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
  warning: '#FF9800',
  lightBg: '#EEF3FF',
  greenBg: '#E8F5E9',
};

export default function ServiceDetails({ navigation, route }) {
  const serviceId = route?.params?.serviceId || null;
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState(null);
  const [providers, setProviders] = useState([]);

  useEffect(() => { if (serviceId) fetchServiceData(); }, [serviceId]);

  const fetchServiceData = async () => {
    setLoading(true);
    try {
      const { data: serviceData } = await supabase.from('service_catalog').select('*').eq('id', serviceId).single();
      if (serviceData) setService(serviceData);
      const { data: psData } = await supabase.from('provider_services').select('id, user_id, price, is_active').eq('service_id', serviceId).eq('is_active', true);
      if (psData?.length) {
        const userIds = [...new Set(psData.map(p => p.user_id))];
        const { data: usersData } = await supabase.from('users').select('id, full_name').in('id', userIds);
        const userMap = {}; if (usersData) usersData.forEach(u => { userMap[u.id] = u; });
        setProviders(psData.map(p => ({ id: p.id, providerId: p.user_id, providerName: userMap[p.user_id]?.full_name || 'Provider', price: Number(p.price), rating: 4.0 + Math.random() * 1.0, reviews: Math.floor(Math.random() * 200) + 10, distance: `${(Math.random() * 3 + 0.3).toFixed(1)} km`, jobsCompleted: Math.floor(Math.random() * 500) + 50 })).sort((a, b) => a.price - b.price));
      }
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  if (loading) return (<View style={styles.container}><View style={styles.header}><Image source={LogoImage} style={styles.headerLogo} resizeMode="contain" /></View><View style={styles.loadingContainer}><ActivityIndicator size="large" color={C.accent} /></View></View>);
  if (!service) return (<View style={styles.container}><View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity><Image source={LogoImage} style={styles.headerLogo} resizeMode="contain" /><View style={{width:24}}/></View><View style={styles.loadingContainer}><Ionicons name="construct-outline" size={48} color={C.muted} /><Text style={{color:C.muted,marginTop:10}}>Service not found</Text></View></View>);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Image source={LogoImage} style={styles.headerLogo} resizeMode="contain" />
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}><Ionicons name="notifications-outline" size={24} color={C.text} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceImage}>{service.images?.[0] ? <Image source={{ uri: service.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Ionicons name="construct-outline" size={48} color={C.accent} />}</View>
          <View style={styles.serviceInfo}>
            <View style={styles.categoryBadge}><Text style={styles.categoryText}>{service.category}</Text></View>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDescription}>{service.description || 'No description available.'}</Text>
            {service.duration && (<View style={styles.durationRow}><Ionicons name="time-outline" size={14} color={C.muted} /><Text style={styles.durationText}>{service.duration}</Text></View>)}
          </View>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{providers.length} Provider{providers.length !== 1 ? 's' : ''} Available</Text></View>

        {providers.length === 0 ? (<View style={styles.emptyState}><Ionicons name="people-outline" size={48} color="#CCC" /><Text style={styles.emptyText}>No providers available yet.</Text></View>) : providers.map((provider, index) => (
          <TouchableOpacity key={provider.id} style={[styles.providerCard, index === 0 && styles.providerCardBest]} onPress={() => navigation.navigate('ServiceProviderProfile', { providerId: provider.providerId })} activeOpacity={0.7}>
            {index === 0 && (<View style={styles.bestPriceBadge}><Ionicons name="pricetag" size={10} color={C.white} /><Text style={styles.bestPriceText}>Best Price</Text></View>)}
            <View style={styles.providerTop}>
              <View style={styles.providerAvatar}><Text style={styles.providerInitial}>{provider.providerName.charAt(0)}</Text></View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.providerName}</Text>
                <View style={styles.providerMeta}><Ionicons name="star" size={12} color="#FFB300" /><Text style={styles.providerRating}>{provider.rating.toFixed(1)}</Text><Text style={styles.providerReviews}>({provider.reviews} reviews)</Text></View>
                <View style={styles.providerMeta}><Ionicons name="location-outline" size={12} color={C.muted} /><Text style={styles.providerDistance}>{provider.distance}</Text><Text style={styles.providerJobs}>· {provider.jobsCompleted} jobs</Text></View>
              </View>
              <View style={styles.providerPrice}><Text style={styles.priceLabel}>From</Text><Text style={styles.priceValue}>UGX {provider.price.toLocaleString()}</Text></View>
            </View>
            <View style={styles.providerActions}>
              <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('BookService', { providerId: provider.providerId, providerName: provider.providerName })}><Ionicons name="calendar-outline" size={16} color={C.white} /><Text style={styles.bookBtnText}>Book Now</Text></TouchableOpacity>
              <TouchableOpacity style={styles.viewProfileBtn} onPress={() => navigation.navigate('ServiceProviderProfile', { providerId: provider.providerId })}><Text style={styles.viewProfileText}>View Profile</Text></TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {service.tags?.length > 0 && (<View style={styles.tagsSection}><Text style={styles.sectionTitle}>Related Tags</Text><View style={styles.tagsRow}>{service.tags.map((tag, i) => (<View key={i} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>))}</View></View>)}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12, backgroundColor: C.white },
  headerLogo: { width: 110, height: 30, resizeMode: 'contain' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  serviceHeader: { flexDirection: 'row', gap: 14, marginBottom: 22 },
  serviceImage: { width: 120, height: 120, borderRadius: 16, backgroundColor: C.background, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  serviceInfo: { flex: 1 },
  categoryBadge: { backgroundColor: C.lightBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
  categoryText: { fontSize: 10, fontWeight: '700', color: C.accent },
  serviceName: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 4 },
  serviceDescription: { fontSize: 12, color: C.muted, lineHeight: 18, marginBottom: 6 },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durationText: { fontSize: 12, color: C.muted },
  sectionHeader: { marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: C.muted, marginTop: 10 },
  providerCard: { backgroundColor: C.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border, position: 'relative' },
  providerCardBest: { borderColor: C.accent, borderWidth: 2 },
  bestPriceBadge: { position: 'absolute', top: -8, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: C.primary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, gap: 4 },
  bestPriceText: { fontSize: 9, fontWeight: '700', color: C.white },
  providerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  providerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.lightBg, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  providerInitial: { fontSize: 18, fontWeight: '800', color: C.accent },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  providerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  providerRating: { fontSize: 11, fontWeight: '600', color: '#555' },
  providerReviews: { fontSize: 11, color: C.muted },
  providerDistance: { fontSize: 11, color: C.muted },
  providerJobs: { fontSize: 11, color: C.accent, fontWeight: '500' },
  providerPrice: { alignItems: 'flex-end' },
  priceLabel: { fontSize: 9, color: C.muted },
  priceValue: { fontSize: 16, fontWeight: '800', color: C.primary },
  providerActions: { flexDirection: 'row', gap: 8 },
  bookBtn: { flex: 1, flexDirection: 'row', backgroundColor: C.accent, paddingVertical: 10, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 6 },
  bookBtnText: { fontSize: 13, fontWeight: '700', color: C.white },
  viewProfileBtn: { flex: 1, borderWidth: 1.5, borderColor: C.accent, paddingVertical: 10, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  viewProfileText: { fontSize: 13, fontWeight: '700', color: C.accent },
  tagsSection: { marginTop: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: C.lightBg },
  tagText: { fontSize: 11, fontWeight: '600', color: C.accent },
});