import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OrderDetails({ navigation }) {
  const orderItems = [
    { id: 1, name: 'Paracetamol 500mg', desc: '10 tablets', discount: '10% off', regularPrice: '3,000', munolinkPrice: '2,700', quantity: 2 },
    { id: 2, name: 'Cough Syrup 100ml', desc: '1 bottle', discount: '10% off', regularPrice: '8,000', munolinkPrice: '7,200', quantity: 1 },
    { id: 3, name: 'Vitamin C Tablets', desc: '30 tablets', discount: '15% off', regularPrice: '15,000', munolinkPrice: '12,750', quantity: 1 },
  ];

  const timeline = [
    { stage: 'Order Placed', date: '27 June 2026, 10:15 AM', done: true },
    { stage: 'Payment Confirmed', date: '27 June 2026, 10:16 AM', done: true },
    { stage: 'Processing', date: '27 June 2026, 10:30 AM', done: true },
    { stage: 'Delivered', date: '27 June 2026, 11:45 AM', done: true },
    { stage: 'Completed', date: '27 June 2026, 11:50 AM', done: true },
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
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
          <TouchableOpacity>
            <View style={styles.profilePic}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpBtn}>
            <Ionicons name="help-circle-outline" size={20} color="#006B3F" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.pageTitle}>Order Details</Text>
        <Text style={styles.pageSubtitle}>All information related to this order.</Text>

        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <View style={styles.statusLeft}>
            <View style={styles.statusCheck}>
              <Ionicons name="checkmark" size={28} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.statusTitle}>Order Completed</Text>
              <Text style={styles.statusSubtitle}>Transaction successful</Text>
            </View>
          </View>
          <View style={styles.dateCard}>
            <Text style={styles.dateCardLabel}>Completed</Text>
            <Text style={styles.dateCardValue}>27 June 2026</Text>
            <Text style={styles.dateCardTime}>11:50 AM</Text>
          </View>
        </View>

        {/* Shop Info Card */}
        <View style={styles.shopCard}>
          <View style={styles.shopTopRow}>
            <View style={styles.shopIcon}>
              <Ionicons name="storefront" size={24} color="#006B3F" />
            </View>
            <View style={styles.shopInfo}>
              <View style={styles.shopNameRow}>
                <Text style={styles.shopName}>PharmaPlus</Text>
                <View style={styles.partnerBadge}>
                  <Ionicons name="shield-checkmark" size={9} color="#006B3F" />
                  <Text style={styles.partnerText}>Official Partner</Text>
                </View>
              </View>
              <View style={styles.shopMeta}>
                <Ionicons name="star" size={11} color="#FFB300" />
                <Text style={styles.shopRating}>4.8</Text>
                <Text style={styles.shopDistance}>· 0.8 km</Text>
                <View style={styles.openBadge}>
                  <View style={styles.openDot} />
                  <Text style={styles.openText}>Open</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.viewShopBtn}>
              <Text style={styles.viewShopText}>View Shop</Text>
            </TouchableOpacity>
          </View>

          {/* Transaction Details + Savings */}
          <View style={styles.shopDivider} />
          <View style={styles.detailsRow}>
            {/* Left: Details */}
            <View style={styles.detailsLeft}>
              <View style={styles.detailItem}>
                <Ionicons name="receipt-outline" size={14} color="#006B3F" />
                <Text style={styles.detailLabel}>Order ID</Text>
                <Text style={styles.detailValue}>#MUNO-0627-002</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="card-outline" size={14} color="#006B3F" />
                <Text style={styles.detailLabel}>Payment Code</Text>
                <Text style={styles.detailValue}>ML 7823 41</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="wallet-outline" size={14} color="#006B3F" />
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>Munolink Wallet</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="document-text-outline" size={14} color="#006B3F" />
                <Text style={styles.detailLabel}>Receipt ID</Text>
                <Text style={styles.detailValue}>#RCPT-0627-002</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={14} color="#006B3F" />
                <Text style={styles.detailLabel}>Paid Amount</Text>
                <Text style={styles.detailValueBold}>UGX 22,650</Text>
              </View>
            </View>

            {/* Right: Savings */}
            <View style={styles.savingsCard}>
              <View style={styles.savingsIcon}>
                <Ionicons name="pricetag" size={20} color="#006B3F" />
              </View>
              <Text style={styles.savingsTitle}>You Saved</Text>
              <Text style={styles.savingsAmount}>UGX 1,400</Text>
              <View style={styles.savingsDivider} />
              <View style={styles.savingsBreakRow}>
                <Text style={styles.savingsBreakLabel}>Original</Text>
                <Text style={styles.savingsBreakOld}>UGX 24,050</Text>
              </View>
              <View style={styles.savingsBreakRow}>
                <Text style={styles.savingsBreakLabel}>Discounts</Text>
                <Text style={styles.savingsBreakDiscount}>− UGX 1,400</Text>
              </View>
              <View style={styles.savingsBreakRow}>
                <Text style={styles.savingsBreakLabel}>Paid</Text>
                <Text style={styles.savingsBreakFinal}>UGX 22,650</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Items</Text>
          <TouchableOpacity>
            <Text style={styles.reorderText}>Reorder</Text>
          </TouchableOpacity>
        </View>
        {orderItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemImage}>
              <Ionicons name="cube-outline" size={22} color="#006B3F" />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc}>{item.desc}</Text>
              <View style={styles.itemDiscountBadge}>
                <Text style={styles.itemDiscountText}>{item.discount}</Text>
              </View>
            </View>
            <View style={styles.itemPriceCol}>
              <Text style={styles.itemMunolinkPrice}>UGX {item.munolinkPrice}</Text>
              <Text style={styles.itemRegularPrice}>UGX {item.regularPrice}</Text>
            </View>
            <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
          </View>
        ))}

        {/* View Receipt */}
        <TouchableOpacity style={styles.viewReceiptCard}>
          <Ionicons name="document-text-outline" size={20} color="#006B3F" />
          <Text style={styles.viewReceiptText}>View Full Receipt</Text>
          <Ionicons name="chevron-forward" size={18} color="#006B3F" />
        </TouchableOpacity>

        {/* Order Timeline */}
        <Text style={styles.timelineTitle}>Order Timeline</Text>
        <View style={styles.timeline}>
          {timeline.map((step, index) => (
            <View key={index} style={styles.timelineRow}>
              {/* Connector + Icon */}
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, step.done && styles.timelineDotDone]}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
                {index < timeline.length - 1 && (
                  <View style={[styles.timelineLine, step.done && styles.timelineLineDone]} />
                )}
              </View>
              {/* Content */}
              <View style={styles.timelineContent}>
                <Text style={styles.timelineStage}>{step.stage}</Text>
                <Text style={styles.timelineDate}>{step.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.downloadBtn}>
            <Ionicons name="download-outline" size={18} color="#006B3F" />
            <Text style={styles.downloadText}>Download Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shopAgainBtn}>
            <Text style={styles.shopAgainText}>Shop Again</Text>
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
          <Ionicons name="search-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.payNavButton} onPress={() => navigation.navigate('PaymentConfirm')}>
          <Ionicons name="card-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="pricetag-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Deals</Text>
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
  tagline: { fontSize: 10, color: '#888' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { position: 'relative' },
  notifBadge: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#D32F2F',
  },
  profilePic: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  helpBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121', marginBottom: 2 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  statusBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#E8F5E9', borderRadius: 16, padding: 16, marginBottom: 14,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusCheck: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#006B3F', justifyContent: 'center', alignItems: 'center',
  },
  statusTitle: { fontSize: 16, fontWeight: '800', color: '#006B3F' },
  statusSubtitle: { fontSize: 12, color: '#006B3F', fontWeight: '500' },
  dateCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 10, alignItems: 'center',
  },
  dateCardLabel: { fontSize: 9, color: '#888', fontWeight: '500' },
  dateCardValue: { fontSize: 13, fontWeight: '700', color: '#212121' },
  dateCardTime: { fontSize: 11, color: '#888' },
  shopCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  shopTopRow: { flexDirection: 'row', alignItems: 'center' },
  shopIcon: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  shopInfo: { flex: 1 },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  shopName: { fontSize: 15, fontWeight: '700', color: '#212121' },
  partnerBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 2,
  },
  partnerText: { fontSize: 8, fontWeight: '700', color: '#006B3F' },
  shopMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopRating: { fontSize: 11, fontWeight: '600', color: '#555' },
  shopDistance: { fontSize: 11, color: '#888' },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  openText: { fontSize: 10, color: '#4CAF50', fontWeight: '600' },
  viewShopBtn: {
    borderWidth: 1.5, borderColor: '#006B3F',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  viewShopText: { fontSize: 11, fontWeight: '700', color: '#006B3F' },
  shopDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  detailsRow: { flexDirection: 'row', gap: 12 },
  detailsLeft: { flex: 1, gap: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 12, color: '#888', flex: 1 },
  detailValue: { fontSize: 12, fontWeight: '600', color: '#212121' },
  detailValueBold: { fontSize: 13, fontWeight: '800', color: '#006B3F' },
  savingsCard: {
    width: 140, backgroundColor: '#F8FFF8', borderRadius: 14,
    padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#E8F5E9',
  },
  savingsIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  savingsTitle: { fontSize: 11, color: '#006B3F', fontWeight: '600' },
  savingsAmount: { fontSize: 18, fontWeight: '800', color: '#006B3F', marginBottom: 8 },
  savingsDivider: { width: '100%', height: 1, backgroundColor: '#E0E0E0', marginBottom: 6 },
  savingsBreakRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', marginBottom: 3,
  },
  savingsBreakLabel: { fontSize: 10, color: '#888' },
  savingsBreakOld: { fontSize: 10, color: '#888', textDecorationLine: 'line-through' },
  savingsBreakDiscount: { fontSize: 10, fontWeight: '600', color: '#006B3F' },
  savingsBreakFinal: { fontSize: 11, fontWeight: '700', color: '#212121' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  reorderText: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  itemCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 12, padding: 10, marginBottom: 8, gap: 10,
  },
  itemImage: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#212121', marginBottom: 2 },
  itemDesc: { fontSize: 11, color: '#888', marginBottom: 4 },
  itemDiscountBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 4, alignSelf: 'flex-start',
  },
  itemDiscountText: { fontSize: 9, fontWeight: '700', color: '#006B3F' },
  itemPriceCol: { alignItems: 'flex-end' },
  itemMunolinkPrice: { fontSize: 13, fontWeight: '800', color: '#006B3F' },
  itemRegularPrice: {
    fontSize: 11, color: '#888', textDecorationLine: 'line-through',
  },
  itemQty: { fontSize: 12, color: '#888', fontWeight: '500' },
  viewReceiptCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', borderRadius: 14, padding: 14, marginBottom: 20, gap: 10,
  },
  viewReceiptText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#006B3F' },
  timelineTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 14 },
  timeline: { marginBottom: 20 },
  timelineRow: { flexDirection: 'row', minHeight: 55 },
  timelineLeft: { alignItems: 'center', width: 28, marginRight: 12 },
  timelineDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  timelineDotDone: { backgroundColor: '#006B3F' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E0E0E0', marginTop: -2 },
  timelineLineDone: { backgroundColor: '#006B3F' },
  timelineContent: { paddingBottom: 16 },
  timelineStage: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 2 },
  timelineDate: { fontSize: 11, color: '#888' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  downloadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#006B3F', paddingVertical: 14, borderRadius: 25, gap: 6,
  },
  downloadText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  shopAgainBtn: {
    flex: 1, backgroundColor: '#006B3F', paddingVertical: 14,
    borderRadius: 25, alignItems: 'center',
  },
  shopAgainText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  payNavButton: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#006B3F',
    justifyContent: 'center', alignItems: 'center', marginTop: -20,
    shadowColor: '#006B3F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },
});