import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BookingConfirmed({ navigation }) {
  const bookingId = 'MLP-5D31A7';

  const timeline = [
    { icon: 'checkmark-circle', title: 'Booking Confirmed', desc: 'Your booking has been received', done: true },
    { icon: 'eye-outline', title: 'John Reviews', desc: 'Provider reviews your request', done: false },
    { icon: 'bicycle-outline', title: 'On My Way', desc: 'Provider is heading to you', done: false },
    { icon: 'checkmark-done-circle', title: 'Service Completed', desc: 'Job finished & approved', done: false },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Ionicons name="checkmark-circle" size={24} color="#006B3F" />
          <Text style={styles.headerTitle}>Booking Confirmed</Text>
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
        {/* Confirmation Banner */}
        <View style={styles.confirmBanner}>
          <View style={styles.confirmLeft}>
            <View style={styles.confirmCheck}>
              <Ionicons name="checkmark" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.confirmTextArea}>
              <Text style={styles.confirmTitle}>Your booking is confirmed!</Text>
              <Text style={styles.confirmSubtitle}>
                Booking details have been sent to John. You will receive a confirmation via SMS.
              </Text>
            </View>
          </View>
          <View style={styles.bookingIdCard}>
            <Text style={styles.bookingIdLabel}>Booking ID</Text>
            <View style={styles.bookingIdRow}>
              <Text style={styles.bookingIdText}>{bookingId}</Text>
              <TouchableOpacity onPress={() => Alert.alert('Copied', 'Booking ID copied to clipboard')}>
                <Ionicons name="copy-outline" size={14} color="#006B3F" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Provider Info Card */}
        <View style={styles.providerCard}>
          <View style={styles.providerTop}>
            <View style={styles.providerPhoto}>
              <Ionicons name="person" size={36} color="#006B3F" />
            </View>
            <View style={styles.providerInfo}>
              <View style={styles.providerNameRow}>
                <Text style={styles.providerName}>John Plumbing Services</Text>
                <Ionicons name="checkmark-circle" size={16} color="#006B3F" />
              </View>
              <View style={styles.providerMeta}>
                <Ionicons name="star" size={13} color="#FFB300" />
                <Text style={styles.providerRating}>4.9</Text>
                <Text style={styles.providerReviews}>(231 reviews)</Text>
                <Text style={styles.providerJobs}>· 1.2K jobs completed</Text>
              </View>
              <View style={styles.providerContact}>
                <Ionicons name="call-outline" size={13} color="#888" />
                <Text style={styles.providerPhone}>+256 772 345 678</Text>
                <Text style={styles.providerMessage}>· Message</Text>
              </View>
              <View style={styles.availableBadge}>
                <View style={styles.availableDot} />
                <Text style={styles.availableText}>Available now</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scheduled Appointment */}
        <Text style={styles.sectionTitle}>Scheduled Appointment</Text>
        <View style={styles.appointmentGrid}>
          <View style={styles.appointmentCard}>
            <Ionicons name="calendar-outline" size={20} color="#006B3F" />
            <Text style={styles.appointmentLabel}>Date</Text>
            <Text style={styles.appointmentValue}>Today</Text>
            <Text style={styles.appointmentSub}>31 May 2026</Text>
          </View>
          <View style={styles.appointmentCard}>
            <Ionicons name="time-outline" size={20} color="#006B3F" />
            <Text style={styles.appointmentLabel}>Time</Text>
            <Text style={styles.appointmentValue}>10:00 AM</Text>
            <Text style={styles.appointmentSub}>Arrival window</Text>
          </View>
          <View style={styles.appointmentCard}>
            <Ionicons name="location-outline" size={20} color="#006B3F" />
            <Text style={styles.appointmentLabel}>Address</Text>
            <Text style={styles.appointmentValue}>Home</Text>
            <Text style={styles.appointmentSub}>Nile View Road</Text>
          </View>
          <View style={styles.appointmentCard}>
            <Ionicons name="construct-outline" size={20} color="#006B3F" />
            <Text style={styles.appointmentLabel}>Service</Text>
            <Text style={styles.appointmentValue}>Leak Detection</Text>
            <Text style={styles.appointmentSub}>& Repair</Text>
          </View>
        </View>

        {/* What Happens Next */}
        <Text style={styles.sectionTitle}>What happens next?</Text>
        <View style={styles.timeline}>
          {timeline.map((step, index) => (
            <View key={index} style={styles.timelineRow}>
              <View style={styles.timelineIconCol}>
                <View style={[styles.timelineIcon, step.done && styles.timelineIconDone]}>
                  <Ionicons name={step.icon} size={22} color={step.done ? '#FFFFFF' : '#006B3F'} />
                </View>
                {index < timeline.length - 1 && (
                  <View style={[styles.timelineLine, step.done && styles.timelineLineDone]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, step.done && styles.timelineTitleDone]}>
                  {step.title}
                </Text>
                <Text style={styles.timelineDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Savings Banner */}
        <View style={styles.savingsBanner}>
          <Ionicons name="pricetag" size={20} color="#006B3F" />
          <View style={styles.savingsTextArea}>
            <Text style={styles.savingsTitle}>You're saving with Munolink Pay</Text>
            <Text style={styles.savingsAmount}>UGX 4,000 discount applied</Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.paymentSummary}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Inspection Fee</Text>
            <Text style={styles.summaryValue}>UGX 20,000</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Job Cost</Text>
            <Text style={styles.summaryValue}>UGX 80,000</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Munolink Discount (5%)</Text>
            <Text style={styles.summaryDiscount}>− UGX 4,000</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Estimated Total</Text>
            <Text style={styles.summaryTotalValue}>UGX 96,000</Text>
          </View>
          <View style={styles.protectionBanner}>
            <Ionicons name="shield-checkmark" size={14} color="#1976D2" />
            <Text style={styles.protectionText}>
              You will only be charged after the service has been completed and approved.
            </Text>
          </View>
        </View>

        {/* Important Information */}
        <View style={styles.importantSection}>
          <Text style={styles.importantTitle}>Important Information</Text>
          <View style={styles.importantRow}>
            <Ionicons name="shield-checkmark" size={16} color="#006B3F" />
            <Text style={styles.importantText}>Your payment is protected until service completion</Text>
          </View>
          <View style={styles.importantRow}>
            <Ionicons name="call-outline" size={16} color="#006B3F" />
            <Text style={styles.importantText}>Contact support if you have any questions</Text>
          </View>
          <TouchableOpacity style={styles.supportBtn}>
            <Text style={styles.supportBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.calendarBtn}>
            <Ionicons name="calendar-outline" size={18} color="#006B3F" />
            <Text style={styles.calendarBtnText}>Add to Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
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
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#212121' },
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
  confirmBanner: {
    flexDirection: 'row', backgroundColor: '#E8F5E9', borderRadius: 18, padding: 16,
    marginBottom: 16,
  },
  confirmLeft: { flex: 1, flexDirection: 'row', gap: 12 },
  confirmCheck: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  confirmTextArea: { flex: 1 },
  confirmTitle: { fontSize: 16, fontWeight: '800', color: '#006B3F', marginBottom: 4 },
  confirmSubtitle: { fontSize: 12, color: '#006B3F', lineHeight: 18 },
  bookingIdCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 10, alignItems: 'center',
    marginLeft: 10,
  },
  bookingIdLabel: { fontSize: 9, color: '#888', fontWeight: '500' },
  bookingIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  bookingIdText: { fontSize: 13, fontWeight: '800', color: '#006B3F' },
  providerCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  providerTop: { flexDirection: 'row', alignItems: 'center' },
  providerPhoto: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  providerInfo: { flex: 1 },
  providerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  providerName: { fontSize: 15, fontWeight: '700', color: '#212121' },
  providerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  providerRating: { fontSize: 12, fontWeight: '600', color: '#555' },
  providerReviews: { fontSize: 11, color: '#888' },
  providerJobs: { fontSize: 11, color: '#006B3F', fontWeight: '600' },
  providerContact: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  providerPhone: { fontSize: 12, color: '#555' },
  providerMessage: { fontSize: 12, color: '#006B3F', fontWeight: '600' },
  availableBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availableDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  availableText: { fontSize: 11, fontWeight: '600', color: '#4CAF50' },
  callBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#212121', marginBottom: 12 },
  appointmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  appointmentCard: {
    width: '47%', backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, gap: 2,
  },
  appointmentLabel: { fontSize: 10, color: '#888', fontWeight: '500', marginTop: 6 },
  appointmentValue: { fontSize: 14, fontWeight: '700', color: '#212121' },
  appointmentSub: { fontSize: 11, color: '#888' },
  timeline: { marginBottom: 20 },
  timelineRow: { flexDirection: 'row', marginBottom: 4 },
  timelineIconCol: { alignItems: 'center', width: 36, marginRight: 12 },
  timelineIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  timelineIconDone: { backgroundColor: '#006B3F' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E0E0E0', marginTop: -2, minHeight: 30 },
  timelineLineDone: { backgroundColor: '#006B3F' },
  timelineContent: { paddingBottom: 16, flex: 1 },
  timelineTitle: { fontSize: 14, fontWeight: '700', color: '#888', marginBottom: 2 },
  timelineTitleDone: { color: '#212121' },
  timelineDesc: { fontSize: 12, color: '#AAA' },
  savingsBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', borderRadius: 14, padding: 14, marginBottom: 16, gap: 10,
  },
  savingsTextArea: { flex: 1 },
  savingsTitle: { fontSize: 14, fontWeight: '800', color: '#006B3F' },
  savingsAmount: { fontSize: 12, color: '#006B3F', fontWeight: '600' },
  paymentSummary: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 12 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  summaryLabel: { fontSize: 13, color: '#888' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#212121' },
  summaryDiscount: { fontSize: 13, fontWeight: '600', color: '#006B3F' },
  summaryDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 6 },
  summaryTotalLabel: { fontSize: 14, fontWeight: '700', color: '#212121' },
  summaryTotalValue: { fontSize: 18, fontWeight: '800', color: '#006B3F' },
  protectionBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E3F2FD', borderRadius: 10, padding: 10, marginTop: 12, gap: 8,
  },
  protectionText: { flex: 1, fontSize: 11, color: '#1976D2', fontWeight: '500', lineHeight: 16 },
  importantSection: {
    backgroundColor: '#F8F8F8', borderRadius: 16, padding: 16, marginBottom: 16,
  },
  importantTitle: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 10 },
  importantRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  importantText: { fontSize: 13, color: '#555', flex: 1 },
  supportBtn: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#006B3F',
    paddingVertical: 10, borderRadius: 20, alignItems: 'center', marginTop: 6,
  },
  supportBtnText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  calendarBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#006B3F',
    paddingVertical: 14, borderRadius: 25, gap: 6,
  },
  calendarBtnText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  cancelBtn: {
    flex: 1, backgroundColor: '#FFF0F0', paddingVertical: 14,
    borderRadius: 25, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: '#D32F2F' },
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