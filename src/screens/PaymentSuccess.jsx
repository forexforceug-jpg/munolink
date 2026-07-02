import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentSuccess({ navigation }) {
  const steps = ['Your Cart', 'Confirm', 'Enter PIN', 'Payment Done'];

  const orderItems = [
    { id: 1, name: 'Paracetamol 500mg', discount: '10% off', quantity: 2 },
    { id: 2, name: 'Fresh Milk 500ml', discount: '20% off', quantity: 1 },
    { id: 3, name: 'Cough Syrup 100ml', discount: '10% off', quantity: 1 },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Ionicons name="close" size={24} color="#212121" />
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
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Steps */}
        <View style={styles.progressBar}>
          {steps.map((step, index) => (
            <View key={index} style={styles.progressStep}>
              <View style={[styles.progressDot, index === 3 && styles.progressDotActive, index < 3 && styles.progressDotDone]}>
                {index < 3 ? (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.progressDotText, index === 3 && styles.progressDotTextActive]}>{index + 1}</Text>
                )}
              </View>
              <Text style={[styles.progressLabel, index === 3 && styles.progressLabelActive]}>{step}</Text>
              {index < 3 && <View style={styles.progressLine} />}
            </View>
          ))}
        </View>

        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={44} color="#FFFFFF" />
          </View>
          {/* Decorative particles */}
          <View style={[styles.particle, { top: 0, left: '30%' }]} />
          <View style={[styles.particle, { top: 5, right: '25%' }]} />
          <View style={[styles.particleSmall, { top: 10, left: '20%' }]} />
          <View style={[styles.particleSmall, { bottom: 5, right: '20%' }]} />
        </View>

        {/* Success Message */}
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSubtitle}>Your payment has been completed successfully.</Text>

        {/* Transaction Card */}
        <View style={styles.transactionCard}>
          {/* Shop Info Row */}
          <View style={styles.shopRow}>
            <View style={styles.shopIcon}>
              <Ionicons name="storefront" size={22} color="#006B3F" />
            </View>
            <View style={styles.shopInfo}>
              <View style={styles.shopNameRow}>
                <Text style={styles.shopName}>QuickMart</Text>
                <View style={styles.partnerBadge}>
                  <Ionicons name="shield-checkmark" size={9} color="#006B3F" />
                  <Text style={styles.partnerText}>Verified</Text>
                </View>
              </View>
              <View style={styles.shopMeta}>
                <Ionicons name="star" size={11} color="#FFB300" />
                <Text style={styles.shopRating}>4.8</Text>
                <Text style={styles.shopDistance}>· 0.4 km</Text>
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

          {/* Transaction Details */}
          <View style={styles.transDivider} />
          <View style={styles.transDetailRow}>
            <Ionicons name="card-outline" size={14} color="#888" />
            <Text style={styles.transDetailLabel}>Payment Code</Text>
            <Text style={styles.transDetailValue}>ML 4839 20</Text>
          </View>
          <View style={styles.transDetailRow}>
            <Ionicons name="calendar-outline" size={14} color="#888" />
            <Text style={styles.transDetailLabel}>Date & Time</Text>
            <Text style={styles.transDetailValue}>29 June 2026, 14:32</Text>
          </View>
          <View style={styles.transDetailRow}>
            <Ionicons name="wallet-outline" size={14} color="#888" />
            <Text style={styles.transDetailLabel}>Payment Method</Text>
            <Text style={styles.transDetailValue}>Munolink Wallet</Text>
          </View>
          <View style={styles.transDetailRow}>
            <Ionicons name="receipt-outline" size={14} color="#888" />
            <Text style={styles.transDetailLabel}>Receipt ID</Text>
            <Text style={styles.transDetailValue}>#MUNO-20260629-001</Text>
          </View>
        </View>

        {/* Savings Card */}
        <View style={styles.savingsCard}>
          <View style={styles.savingsMain}>
            <View style={styles.savingsIcon}>
              <Ionicons name="pricetag" size={22} color="#006B3F" />
            </View>
            <View style={styles.savingsTextArea}>
              <Text style={styles.savingsTitle}>You Saved UGX 1,000</Text>
              <Text style={styles.savingsSubtitle}>with Munolink</Text>
            </View>
          </View>
          <View style={styles.savingsDivider} />
          <View style={styles.savingsBreakdown}>
            <View style={styles.savingsRow}>
              <Text style={styles.savingsLabel}>Original Total</Text>
              <Text style={styles.savingsOldValue}>UGX 9,400</Text>
            </View>
            <View style={styles.savingsRow}>
              <Text style={styles.savingsLabel}>Discount</Text>
              <Text style={styles.savingsDiscountValue}>− UGX 1,000</Text>
            </View>
            <View style={styles.savingsRow}>
              <Text style={styles.savingsFinalLabel}>Amount Paid</Text>
              <Text style={styles.savingsFinalValue}>UGX 8,400</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <TouchableOpacity>
            <Text style={styles.viewReceipt}>View Receipt</Text>
          </TouchableOpacity>
        </View>
        {orderItems.map((item) => (
          <View key={item.id} style={styles.orderItemCard}>
            <View style={styles.orderItemImage}>
              <Ionicons name="cube-outline" size={22} color="#006B3F" />
            </View>
            <View style={styles.orderItemInfo}>
              <Text style={styles.orderItemName}>{item.name}</Text>
              <View style={styles.orderItemDiscount}>
                <Text style={styles.orderDiscountText}>{item.discount}</Text>
              </View>
            </View>
            <Text style={styles.orderItemQty}>Qty: {item.quantity}</Text>
          </View>
        ))}

        {/* What's Next */}
        <Text style={styles.whatsNextTitle}>What's Next?</Text>
        <View style={styles.whatsNextRow}>
          <View style={styles.whatsNextItem}>
            <View style={styles.whatsNextIcon}>
              <Ionicons name="phone-portrait-outline" size={20} color="#006B3F" />
            </View>
            <Text style={styles.whatsNextText}>Show confirmation to cashier</Text>
          </View>
          <View style={styles.whatsNextItem}>
            <View style={styles.whatsNextIcon}>
              <Ionicons name="bag-handle-outline" size={20} color="#006B3F" />
            </View>
            <Text style={styles.whatsNextText}>Collect items & enjoy</Text>
          </View>
          <View style={styles.whatsNextItem}>
            <View style={styles.whatsNextIcon}>
              <Ionicons name="wallet-outline" size={20} color="#006B3F" />
            </View>
            <Text style={styles.whatsNextText}>Track spending in wallet</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.saveReceiptBtn}>
            <Ionicons name="download-outline" size={18} color="#006B3F" />
            <Text style={styles.saveReceiptText}>Save Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>

        {/* Trust Banner */}
        <View style={styles.trustBanner}>
          <Ionicons name="lock-closed" size={14} color="#006B3F" />
          <Text style={styles.trustBannerText}>Secure, Fast, and Trusted</Text>
          <View style={styles.secureBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#006B3F" />
            <Text style={styles.secureBadgeText}>100% Secure</Text>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.payNavButton}>
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#006B3F',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 10,
    color: '#888',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIcon: { position: 'relative' },
  notifBadge: {
    position: 'absolute',
    top: 2, right: 2,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: '#D32F2F',
  },
  profilePic: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: '#006B3F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 24, height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: { backgroundColor: '#006B3F' },
  progressDotDone: { backgroundColor: '#006B3F' },
  progressDotText: { fontSize: 11, fontWeight: '700', color: '#888' },
  progressDotTextActive: { color: '#FFFFFF' },
  progressLabel: { fontSize: 10, color: '#888', fontWeight: '500', marginLeft: 4 },
  progressLabelActive: { color: '#006B3F', fontWeight: '700' },
  progressLine: { width: 30, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 4 },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    height: 100,
    justifyContent: 'center',
  },
  successCircle: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: '#006B3F',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    width: 10, height: 10,
    borderRadius: 5,
    backgroundColor: '#A5D6A7',
  },
  particleSmall: {
    position: 'absolute',
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: '#C8E6C9',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopIcon: {
    width: 38, height: 38,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  shopInfo: { flex: 1 },
  shopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  shopName: { fontSize: 14, fontWeight: '700', color: '#212121' },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, gap: 2,
  },
  partnerText: { fontSize: 8, fontWeight: '700', color: '#006B3F' },
  shopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopRating: { fontSize: 11, fontWeight: '600', color: '#555' },
  shopDistance: { fontSize: 11, color: '#888' },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  openDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  openText: { fontSize: 10, color: '#4CAF50', fontWeight: '600' },
  viewShopBtn: {
    borderWidth: 1.5,
    borderColor: '#006B3F',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16,
  },
  viewShopText: { fontSize: 11, fontWeight: '700', color: '#006B3F' },
  transDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  transDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  transDetailLabel: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  transDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212121',
  },
  savingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E8F5E9',
  },
  savingsMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  savingsIcon: {
    width: 44, height: 44,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingsTextArea: { flex: 1 },
  savingsTitle: { fontSize: 16, fontWeight: '800', color: '#006B3F' },
  savingsSubtitle: { fontSize: 12, color: '#006B3F', fontWeight: '500' },
  savingsDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 10,
  },
  savingsBreakdown: { gap: 6 },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsLabel: { fontSize: 12, color: '#888' },
  savingsOldValue: { fontSize: 12, color: '#888', textDecorationLine: 'line-through' },
  savingsDiscountValue: { fontSize: 12, fontWeight: '600', color: '#006B3F' },
  savingsFinalLabel: { fontSize: 13, fontWeight: '700', color: '#212121' },
  savingsFinalValue: { fontSize: 15, fontWeight: '800', color: '#006B3F' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#212121' },
  viewReceipt: { fontSize: 12, color: '#006B3F', fontWeight: '600' },
  orderItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  orderItemImage: {
    width: 40, height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItemInfo: { flex: 1 },
  orderItemName: { fontSize: 13, fontWeight: '600', color: '#212121', marginBottom: 3 },
  orderItemDiscount: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  orderDiscountText: { fontSize: 9, fontWeight: '700', color: '#006B3F' },
  orderItemQty: { fontSize: 12, color: '#888', fontWeight: '500' },
  whatsNextTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 12,
    marginTop: 4,
  },
  whatsNextRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  whatsNextItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  whatsNextIcon: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsNextText: {
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  saveReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#006B3F',
    paddingVertical: 13,
    borderRadius: 25,
    gap: 6,
    flex: 1,
  },
  saveReceiptText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  homeBtn: {
    flex: 1,
    backgroundColor: '#006B3F',
    paddingVertical: 13,
    borderRadius: 25,
    alignItems: 'center',
  },
  homeBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  trustBannerText: { fontSize: 12, color: '#006B3F', fontWeight: '600' },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  secureBadgeText: { fontSize: 10, fontWeight: '700', color: '#006B3F' },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
  payNavButton: {
    width: 50, height: 50,
    borderRadius: 25,
    backgroundColor: '#006B3F',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#006B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});