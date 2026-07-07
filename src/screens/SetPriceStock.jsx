import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SetPriceStock({ navigation, route }) {
  const incomingData = route?.params?.productData || {};
  const productName = incomingData.name || 'Wireless Earbuds Pro';
  const productCategory = incomingData.category || 'Electronics';
  const productSubcategory = incomingData.subcategory || 'Audio';
  const productSku = incomingData.sku || 'ML-EB-PRO-001';
  const productSpecs = incomingData.specifications || {};

  const [costPrice, setCostPrice] = useState('90,000');
  const [sellingPrice, setSellingPrice] = useState('150,000');
  const [comparePrice, setComparePrice] = useState('200,000');
  const [stockQuantity, setStockQuantity] = useState('24');
  const [lowStockAlert, setLowStockAlert] = useState('5');
  const [processingTime, setProcessingTime] = useState('1-2 Days');
  const [domesticDelivery, setDomesticDelivery] = useState('Available');
  const [returnPolicy, setReturnPolicy] = useState('7 Days Return');

  const costPriceNum = parseInt(costPrice.replace(/,/g, '')) || 0;
  const sellingPriceNum = parseInt(sellingPrice.replace(/,/g, '')) || 0;
  const profit = sellingPriceNum - costPriceNum;
  const profitMargin = costPriceNum > 0 ? Math.round((profit / sellingPriceNum) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.logo}>MUNOLINK</Text>
          <Text style={styles.tagline}>For Better Connections</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
              <Text style={[styles.progressLabel, index === 1 && styles.progressLabelActive]}>
                {step}
              </Text>
              {index < 2 && (
                <View style={[styles.progressLine, index < 1 && styles.progressLineDone]} />
              )}
            </View>
          ))}
        </View>

        {/* Product Summary Card */}
        <View style={styles.productSummaryCard}>
          <View style={styles.summaryLeft}>
            <View style={styles.productImage}>
              <Ionicons name="cube-outline" size={30} color="#006B3F" />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryName}>{productName}</Text>
              <View style={styles.summaryCategories}>
                <View style={styles.catBadge}>
                  <Text style={styles.catText}>{productCategory}</Text>
                </View>
                {productSubcategory ? (
                  <View style={styles.catBadge}>
                    <Text style={styles.catText}>{productSubcategory}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.specsRow}>
                <Text style={styles.specsText}>Color: {productSpecs.color || 'N/A'}</Text>
                <Text style={styles.specsText}>· Condition: {productSpecs.condition || 'N/A'}</Text>
              </View>
              <View style={styles.specsRow}>
                <Text style={styles.specsText}>Warranty: {productSpecs.warranty || 'N/A'}</Text>
                <Text style={styles.specsText}>· Packaging: {productSpecs.packaging || 'N/A'}</Text>
              </View>
              <Text style={styles.skuText}>SKU: {productSku}</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Pricing */}
        <Text style={styles.sectionTitle}>Section 1: Pricing</Text>
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={14} color="#006B3F" />
          <Text style={styles.infoText}>Set a competitive price. You can update the price anytime.</Text>
        </View>

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
            <Text style={styles.priceLabel}>Selling Price (UGX)</Text>
            <TextInput
              style={[styles.priceInput, styles.priceInputActive]}
              value={sellingPrice}
              onChangeText={setSellingPrice}
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
              <Text style={styles.skuValue}>{productSku}</Text>
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
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => navigation.navigate('ReviewPublish', {
              productData: {
                name: productName,
                category: productCategory,
                subcategory: productSubcategory,
                sku: productSku,
                specifications: productSpecs,
                pricing: {
                  costPrice: costPriceNum,
                  sellingPrice: sellingPriceNum,
                  comparePrice: parseInt(comparePrice.replace(/,/g, '')) || 0,
                },
                stock: {
                  quantity: parseInt(stockQuantity) || 0,
                  lowStockAlert: parseInt(lowStockAlert) || 0,
                },
                delivery: {
                  processingTime: processingTime,
                  domesticDelivery: domesticDelivery,
                  returnPolicy: returnPolicy,
                },
              },
            })}
          >
            <Text style={styles.nextBtnText}>Next: Review & Publish</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12,
  },
  headerCenter: { alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 9, color: '#888' },
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
  progressLineDone: { backgroundColor: '#006B3F' },
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
});