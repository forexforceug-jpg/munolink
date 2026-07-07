import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BookingConfirmed({ navigation, route }) {
  const booking = route?.params?.booking || {};
  const providerName = booking?.provider || 'Service Provider';
  const serviceName = booking?.service || 'Service';
  const date = booking?.date || 'Today';
  const time = booking?.time || '10:00 AM';
  const amount = booking?.amount || 0;
  const savings = booking?.savings || 0;
  const bookingId = booking?.id || 'ML-' + Date.now().toString(36).toUpperCase().slice(-6);

  const timeline = [
    { icon: 'checkmark-circle', title: 'Booking Confirmed', desc: 'Your booking has been received', done: true },
    { icon: 'eye-outline', title: `${providerName.split(' ')[0]} Reviews`, desc: 'Provider reviews your request', done: false },
    { icon: 'bicycle-outline', title: 'On My Way', desc: 'Provider is heading to you', done: false },
    { icon: 'checkmark-done-circle', title: 'Service Completed', desc: 'Job finished & approved', done: false },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Connections')}>
          <Ionicons name="close" size={24} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Ionicons name="checkmark-circle" size={24} color="#006B3F" />
          <Text style={styles.headerTitle}>Booking Confirmed</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#212121" />
          <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.confirmBanner}>
          <View style={styles.confirmLeft}>
            <View style={styles.confirmCheck}><Ionicons name="checkmark" size={32} color="#FFFFFF" /></View>
            <View style={styles.confirmTextArea}>
              <Text style={styles.confirmTitle}>Your booking is confirmed!</Text>
              <Text style={styles.confirmSubtitle}>Booking details have been sent to {providerName}.</Text>
            </View>
          </View>
          <View style={styles.bookingIdCard}>
            <Text style={styles.bookingIdLabel}>Booking ID</Text>
            <Text style={styles.bookingIdText}>{bookingId}</Text>
          </View>
        </View>

        <View style={styles.providerCard}>
          <View style={styles.providerTop}>
            <View style={styles.providerPhoto}><Text style={styles.providerInitial}>{providerName.charAt(0)}</Text></View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{providerName}</Text>
              <View style={styles.availableBadge}><View style={styles.availableDot} /><Text style={styles.availableText}>Available now</Text></View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Scheduled Appointment</Text>
        <View style={styles.appointmentGrid}>
          <View style={styles.appointmentCard}><Ionicons name="calendar-outline" size={20} color="#006B3F" /><Text style={styles.appointmentLabel}>Date</Text><Text style={styles.appointmentValue}>{date}</Text></View>
          <View style={styles.appointmentCard}><Ionicons name="time-outline" size={20} color="#006B3F" /><Text style={styles.appointmentLabel}>Time</Text><Text style={styles.appointmentValue}>{time}</Text></View>
          <View style={styles.appointmentCard}><Ionicons name="location-outline" size={20} color="#006B3F" /><Text style={styles.appointmentLabel}>Address</Text><Text style={styles.appointmentValue}>My Location</Text></View>
          <View style={styles.appointmentCard}><Ionicons name="construct-outline" size={20} color="#006B3F" /><Text style={styles.appointmentLabel}>Service</Text><Text style={styles.appointmentValue} numberOfLines={2}>{serviceName}</Text></View>
        </View>

        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>What happens next?</Text>
          {timeline.map((step, index) => (
            <View key={index} style={styles.timelineRow}>
              <View style={styles.timelineIconCol}>
                <View style={[styles.timelineIcon, step.done && styles.timelineIconDone]}><Ionicons name={step.icon} size={22} color={step.done ? '#FFFFFF' : '#006B3F'} /></View>
                {index < timeline.length - 1 && <View style={[styles.timelineLine, step.done && styles.timelineLineDone]} />}
              </View>
              <View style={styles.timelineContent}><Text style={[styles.timelineTitle, step.done && styles.timelineTitleDone]}>{step.title}</Text><Text style={styles.timelineDesc}>{step.desc}</Text></View>
            </View>
          ))}
        </View>

        {savings > 0 && (
          <View style={styles.savingsBanner}>
            <Ionicons name="pricetag" size={20} color="#006B3F" />
            <View style={styles.savingsTextArea}><Text style={styles.savingsTitle}>You're saving with Munolink</Text><Text style={styles.savingsAmount}>UGX {savings.toLocaleString()} discount applied</Text></View>
          </View>
        )}

        <View style={styles.paymentSummary}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Service Fee</Text><Text style={styles.summaryValue}>UGX {(amount + savings).toLocaleString()}</Text></View>
          {savings > 0 && <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Munolink Discount</Text><Text style={styles.summaryDiscount}>− UGX {savings.toLocaleString()}</Text></View>}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}><Text style={styles.summaryTotalLabel}>Estimated Total</Text><Text style={styles.summaryTotalValue}>UGX {amount.toLocaleString()}</Text></View>
          <View style={styles.protectionBanner}><Ionicons name="shield-checkmark" size={14} color="#1976D2" /><Text style={styles.protectionText}>You will only be charged after the service has been completed and approved.</Text></View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Connections')}>
            <Ionicons name="home-outline" size={18} color="#FFFFFF" />
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#212121' },
  headerIcon: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  confirmBanner: { flexDirection: 'row', backgroundColor: '#E8F5E9', borderRadius: 18, padding: 16, marginBottom: 16 },
  confirmLeft: { flex: 1, flexDirection: 'row', gap: 12 },
  confirmCheck: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center' },
  confirmTextArea: { flex: 1 },
  confirmTitle: { fontSize: 16, fontWeight: '800', color: '#006B3F', marginBottom: 4 },
  confirmSubtitle: { fontSize: 12, color: '#006B3F', lineHeight: 18 },
  bookingIdCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 10, alignItems: 'center', marginLeft: 10 },
  bookingIdLabel: { fontSize: 9, color: '#888' },
  bookingIdText: { fontSize: 13, fontWeight: '800', color: '#006B3F' },
  providerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  providerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  providerPhoto: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  providerInitial: { fontSize: 24, fontWeight: '800', color: '#006B3F' },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 4 },
  availableBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availableDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  availableText: { fontSize: 11, fontWeight: '600', color: '#4CAF50' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#212121', marginBottom: 12 },
  appointmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  appointmentCard: { width: '47%', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, gap: 2 },
  appointmentLabel: { fontSize: 10, color: '#888', fontWeight: '500', marginTop: 6 },
  appointmentValue: { fontSize: 14, fontWeight: '700', color: '#212121' },
  timelineSection: { marginBottom: 20 },
  timelineRow: { flexDirection: 'row', marginBottom: 4 },
  timelineIconCol: { alignItems: 'center', width: 36, marginRight: 12 },
  timelineIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  timelineIconDone: { backgroundColor: '#006B3F' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E0E0E0', marginTop: -2, minHeight: 30 },
  timelineLineDone: { backgroundColor: '#006B3F' },
  timelineContent: { paddingBottom: 16, flex: 1 },
  timelineTitle: { fontSize: 14, fontWeight: '700', color: '#888', marginBottom: 2 },
  timelineTitleDone: { color: '#212121' },
  timelineDesc: { fontSize: 12, color: '#AAA' },
  savingsBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 14, padding: 14, marginBottom: 16, gap: 10 },
  savingsTextArea: { flex: 1 },
  savingsTitle: { fontSize: 14, fontWeight: '800', color: '#006B3F' },
  savingsAmount: { fontSize: 12, color: '#006B3F', fontWeight: '600' },
  paymentSummary: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: '#888' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#212121' },
  summaryDiscount: { fontSize: 13, fontWeight: '600', color: '#006B3F' },
  summaryDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 6 },
  summaryTotalLabel: { fontSize: 14, fontWeight: '700', color: '#212121' },
  summaryTotalValue: { fontSize: 18, fontWeight: '800', color: '#006B3F' },
  protectionBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', borderRadius: 10, padding: 10, marginTop: 12, gap: 8 },
  protectionText: { flex: 1, fontSize: 11, color: '#1976D2', fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  homeBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#006B3F', paddingVertical: 14, borderRadius: 25, alignItems: 'center', justifyContent: 'center', gap: 6 },
  homeBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});