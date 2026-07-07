import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function BookService({ navigation, route }) {
  const { user } = useAuth();
  const providerId = route?.params?.providerId || null;
  const providerName = route?.params?.providerName || 'Service Provider';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [description, setDescription] = useState('');

  const dates = ['Today', 'Tomorrow', 'In 2 Days', 'In 3 Days'];
  const times = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

  const inspectionFee = 20000;
  const selectedServicePrice = selectedService?.price || 0;
  const discountPercent = 5;
  const discountAmount = Math.round(selectedServicePrice * discountPercent / 100);
  const estimatedTotal = selectedServicePrice - discountAmount + inspectionFee;

  useEffect(() => { fetchProviderAndServices(); }, [providerId]);

  const fetchProviderAndServices = async () => {
    setLoading(true);
    try {
      if (!providerId) {
        setProvider({ id: 'demo', name: providerName || 'Service Provider', rating: 4.5, reviews: 100, distance: '1.0 km', location: 'Jinja City' });
        setServices([]);
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users').select('id, full_name').eq('id', providerId).maybeSingle();

      if (userError || !userData) { setLoading(false); return; }

      const { data: psData } = await supabase
        .from('provider_services').select('id, price, service_id').eq('user_id', providerId).eq('is_active', true);

      let serviceDetails = [];
      if (psData && psData.length > 0) {
        const serviceIds = [...new Set(psData.map(ps => ps.service_id))];
        const { data: catalogData } = await supabase.from('service_catalog').select('id, name, category').in('id', serviceIds);
        const catalogMap = {}; if (catalogData) catalogData.forEach(c => { catalogMap[c.id] = c; });

        const iconMap = {
          'Plumbing': 'water-outline', 'Electrical': 'flash-outline', 'Beauty': 'cut-outline',
          'Healthcare': 'medkit-outline', 'Education': 'school-outline', 'Transport': 'car-outline',
          'Cleaning': 'sparkles-outline', 'Automotive': 'construct-outline', 'Events': 'calendar-outline',
        };

        serviceDetails = psData.map(ps => {
          const catalog = catalogMap[ps.service_id];
          return { id: ps.id, serviceName: catalog?.name || 'Service', category: catalog?.category || 'General', price: Number(ps.price), icon: iconMap[catalog?.category] || 'apps-outline' };
        });
      }

      setProvider({
        id: userData.id, name: userData.full_name || providerName,
        rating: 4.0 + Math.random() * 1.0, reviews: Math.floor(Math.random() * 200) + 10,
        distance: `${(Math.random() * 3 + 0.3).toFixed(1)} km`, location: 'Jinja City',
      });
      setServices(serviceDetails);
      if (serviceDetails.length > 0) setSelectedService(serviceDetails[0]);
    } catch (error) { console.error('fetchProviderAndServices error:', error); }
    setLoading(false);
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to book a service.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('SignIn') },
      ]);
      return;
    }
    if (!selectedService) { Alert.alert('Select Service', 'Please choose a service.'); return; }

    setSubmitting(true);
    const reference = 'BKG-' + Date.now().toString().slice(-8);

    console.log('Inserting booking:', { user_id: user.id, type: 'service_booking', amount: estimatedTotal, reference });

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'service_booking',
        amount: estimatedTotal,
        discount_applied: discountAmount,
        status: 'pending',
        reference: reference,
      })
      .select()
      .single();

    console.log('Booking response:', { success: !!data, error: error?.message, errorDetails: error?.details, errorCode: error?.code });

    setSubmitting(false);

    if (error) {
      Alert.alert('Error', 'Failed to create booking: ' + (error.details || error.message));
      return;
    }

    if (data) {
      navigation.navigate('BookingConfirmed', {
        booking: {
          id: data.reference || reference,
          provider: provider.name,
          service: selectedService.serviceName,
          date: selectedDate,
          time: selectedTime,
          amount: estimatedTotal,
          savings: discountAmount,
        },
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#212121" /></TouchableOpacity><View><Text style={styles.headerTitle}>Book Service</Text></View><View style={{ width: 24 }} /></View>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#006B3F" /><Text style={styles.loadingText}>Loading services...</Text></View>
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#212121" /></TouchableOpacity><View><Text style={styles.headerTitle}>Book Service</Text></View><View style={{ width: 24 }} /></View>
        <View style={styles.loadingContainer}><Ionicons name="person-outline" size={48} color="#CCC" /><Text style={styles.loadingText}>Provider not found</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#212121" /></TouchableOpacity>
        <View><Text style={styles.headerTitle}>Book Service</Text><Text style={styles.headerSubtitle}>{provider?.name}</Text></View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}><Ionicons name="notifications-outline" size={24} color="#212121" /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.providerCard}>
          <View style={styles.providerPhoto}><Text style={styles.providerInitial}>{provider.name.charAt(0)}</Text></View>
          <View style={styles.providerInfo}>
            <View style={styles.providerNameRow}><Text style={styles.providerName}>{provider.name}</Text><Ionicons name="checkmark-circle" size={14} color="#006B3F" /></View>
            <View style={styles.providerMeta}><Ionicons name="star" size={12} color="#FFB300" /><Text style={styles.providerRating}>{provider.rating.toFixed(1)}</Text><Text style={styles.providerReviews}>({provider.reviews} reviews)</Text></View>
            <View style={styles.providerLocationRow}><Ionicons name="location-outline" size={12} color="#888" /><Text style={styles.providerLocation}>{provider.distance} away · {provider.location}</Text></View>
            <TouchableOpacity style={styles.viewProfileLink} onPress={() => navigation.navigate('ServiceProviderProfile', { providerId: provider.id })}><Text style={styles.viewProfileText}>View full profile</Text><Ionicons name="arrow-forward" size={12} color="#006B3F" /></TouchableOpacity>
          </View>
        </View>

        <View style={styles.stepHeader}><View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View><Text style={styles.stepTitle}>Choose Service</Text><Text style={styles.stepCount}>{services.length} available</Text></View>

        {services.length === 0 ? (
          <View style={styles.emptyServices}><Ionicons name="construct-outline" size={32} color="#CCC" /><Text style={styles.emptyServicesText}>No services available</Text></View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesScroll}>
            {services.map((service) => (
              <TouchableOpacity key={service.id} style={[styles.serviceCard, selectedService?.id === service.id && styles.serviceCardActive]} onPress={() => setSelectedService(service)} activeOpacity={0.7}>
                <View style={[styles.serviceIcon, selectedService?.id === service.id && styles.serviceIconActive]}><Ionicons name={service.icon} size={22} color={selectedService?.id === service.id ? '#FFFFFF' : '#006B3F'} /></View>
                <Text style={[styles.serviceName, selectedService?.id === service.id && styles.serviceNameActive]} numberOfLines={2}>{service.serviceName}</Text>
                <View style={styles.serviceCategoryTag}><Text style={styles.serviceCategoryText}>{service.category}</Text></View>
                <Text style={styles.servicePrice}>UGX {service.price.toLocaleString()}</Text>
                {selectedService?.id === service.id && <View style={styles.selectedCheck}><Ionicons name="checkmark-circle" size={20} color="#006B3F" /></View>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.stepHeader}><View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View><Text style={styles.stepTitle}>Select Date & Time</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
          {dates.map((date) => (
            <TouchableOpacity key={date} style={[styles.dateCard, selectedDate === date && styles.dateCardActive]} onPress={() => setSelectedDate(date)}>
              <Ionicons name={date === 'Today' ? 'today-outline' : 'calendar-outline'} size={14} color={selectedDate === date ? '#FFFFFF' : '#888'} />
              <Text style={[styles.dateText, selectedDate === date && styles.dateTextActive]}>{date}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.timesGrid}>
          {times.map((time) => (
            <TouchableOpacity key={time} style={[styles.timeCard, selectedTime === time && styles.timeCardActive]} onPress={() => setSelectedTime(time)}>
              <Ionicons name="time-outline" size={14} color={selectedTime === time ? '#006B3F' : '#888'} />
              <Text style={[styles.timeText, selectedTime === time && styles.timeTextActive]}>{time}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.stepHeader}><View style={styles.stepBadge}><Text style={styles.stepBadgeText}>3</Text></View><Text style={styles.stepTitle}>Service Address</Text></View>
        <View style={styles.addressCard}>
          <View style={styles.addressLeft}><View style={styles.addressIcon}><Ionicons name="home-outline" size={22} color="#006B3F" /></View><View><Text style={styles.addressType}>My Location</Text><Text style={styles.addressText}>Jinja City, Uganda</Text></View></View>
          <TouchableOpacity><Text style={styles.changeText}>Change</Text></TouchableOpacity>
        </View>

        <View style={styles.stepHeader}><View style={styles.stepBadge}><Text style={styles.stepBadgeText}>4</Text></View><Text style={styles.stepTitle}>Additional Information</Text></View>
        <View style={styles.descriptionCard}><TextInput style={styles.descriptionInput} value={description} onChangeText={setDescription} placeholder="Describe your issue in detail (optional)..." placeholderTextColor="#CCC" multiline textAlignVertical="top" /></View>

        {selectedService && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Provider</Text><Text style={styles.summaryValue}>{provider.name}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Service</Text><Text style={styles.summaryValue}>{selectedService.serviceName}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Date & Time</Text><Text style={styles.summaryValue}>{selectedDate} · {selectedTime}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Service Fee</Text><Text style={styles.summaryValue}>UGX {selectedServicePrice.toLocaleString()}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Inspection Fee</Text><Text style={styles.summaryValue}>UGX {inspectionFee.toLocaleString()}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Munolink Discount ({discountPercent}%)</Text><Text style={styles.summaryDiscount}>− UGX {discountAmount.toLocaleString()}</Text></View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}><Text style={styles.summaryTotalLabel}>Estimated Total</Text><Text style={styles.summaryTotalValue}>UGX {estimatedTotal.toLocaleString()}</Text></View>
          </View>
        )}

        <TouchableOpacity style={[styles.confirmBtn, (submitting || !selectedService) && styles.confirmBtnDisabled]} onPress={handleConfirmBooking} disabled={submitting || !selectedService} activeOpacity={0.8}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.confirmBtnText}>{submitting ? 'Booking...' : 'Confirm Booking'}</Text>
        </TouchableOpacity>
        <Text style={styles.noChargeText}>You won't be charged until the service is completed.</Text>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#212121' },
  headerSubtitle: { fontSize: 12, color: '#888' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#888', fontWeight: '500' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  providerCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  providerPhoto: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  providerInitial: { fontSize: 24, fontWeight: '800', color: '#006B3F' },
  providerInfo: { flex: 1 },
  providerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  providerName: { fontSize: 15, fontWeight: '700', color: '#212121' },
  providerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  providerRating: { fontSize: 12, fontWeight: '600', color: '#555' },
  providerReviews: { fontSize: 11, color: '#888' },
  providerLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  providerLocation: { fontSize: 11, color: '#888' },
  viewProfileLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewProfileText: { fontSize: 11, fontWeight: '600', color: '#006B3F' },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  stepBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center' },
  stepBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  stepTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  stepCount: { fontSize: 11, color: '#888', marginLeft: 'auto' },
  servicesScroll: { marginBottom: 22 },
  serviceCard: { width: 155, backgroundColor: '#F8F8F8', borderRadius: 16, padding: 14, marginRight: 10, borderWidth: 2, borderColor: 'transparent' },
  serviceCardActive: { backgroundColor: '#FFFFFF', borderColor: '#006B3F' },
  serviceIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  serviceIconActive: { backgroundColor: '#006B3F' },
  serviceName: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 4, lineHeight: 17 },
  serviceNameActive: { color: '#006B3F' },
  serviceCategoryTag: { backgroundColor: '#F0F0F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6 },
  serviceCategoryText: { fontSize: 9, fontWeight: '600', color: '#888' },
  servicePrice: { fontSize: 14, fontWeight: '800', color: '#006B3F' },
  selectedCheck: { position: 'absolute', top: 8, right: 8 },
  emptyServices: { alignItems: 'center', paddingVertical: 20, marginBottom: 22, backgroundColor: '#F8F8F8', borderRadius: 14, gap: 6 },
  emptyServicesText: { fontSize: 13, color: '#888' },
  datesScroll: { marginBottom: 12 },
  dateCard: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F5F5F5', marginRight: 8 },
  dateCardActive: { backgroundColor: '#006B3F' },
  dateText: { fontSize: 13, fontWeight: '600', color: '#888' },
  dateTextActive: { color: '#FFFFFF' },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  timeCard: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#ECECEC' },
  timeCardActive: { backgroundColor: '#E8F5E9', borderColor: '#006B3F' },
  timeText: { fontSize: 12, fontWeight: '600', color: '#555' },
  timeTextActive: { color: '#006B3F' },
  addressCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, marginBottom: 20 },
  addressLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  addressIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  addressType: { fontSize: 13, fontWeight: '700', color: '#212121' },
  addressText: { fontSize: 12, color: '#555', marginTop: 1 },
  changeText: { fontSize: 13, color: '#006B3F', fontWeight: '700' },
  descriptionCard: { backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, marginBottom: 20 },
  descriptionInput: { fontSize: 14, color: '#212121', minHeight: 80, textAlignVertical: 'top' },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0F0F0', marginBottom: 16 },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  summaryLabel: { fontSize: 12, color: '#888' },
  summaryValue: { fontSize: 12, fontWeight: '600', color: '#212121', maxWidth: '55%', textAlign: 'right' },
  summaryDiscount: { fontSize: 12, fontWeight: '600', color: '#006B3F' },
  summaryDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 6 },
  summaryTotalLabel: { fontSize: 13, fontWeight: '700', color: '#212121' },
  summaryTotalValue: { fontSize: 16, fontWeight: '800', color: '#006B3F' },
  confirmBtn: { flexDirection: 'row', backgroundColor: '#006B3F', paddingVertical: 14, borderRadius: 25, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  noChargeText: { fontSize: 11, color: '#888', textAlign: 'center' },
});