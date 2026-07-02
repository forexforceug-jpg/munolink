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

export default function BookService({ navigation }) {
  const [selectedService, setSelectedService] = useState('Leak Detection & Repair');
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [paymentMethod, setPaymentMethod] = useState('munolink');
  const [description, setDescription] = useState('');

  const services = [
    { name: 'Leak Detection & Repair', icon: 'search-outline', price: '50,000' },
    { name: 'Pipe Installation & Replacement', icon: 'construct-outline', price: '80,000' },
    { name: 'Drain Cleaning & Unclogging', icon: 'water-outline', price: '60,000' },
    { name: 'Bathroom Fittings', icon: 'home-outline', price: '100,000' },
    { name: 'More Services', icon: 'apps-outline', price: 'Varies' },
  ];

  const dates = ['Today', 'Sun 1 Jun', 'Mon 2 Jun', 'Tue 3 Jun'];
  const times = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM'];

  const inspectionFee = 20000;
  const estimatedCost = parseInt(services.find(s => s.name === selectedService)?.price?.replace(',', '') || '50000');
  const discountPercent = 5;
  const discountAmount = Math.round(estimatedCost * discountPercent / 100);
  const estimatedTotal = estimatedCost - discountAmount + inspectionFee;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Book Service</Text>
            <Text style={styles.headerSubtitle}>John Plumbing Services</Text>
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
        {/* Provider Summary Card */}
        <View style={styles.providerCard}>
          <View style={styles.providerLeft}>
            <View style={styles.providerPhoto}>
              <Ionicons name="person" size={32} color="#006B3F" />
            </View>
            <View style={styles.providerInfo}>
              <View style={styles.providerNameRow}>
                <Text style={styles.providerName}>John Plumbing Services</Text>
                <Ionicons name="checkmark-circle" size={14} color="#006B3F" />
              </View>
              <View style={styles.providerMeta}>
                <Ionicons name="star" size={12} color="#FFB300" />
                <Text style={styles.providerRating}>4.9</Text>
                <Text style={styles.providerReviews}>(231 reviews)</Text>
              </View>
              <Text style={styles.providerLocation}>📍 0.8 km away, Jinja City</Text>
              <View style={styles.availableBadge}>
                <View style={styles.availableDot} />
                <Text style={styles.availableText}>Available now</Text>
              </View>
            </View>
          </View>
          <View style={styles.inspectionCard}>
            <Text style={styles.inspectionLabel}>Inspection Fee</Text>
            <Text style={styles.inspectionPrice}>UGX {inspectionFee.toLocaleString()}</Text>
            <Text style={styles.inspectionNote}>Deducted from final payment</Text>
          </View>
        </View>

        {/* Step 1: Choose Service */}
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>
          <Text style={styles.stepTitle}>Choose Service</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesScroll}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.name}
              style={[
                styles.serviceCard,
                selectedService === service.name && styles.serviceCardActive,
              ]}
              onPress={() => setSelectedService(service.name)}
            >
              <View style={[
                styles.serviceIcon,
                selectedService === service.name && styles.serviceIconActive,
              ]}>
                <Ionicons
                  name={service.icon}
                  size={22}
                  color={selectedService === service.name ? '#FFFFFF' : '#006B3F'}
                />
              </View>
              <Text style={[
                styles.serviceName,
                selectedService === service.name && styles.serviceNameActive,
              ]}>
                {service.name}
              </Text>
              <Text style={[
                styles.servicePrice,
                selectedService === service.name && styles.servicePriceActive,
              ]}>
                From UGX {service.price}
              </Text>
              {selectedService === service.name && (
                <View style={styles.selectedCheck}>
                  <Ionicons name="checkmark-circle" size={20} color="#006B3F" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Step 2: Select Date & Time */}
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>2</Text>
          </View>
          <Text style={styles.stepTitle}>Select Date & Time</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
          {dates.map((date) => (
            <TouchableOpacity
              key={date}
              style={[styles.dateCard, selectedDate === date && styles.dateCardActive]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dateText, selectedDate === date && styles.dateTextActive]}>
                {date}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.timesGrid}>
          {times.map((time) => (
            <TouchableOpacity
              key={time}
              style={[styles.timeCard, selectedTime === time && styles.timeCardActive]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[styles.timeText, selectedTime === time && styles.timeTextActive]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.arrivalNote}>
          Estimated arrival: {selectedDate === 'Today' ? 'Today' : selectedDate} between {selectedTime} - 10:30 AM
        </Text>

        {/* Step 3: Service Address */}
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>3</Text>
          </View>
          <Text style={styles.stepTitle}>Service Address</Text>
        </View>
        <View style={styles.addressCard}>
          <View style={styles.addressLeft}>
            <View style={styles.addressIcon}>
              <Ionicons name="home-outline" size={22} color="#006B3F" />
            </View>
            <View>
              <Text style={styles.addressType}>Home</Text>
              <Text style={styles.addressText}>Nile View Road, Jinja City</Text>
              <Text style={styles.addressLandmark}>Near Nile View Primary School</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Step 4: Additional Information */}
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>4</Text>
          </View>
          <Text style={styles.stepTitle}>Additional Information</Text>
        </View>
        <View style={styles.descriptionCard}>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your issue in detail..."
            placeholderTextColor="#CCCCCC"
            multiline
            numberOfLines={4}
          />
          <View style={styles.attachRow}>
            <TouchableOpacity style={styles.attachBtn}>
              <Ionicons name="camera-outline" size={18} color="#006B3F" />
              <Text style={styles.attachText}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachBtn}>
              <Ionicons name="videocam-outline" size={18} color="#006B3F" />
              <Text style={styles.attachText}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachBtn}>
              <Ionicons name="mic-outline" size={18} color="#006B3F" />
              <Text style={styles.attachText}>Audio</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Cards Row */}
        <View style={styles.bottomCards}>
          {/* Booking Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>{selectedService}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Inspection Fee</Text>
              <Text style={styles.summaryValue}>UGX {inspectionFee.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Est. Job Cost</Text>
              <Text style={styles.summaryValue}>UGX {estimatedCost.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount (5%)</Text>
              <Text style={styles.summaryDiscount}>− UGX {discountAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Estimated Total</Text>
              <Text style={styles.summaryTotalValue}>UGX {estimatedTotal.toLocaleString()}</Text>
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.paymentCard}>
            <Text style={styles.paymentTitle}>Payment Method</Text>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'munolink' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('munolink')}
            >
              <View style={styles.paymentOptionLeft}>
                <View style={[styles.radio, paymentMethod === 'munolink' && styles.radioActive]}>
                  {paymentMethod === 'munolink' && <View style={styles.radioInner} />}
                </View>
                <Ionicons name="wallet-outline" size={20} color="#006B3F" />
                <View>
                  <Text style={styles.paymentOptionName}>Munolink Pay</Text>
                  <Text style={styles.paymentOptionDesc}>5% discount applied</Text>
                </View>
              </View>
              <Text style={styles.paymentSavings}>Save {discountPercent}%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'momo' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('momo')}
            >
              <View style={styles.paymentOptionLeft}>
                <View style={[styles.radio, paymentMethod === 'momo' && styles.radioActive]}>
                  {paymentMethod === 'momo' && <View style={styles.radioInner} />}
                </View>
                <Ionicons name="phone-portrait-outline" size={20} color="#888" />
                <Text style={styles.paymentOptionName}>Mobile Money</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('cash')}
            >
              <View style={styles.paymentOptionLeft}>
                <View style={[styles.radio, paymentMethod === 'cash' && styles.radioActive]}>
                  {paymentMethod === 'cash' && <View style={styles.radioInner} />}
                </View>
                <Ionicons name="cash-outline" size={20} color="#888" />
                <Text style={styles.paymentOptionName}>Cash</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn}>
              <Text style={styles.confirmBtnText}>Confirm Booking</Text>
            </TouchableOpacity>
            <Text style={styles.noChargeText}>You won't be charged yet</Text>
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#212121' },
  headerSubtitle: { fontSize: 12, color: '#888' },
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
  providerCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  providerLeft: { flexDirection: 'row', flex: 1 },
  providerPhoto: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  providerInfo: { flex: 1 },
  providerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  providerName: { fontSize: 14, fontWeight: '700', color: '#212121' },
  providerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  providerRating: { fontSize: 11, fontWeight: '600', color: '#555' },
  providerReviews: { fontSize: 10, color: '#888' },
  providerLocation: { fontSize: 11, color: '#888', marginBottom: 4 },
  availableBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availableDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  availableText: { fontSize: 11, fontWeight: '600', color: '#4CAF50' },
  inspectionCard: {
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 10, alignItems: 'center',
    marginLeft: 10, width: 100,
  },
  inspectionLabel: { fontSize: 9, color: '#006B3F', fontWeight: '500' },
  inspectionPrice: { fontSize: 16, fontWeight: '800', color: '#006B3F' },
  inspectionNote: { fontSize: 8, color: '#006B3F', textAlign: 'center', marginTop: 2 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  stepBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  stepBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  stepTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  servicesScroll: { marginBottom: 22 },
  serviceCard: {
    width: 150, backgroundColor: '#F8F8F8', borderRadius: 16, padding: 14,
    marginRight: 10, position: 'relative',
  },
  serviceCardActive: {
    backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#006B3F',
  },
  serviceIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  serviceIconActive: { backgroundColor: '#006B3F' },
  serviceName: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 4 },
  serviceNameActive: { color: '#006B3F' },
  servicePrice: { fontSize: 11, color: '#888' },
  servicePriceActive: { color: '#006B3F', fontWeight: '600' },
  selectedCheck: { position: 'absolute', top: 8, right: 8 },
  datesScroll: { marginBottom: 12 },
  dateCard: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#F5F5F5', marginRight: 8,
  },
  dateCardActive: { backgroundColor: '#006B3F' },
  dateText: { fontSize: 13, fontWeight: '600', color: '#888' },
  dateTextActive: { color: '#FFFFFF' },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  timeCard: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18,
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#ECECEC',
  },
  timeCardActive: { backgroundColor: '#E8F5E9', borderColor: '#006B3F' },
  timeText: { fontSize: 12, fontWeight: '600', color: '#555' },
  timeTextActive: { color: '#006B3F' },
  arrivalNote: { fontSize: 11, color: '#888', marginBottom: 20, fontStyle: 'italic' },
  addressCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, marginBottom: 20,
  },
  addressLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  addressIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  addressType: { fontSize: 13, fontWeight: '700', color: '#212121' },
  addressText: { fontSize: 12, color: '#555', marginTop: 1 },
  addressLandmark: { fontSize: 11, color: '#888', marginTop: 1 },
  changeText: { fontSize: 13, color: '#006B3F', fontWeight: '700' },
  descriptionCard: {
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, marginBottom: 20,
  },
  descriptionInput: {
    fontSize: 14, color: '#212121', minHeight: 80, textAlignVertical: 'top',
    marginBottom: 12,
  },
  attachRow: { flexDirection: 'row', gap: 10 },
  attachBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, gap: 4, borderWidth: 1, borderColor: '#E0E0E0',
  },
  attachText: { fontSize: 11, fontWeight: '600', color: '#006B3F' },
  bottomCards: { gap: 12, marginBottom: 8 },
  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 12 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  summaryLabel: { fontSize: 12, color: '#888' },
  summaryValue: { fontSize: 12, fontWeight: '600', color: '#212121' },
  summaryDiscount: { fontSize: 12, fontWeight: '600', color: '#006B3F' },
  summaryDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 6 },
  summaryTotalLabel: { fontSize: 13, fontWeight: '700', color: '#212121' },
  summaryTotalValue: { fontSize: 16, fontWeight: '800', color: '#006B3F' },
  paymentCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  paymentTitle: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 12 },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12,
    marginBottom: 6, backgroundColor: '#F8F8F8',
  },
  paymentOptionActive: { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#006B3F' },
  paymentOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: '#006B3F' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#006B3F' },
  paymentOptionName: { fontSize: 13, fontWeight: '600', color: '#212121' },
  paymentOptionDesc: { fontSize: 10, color: '#006B3F', fontWeight: '500' },
  paymentSavings: { fontSize: 11, fontWeight: '700', color: '#006B3F' },
  confirmBtn: {
    backgroundColor: '#006B3F', paddingVertical: 14, borderRadius: 25,
    alignItems: 'center', marginTop: 10, marginBottom: 6,
  },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  noChargeText: { fontSize: 11, color: '#888', textAlign: 'center' },
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