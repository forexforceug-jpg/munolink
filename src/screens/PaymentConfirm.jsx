import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentConfirm({ navigation }) {
  const [codeTimer, setCodeTimer] = useState(300); // 5 minutes

  useEffect(() => {
    if (codeTimer <= 0) return;
    const timer = setTimeout(() => setCodeTimer(codeTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [codeTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const orderItems = [
    { id: 1, name: 'Paracetamol 500mg', pack: '10 tablets', regularPrice: 3000, munolinkPrice: 2700, discount: 10, quantity: 2 },
    { id: 2, name: 'Fresh Milk 500ml', pack: '1 bottle', regularPrice: 3500, munolinkPrice: 2800, discount: 20, quantity: 1 },
    { id: 3, name: 'Cough Syrup 100ml', pack: '1 bottle', regularPrice: 8000, munolinkPrice: 7200, discount: 10, quantity: 1 },
  ];

  const subtotal = orderItems.reduce((sum, item) => sum + item.regularPrice * item.quantity, 0);
  const munolinkTotal = orderItems.reduce((sum, item) => sum + item.munolinkPrice * item.quantity, 0);
  const totalSavings = subtotal - munolinkTotal;
  const serviceFee = 500;
  const finalTotal = munolinkTotal + serviceFee;

  const steps = ['Your Cart', 'Confirm', 'Enter PIN', 'Payment Done'];

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
              <View
                style={[
                  styles.progressDot,
                  index === 1 && styles.progressDotActive,
                  index < 1 && styles.progressDotDone,
                ]}
              >
                {index < 1 ? (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.progressDotText,
                      index === 1 && styles.progressDotTextActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.progressLabel,
                  index === 1 && styles.progressLabelActive,
                ]}
              >
                {step}
              </Text>
              {index < 3 && <View style={styles.progressLine} />}
            </View>
          ))}
        </View>

        {/* Title */}
        <Text style={styles.pageTitle}>Confirm Payment</Text>
        <Text style={styles.pageSubtitle}>Review your order before proceeding.</Text>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={18} color="#006B3F" />
          <Text style={styles.infoBannerText}>
            Show your payment code at the shop to complete this transaction.
          </Text>
        </View>

        {/* Shop Card */}
        <View style={styles.shopCard}>
          <View style={styles.shopTopRow}>
            <View style={styles.shopIcon}>
              <Ionicons name="storefront" size={22} color="#006B3F" />
            </View>
            <View style={styles.shopInfo}>
              <View style={styles.shopNameRow}>
                <Text style={styles.shopName}>QuickMart</Text>
                <View style={styles.partnerBadge}>
                  <Ionicons name="shield-checkmark" size={10} color="#006B3F" />
                  <Text style={styles.partnerText}>Verified</Text>
                </View>
              </View>
              <View style={styles.shopMeta}>
                <Ionicons name="star" size={12} color="#FFB300" />
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
        </View>

        {/* Payment Code */}
        <View style={styles.paymentCodeCard}>
          <Text style={styles.paymentCodeLabel}>Payment Code</Text>
          <Text style={styles.paymentCode}>ML 4839 20</Text>
          <View style={styles.codeTimerRow}>
            <Ionicons name="time-outline" size={14} color="#888" />
            <Text style={styles.codeTimer}>
              Code expires in {formatTime(codeTimer)}
            </Text>
          </View>
          <Text style={styles.codeInstruction}>
            Show this code to the cashier to complete your payment.
          </Text>
          <View style={styles.codeBarcode}>
            <View style={styles.barcodeLine} />
            <View style={styles.barcodeLineShort} />
            <View style={styles.barcodeLine} />
            <View style={styles.barcodeLineTall} />
            <View style={styles.barcodeLine} />
            <View style={styles.barcodeLineShort} />
            <View style={styles.barcodeLine} />
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyCart')}>
            <Text style={styles.editCart}>Edit Cart</Text>
          </TouchableOpacity>
        </View>
        {orderItems.map((item) => (
          <View key={item.id} style={styles.orderItemCard}>
            <View style={styles.orderItemImage}>
              <Ionicons name="cube-outline" size={24} color="#006B3F" />
            </View>
            <View style={styles.orderItemDetails}>
              <Text style={styles.orderItemName}>{item.name}</Text>
              <Text style={styles.orderItemPack}>{item.pack}</Text>
              <View style={styles.orderItemDiscount}>
                <Text style={styles.orderDiscountText}>{item.discount}% off</Text>
              </View>
            </View>
            <View style={styles.orderItemPrice}>
              <Text style={styles.orderMunolinkPrice}>
                UGX {(item.munolinkPrice * item.quantity).toLocaleString()}
              </Text>
              <Text style={styles.orderRegularPrice}>
                UGX {(item.regularPrice * item.quantity).toLocaleString()}
              </Text>
              <Text style={styles.orderQty}>Qty: {item.quantity}</Text>
            </View>
          </View>
        ))}

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>UGX {subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shop Discounts</Text>
            <Text style={styles.summaryDiscount}>− UGX {totalSavings.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>UGX {serviceFee.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryFinalLabel}>Total to Pay</Text>
            <Text style={styles.summaryFinalValue}>UGX {finalTotal.toLocaleString()}</Text>
          </View>
          <View style={styles.savingsMessage}>
            <Ionicons name="happy-outline" size={14} color="#006B3F" />
            <Text style={styles.savingsMessageText}>
              You're saving UGX {totalSavings.toLocaleString()} on this order!
            </Text>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksCard}>
          <View style={styles.howIcon}>
            <Ionicons name="bulb-outline" size={22} color="#F59E0B" />
          </View>
          <View style={styles.howContent}>
            <Text style={styles.howTitle}>How It Works</Text>
            <Text style={styles.howText}>
              Show this payment code to the cashier. They will scan it, and the amount 
              will be automatically deducted from your Munolink wallet with your discount applied.
            </Text>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
  style={styles.confirmBtn}
  onPress={() => navigation.navigate('EnterPin')}
>
          <Text style={styles.confirmBtnText}>Confirm & Continue</Text>
        </TouchableOpacity>
      </View>

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
  headerIcon: {
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D32F2F',
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#006B3F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: '#006B3F',
  },
  progressDotDone: {
    backgroundColor: '#006B3F',
  },
  progressDotText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
  },
  progressDotTextActive: {
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
    marginLeft: 4,
  },
  progressLabelActive: {
    color: '#006B3F',
    fontWeight: '700',
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#006B3F',
    fontWeight: '500',
    flex: 1,
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  shopTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  shopInfo: {
    flex: 1,
  },
  shopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  partnerText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#006B3F',
  },
  shopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopRating: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
  },
  shopDistance: {
    fontSize: 11,
    color: '#888',
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  openText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  viewShopBtn: {
    borderWidth: 1.5,
    borderColor: '#006B3F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewShopText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006B3F',
  },
  paymentCodeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8F5E9',
    borderStyle: 'dashed',
  },
  paymentCodeLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    marginBottom: 4,
  },
  paymentCode: {
    fontSize: 32,
    fontWeight: '800',
    color: '#006B3F',
    letterSpacing: 4,
    marginBottom: 8,
  },
  codeTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  codeTimer: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  codeInstruction: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 14,
  },
  codeBarcode: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 40,
  },
  barcodeLine: {
    width: 3,
    height: 30,
    backgroundColor: '#212121',
    borderRadius: 1,
  },
  barcodeLineShort: {
    width: 3,
    height: 20,
    backgroundColor: '#212121',
    borderRadius: 1,
  },
  barcodeLineTall: {
    width: 3,
    height: 35,
    backgroundColor: '#212121',
    borderRadius: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212121',
  },
  editCart: {
    fontSize: 13,
    color: '#006B3F',
    fontWeight: '600',
  },
  orderItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  orderItemImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  orderItemDetails: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 2,
  },
  orderItemPack: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  orderItemDiscount: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  orderDiscountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#006B3F',
  },
  orderItemPrice: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  orderMunolinkPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#006B3F',
  },
  orderRegularPrice: {
    fontSize: 11,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  orderQty: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#888',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
  },
  summaryDiscount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#006B3F',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  summaryFinalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
  },
  summaryFinalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#006B3F',
  },
  savingsMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  savingsMessageText: {
    fontSize: 12,
    color: '#006B3F',
    fontWeight: '600',
    flex: 1,
  },
  howItWorksCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  howIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  howContent: {
    flex: 1,
  },
  howTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  howText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  backBtn: {
    borderWidth: 1.5,
    borderColor: '#006B3F',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006B3F',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#006B3F',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
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
  navItem: {
    alignItems: 'center',
    gap: 2,
  },
  navLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
  },
  payNavButton: {
    width: 50,
    height: 50,
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