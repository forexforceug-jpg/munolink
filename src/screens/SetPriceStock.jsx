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

export default function SetPriceStock({ navigation }) {
  const [costPrice, setCostPrice] = useState('90,000');
  const [sellingPrice, setSellingPrice] = useState('150,000');
  const [comparePrice, setComparePrice] = useState('200,000');
  const [stockQuantity, setStockQuantity] = useState('24');
  const [lowStockAlert, setLowStockAlert] = useState('5');
  const [processingTime, setProcessingTime] = useState('1-2 Days');
  const [domesticDelivery, setDomesticDelivery] = useState('Available');
  const [returnPolicy, setReturnPolicy] = useState('7 Days Return');

  const costPriceNum = parseInt(costPrice.replace(',', '')) || 0;
  const sellingPriceNum = parseInt(sellingPrice.replace(',', '')) || 0;
  const profit = sellingPriceNum - costPriceNum;
  const profitMargin = costPriceNum > 0 ? Math.round((profit / sellingPriceNum) * 100) : 0;

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
        <Text style={styles.pageTitle}>Set Price & Stock</Text>
        <Text style={styles.pageSubtitle}>Set your selling price, stock quantity and delivery details.</Text>

        {/* Progress Steps */}
        <View style={styles.progressBar}>
          {['Select Product', 'Set Price & Stock', 'Review & Publish'].map((step, index) => (
            <View key={index} style={styles.progressStep}>
              <View style={[
                styles.progressDot,
                index === 1 && styles.progressDotActive,
                index < 1 && styles.progressDotDone,
              ]}>
                {index < 1 ? (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.progressDotText, index === 1 && styles.progressDotTextActive]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text style={[styles.progressLabel, index === 1 && styles.progressLabelActive]}>{step}</Text>
              {index < 2 && <View style={styles.progressLine} />}
            </View>
          ))}
        </View>

        {/* Product Summary Card */}
        <View style={styles.productSummaryCard}>
          <View style={styles.summaryLeft}>
            <View style={styles.productImage}>
              <Ionicons name="headset-outline" size={30} color="#006B3F" />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryName}>Wireless Earbuds Pro</Text>
              <View style={styles.summaryCategories}>
                <View style={styles.catBadge}>
                  <Text style={styles.catText}>Electronics</Text>
                </View>
                <View style={styles.catBadge}>
                  <Text style={styles.catText}>Audio</Text>
                </View>
              </View>
              <View style={styles.specsRow}>
                <Text style={styles.specsText}>Color: Black</Text>
                <Text style={styles.specsText}>· Condition: New</Text>
              </View>
              <View style={styles.specsRow}>
                <Text style={styles.specsText}>Warranty: 6 Months</Text>
                <Text style={styles.specsText}>· Packaging: Original Box</Text>
              </View>
              <Text style={styles.skuText}>SKU: ML-EB-PRO-001</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.changeBtn}>
            <Ionicons name="pencil-outline" size={14} color="#006B3F" />
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Section 1: Pricing */}
        <Text style={styles.sectionTitle}>Section 1: Pricing</Text>
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={14} color="#006B3F" />
          <Text style={styles.infoText}>Set a competitive price. You can update the price anytime.</Text>
        </View>

        {/* Price Inputs */}
        <View style={styles.priceInputsRow}>
          <View style={styles.priceInputCard}>
            <Text style={styles.priceLabel}>Cost Price (UGX)</Text>
            <TextInput
              style={styles.priceInput}
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.priceInputCard, styles.priceInputCardActive]}>
            <Text style={styles.priceLabel}>Your Selling Price (UGX)</Text>
            <TextInput
              style={[styles.priceInput, styles.priceInputActive]}
              value={sellingPrice}
              onChangeText={setSellingPrice}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.priceInputCard}>
            <Text style={styles.priceLabel}>Compare at Price (UGX)</Text>
            <TextInput
              style={styles.priceInput}
              value={comparePrice}
              onChangeText={setComparePrice}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Profit Summary */}
        <View style={styles.profitSummary}>
          <View style={styles.profitItem}>
            <Ionicons name="trending-up-outline" size={16} color="#006B3F" />
            <Text style={styles.profitLabel}>Your Profit</Text>
            <Text style={styles.profitValue}>UGX {profit.toLocaleString()}</Text>
          </View>
          <View style={styles.profitItem}>
            <Ionicons name="pie-chart-outline" size={16} color="#006B3F" />
            <Text style={styles.profitLabel}>Profit Margin</Text>
            <Text style={styles.profitValue}>{profitMargin}%</Text>
          </View>
          <View style={styles.profitItem}>
            <Ionicons name="pricetag-outline" size={16} color="#006B3F" />
            <Text style={styles.profitLabel}>Market Range</Text>
            <Text style={styles.profitValue}>UGX 150K-200K</Text>
          </View>
        </View>

        {/* Section 2: Stock */}
        <Text style={styles.sectionTitle}>Section 2: Stock</Text>
        <View style={styles.stockRow}>
          <View style={styles.stockCard}>
            <Text style={styles.stockLabel}>Stock Quantity</Text>
            <TextInput
              style={styles.stockInput}
              value={stockQuantity}
              onChangeText={setStockQuantity}
              keyboardType="numeric"
            />
            <Text style={styles.stockHint}>How many units do you have?</Text>
          </View>
          <View style={styles.stockCard}>
            <Text style={styles.stockLabel}>Low Stock Alert</Text>
            <TextInput
              style={styles.stockInput}
              value={lowStockAlert}
              onChangeText={setLowStockAlert}
              keyboardType="numeric"
            />
            <Text style={styles.stockHint}>Get notified at this level</Text>
          </View>
        </View>

        {/* SKU */}
        <View style={styles.skuCard}>
          <View style={styles.skuLeft}>
            <Ionicons name="barcode-outline" size={18} color="#888" />
            <View>
              <Text style={styles.skuLabel}>Stock Keeping Unit (SKU)</Text>
              <Text style={styles.skuValue}>ML-EB-PRO-001</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.generateSkuBtn}>
            <Ionicons name="refresh-outline" size={14} color="#006B3F" />
            <Text style={styles.generateSkuText}>Generate SKU</Text>
          </TouchableOpacity>
        </View>

        {/* Section 3: Delivery & Availability */}
        <Text style={styles.sectionTitle}>Section 3: Delivery & Availability</Text>
        <View style={styles.stockRow}>
          <View style={styles.stockCard}>
            <Text style={styles.stockLabel}>Processing Time</Text>
            <TextInput
              style={styles.stockInput}
              value={processingTime}
              onChangeText={setProcessingTime}
            />
          </View>
          <View style={styles.stockCard}>
            <Text style={styles.stockLabel}>Domestic Delivery</Text>
            <TextInput
              style={styles.stockInput}
              value={domesticDelivery}
              onChangeText={setDomesticDelivery}
            />
          </View>
        </View>
        <View style={styles.returnCard}>
          <Text style={styles.stockLabel}>Return Policy</Text>
          <TextInput
            style={styles.returnInput}
            value={returnPolicy}
            onChangeText={setReturnPolicy}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={16} color="#006B3F" />
            <Text style={styles.backBtnText}>Back: Select Product</Text>
          </TouchableOpacity>
        <TouchableOpacity
  style={styles.nextBtn}
  onPress={() => navigation.navigate('ReviewPublish')}
>
  <Text style={styles.nextBtnText}>Next: Review & Publish</Text>
  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
</TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ShopOwnerDashboard')}>
          <Ionicons name="grid-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="cube" size={22} color="#006B3F" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Catalog</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="wallet-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Earnings</Text>
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
  progressBar: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  progressStep: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center',
  },
  progressDotActive: { backgroundColor: '#006B3F' },
  progressDotDone: { backgroundColor: '#006B3F' },
  progressDotText: { fontSize: 11, fontWeight: '700', color: '#888' },
  progressDotTextActive: { color: '#FFFFFF' },
  progressLabel: { fontSize: 10, color: '#888', fontWeight: '500', marginLeft: 4 },
  progressLabelActive: { color: '#006B3F', fontWeight: '700' },
  progressLine: { width: 40, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 4 },
  productSummaryCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: '#F8F8F8', borderRadius: 16, padding: 14, marginBottom: 22,
  },
  summaryLeft: { flexDirection: 'row', flex: 1 },
  productImage: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  summaryInfo: { flex: 1 },
  summaryName: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 4 },
  summaryCategories: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  catBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  catText: { fontSize: 9, fontWeight: '700', color: '#006B3F' },
  specsRow: { flexDirection: 'row', gap: 4 },
  specsText: { fontSize: 10, color: '#888' },
  skuText: { fontSize: 10, color: '#AAA', marginTop: 4 },
  changeBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#006B3F', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16, gap: 4,
  },
  changeText: { fontSize: 11, fontWeight: '700', color: '#006B3F' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 8, marginTop: 4 },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', borderRadius: 10, padding: 10, marginBottom: 14, gap: 6,
  },
  infoText: { fontSize: 12, color: '#006B3F', fontWeight: '500', flex: 1 },
  priceInputsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  priceInputCard: {
    flex: 1, backgroundColor: '#F8F8F8', borderRadius: 14, padding: 10,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  priceInputCardActive: { borderColor: '#006B3F', backgroundColor: '#FAFFFA' },
  priceLabel: { fontSize: 9, color: '#888', fontWeight: '500', marginBottom: 4 },
  priceInput: {
    fontSize: 14, fontWeight: '800', color: '#212121',
    backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6,
  },
  priceInputActive: { color: '#006B3F' },
  profitSummary: {
    flexDirection: 'row', backgroundColor: '#E8F5E9', borderRadius: 14, padding: 12,
    marginBottom: 22, gap: 4,
  },
  profitItem: { flex: 1, alignItems: 'center', gap: 2 },
  profitLabel: { fontSize: 9, color: '#006B3F', fontWeight: '500' },
  profitValue: { fontSize: 13, fontWeight: '800', color: '#006B3F' },
  stockRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stockCard: { flex: 1, backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12 },
  stockLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6 },
  stockInput: {
    fontSize: 16, fontWeight: '800', color: '#212121',
    backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 4,
  },
  stockHint: { fontSize: 10, color: '#AAA' },
  skuCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, marginBottom: 22,
  },
  skuLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skuLabel: { fontSize: 10, color: '#888' },
  skuValue: { fontSize: 13, fontWeight: '700', color: '#212121' },
  generateSkuBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#006B3F', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, gap: 4,
  },
  generateSkuText: { fontSize: 11, fontWeight: '600', color: '#006B3F' },
  returnCard: {
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 12, marginBottom: 24,
  },
  returnInput: {
    fontSize: 16, fontWeight: '800', color: '#212121',
    backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E0E0E0', marginTop: 6,
  },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#006B3F', paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 25, gap: 4,
  },
  backBtnText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#006B3F', paddingVertical: 14, borderRadius: 25, gap: 6,
  },
  nextBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 8, paddingBottom: 25,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#888', fontWeight: '500' },
  navLabelActive: { color: '#006B3F', fontWeight: '700' },
});