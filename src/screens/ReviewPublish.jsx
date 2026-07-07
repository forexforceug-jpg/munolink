import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function ReviewPublish({ navigation, route }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shopId, setShopId] = useState(null);

  // Get data from previous screens (with fallback defaults)
  const productData = route?.params?.productData || {
    name: 'Wireless Earbuds Pro',
    category: 'Electronics',
    subcategory: 'Audio',
    sku: 'ML-EB-PRO-001',
    specifications: { color: 'Black', condition: 'New', warranty: '6 Months', packaging: 'Original Box' },
    pricing: { costPrice: 90000, sellingPrice: 150000, comparePrice: 200000 },
    stock: { quantity: 24, lowStockAlert: 5 },
    delivery: { processingTime: '1-2 Days', domesticDelivery: 'Available', returnPolicy: '7 Days Return' },
  };

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    if (!user?.id) return;
    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    if (shop) setShopId(shop.id);
  };

  const handlePublish = async () => {
    if (!shopId) {
      Alert.alert('Error', 'No shop found. Please set up your shop first.');
      return;
    }

    setLoading(true);

    // Check if product exists in catalog
    const { data: existingCatalog } = await supabase
      .from('catalog')
      .select('id')
      .eq('name', productData.name)
      .single();

    let catalogId = existingCatalog?.id;

    // If not in catalog, add it
    if (!catalogId) {
      const { data: newCatalog, error: catalogError } = await supabase
        .from('catalog')
        .insert({
          name: productData.name,
          category: productData.category,
          description: `${productData.name} - ${productData.subcategory || ''}`,
          specifications: productData.specifications,
        })
        .select('id')
        .single();

      if (catalogError) {
        Alert.alert('Error', 'Failed to add product to catalog.');
        setLoading(false);
        return;
      }
      catalogId = newCatalog?.id;
    }

    // Check if already in shop_products
    const { data: existing } = await supabase
      .from('shop_products')
      .select('id')
      .eq('shop_id', shopId)
      .eq('catalog_id', catalogId)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('shop_products')
        .update({
          regular_price: productData.pricing.sellingPrice,
          in_stock: productData.stock.quantity > 0,
          seller_specifications: productData.specifications,
        })
        .eq('id', existing.id);

      if (error) {
        Alert.alert('Error', 'Failed to update product.');
        setLoading(false);
        return;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('shop_products')
        .insert({
          shop_id: shopId,
          catalog_id: catalogId,
          regular_price: productData.pricing.sellingPrice,
          in_stock: productData.stock.quantity > 0,
          seller_specifications: productData.specifications,
        });

      if (error) {
        Alert.alert('Error', 'Failed to publish product: ' + error.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    Alert.alert(
      'Product Published! 🎉',
      `${productData.name} is now live on Munolink. Customers can find and purchase it.`,
      [{ text: 'View Products', onPress: () => navigation.navigate('SellerProducts') }]
    );
  };

  const profit = (productData.pricing?.sellingPrice || 0) - (productData.pricing?.costPrice || 0);
  const margin = (productData.pricing?.costPrice || 0) > 0
    ? Math.round((profit / (productData.pricing?.sellingPrice || 1)) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
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
        {/* Title */}
        <Text style={styles.pageTitle}>Review & Publish</Text>
        <Text style={styles.pageSubtitle}>Review your product listing before publishing.</Text>

        {/* Progress Steps */}
        <View style={styles.progressBar}>
          {['Select Product', 'Set Price & Stock', 'Review & Publish'].map((step, index) => (
            <View key={index} style={styles.progressStep}>
              <View style={[styles.progressDot, styles.progressDotDone]}>
                {index < 2 ? (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                ) : (
                  <Text style={styles.progressDotTextActive}>3</Text>
                )}
              </View>
              <Text style={[styles.progressLabel, index === 2 && styles.progressLabelActive]}>
                {step}
              </Text>
              {index < 2 && <View style={styles.progressLineDone} />}
            </View>
          ))}
        </View>

        {/* Product Information */}
        <View style={styles.reviewCard}>
          <Text style={styles.reviewSectionTitle}>Product Information</Text>
          <View style={styles.reviewRow}>
            <View style={styles.productImageLarge}>
              <Ionicons name="cube-outline" size={40} color="#006B3F" />
            </View>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewProductName}>{productData.name}</Text>
              <View style={styles.reviewCategories}>
                <View style={styles.reviewCatBadge}>
                  <Text style={styles.reviewCatText}>{productData.category}</Text>
                </View>
                {productData.subcategory ? (
                  <View style={styles.reviewCatBadge}>
                    <Text style={styles.reviewCatText}>{productData.subcategory}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.reviewSku}>SKU: {productData.sku}</Text>
            </View>
          </View>

          {/* Specifications */}
          <View style={styles.reviewDivider} />
          <Text style={styles.reviewSubtitle}>Specifications</Text>
          <View style={styles.specsGrid}>
            {Object.entries(productData.specifications || {}).map(([key, value]) => (
              <View key={key} style={styles.specItem}>
                <Text style={styles.specKey}>{key}</Text>
                <Text style={styles.specValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.reviewCard}>
          <Text style={styles.reviewSectionTitle}>Pricing</Text>
          <View style={styles.pricingGrid}>
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>Cost Price</Text>
              <Text style={styles.pricingValue}>
                UGX {productData.pricing?.costPrice?.toLocaleString() || '0'}
              </Text>
            </View>
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>Selling Price</Text>
              <Text style={styles.pricingValueHighlight}>
                UGX {productData.pricing?.sellingPrice?.toLocaleString() || '0'}
              </Text>
            </View>
            {productData.pricing?.comparePrice > 0 && (
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>Compare at</Text>
                <Text style={[styles.pricingValue, styles.pricingStrikethrough]}>
                  UGX {productData.pricing?.comparePrice?.toLocaleString() || '0'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.reviewDivider} />
          <View style={styles.profitRow}>
            <View style={styles.profitMini}>
              <Ionicons name="trending-up" size={14} color="#006B3F" />
              <Text style={styles.profitMiniText}>Profit: UGX {profit.toLocaleString()}</Text>
            </View>
            <View style={styles.profitMini}>
              <Ionicons name="pie-chart" size={14} color="#006B3F" />
              <Text style={styles.profitMiniText}>Margin: {margin}%</Text>
            </View>
          </View>
        </View>

        {/* Stock & Delivery */}
        <View style={styles.reviewCard}>
          <Text style={styles.reviewSectionTitle}>Stock & Delivery</Text>
          <View style={styles.stockGrid}>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Stock Quantity</Text>
              <Text style={styles.stockValue}>{productData.stock?.quantity || 0} units</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Low Stock Alert</Text>
              <Text style={styles.stockValue}>{productData.stock?.lowStockAlert || 0} units</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Processing Time</Text>
              <Text style={styles.stockValue}>{productData.delivery?.processingTime || 'N/A'}</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Domestic Delivery</Text>
              <Text style={styles.stockValue}>{productData.delivery?.domesticDelivery || 'N/A'}</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Return Policy</Text>
              <Text style={styles.stockValue}>{productData.delivery?.returnPolicy || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={16} color="#006B3F" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.publishBtn, loading && styles.publishBtnDisabled]}
            onPress={handlePublish}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.publishBtnText}>
              {loading ? 'Publishing...' : 'Publish Product'}
            </Text>
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
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 22,
  },
  progressStep: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center',
  },
  progressDotDone: { backgroundColor: '#006B3F' },
  progressDotTextActive: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  progressLabel: { fontSize: 10, color: '#888', fontWeight: '500', marginLeft: 4 },
  progressLabelActive: { color: '#006B3F', fontWeight: '700' },
  progressLineDone: { width: 40, height: 2, backgroundColor: '#006B3F', marginHorizontal: 4 },
  reviewCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  reviewSectionTitle: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 12 },
  reviewRow: { flexDirection: 'row', gap: 12 },
  productImageLarge: {
    width: 72, height: 72, borderRadius: 16,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
  },
  reviewInfo: { flex: 1, justifyContent: 'center' },
  reviewProductName: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 4 },
  reviewCategories: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  reviewCatBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  reviewCatText: { fontSize: 10, fontWeight: '700', color: '#006B3F' },
  reviewSku: { fontSize: 11, color: '#AAA' },
  reviewDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 14 },
  reviewSubtitle: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8 },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specItem: {
    width: '47%', backgroundColor: '#F8F8F8', borderRadius: 10, padding: 10,
  },
  specKey: { fontSize: 10, color: '#888', textTransform: 'capitalize', marginBottom: 2 },
  specValue: { fontSize: 13, fontWeight: '700', color: '#212121' },
  pricingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pricingItem: {
    flex: 1, minWidth: '30%', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 10, padding: 10,
  },
  pricingLabel: { fontSize: 10, color: '#888', marginBottom: 4 },
  pricingValue: { fontSize: 14, fontWeight: '700', color: '#212121' },
  pricingValueHighlight: { fontSize: 16, fontWeight: '800', color: '#006B3F' },
  pricingStrikethrough: { textDecorationLine: 'line-through', color: '#AAA' },
  profitRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  profitMini: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profitMiniText: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  stockGrid: { gap: 8 },
  stockItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 10, padding: 10,
  },
  stockLabel: { fontSize: 12, color: '#888' },
  stockValue: { fontSize: 13, fontWeight: '700', color: '#212121' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#006B3F', paddingVertical: 14, paddingHorizontal: 20,
    borderRadius: 25, gap: 4,
  },
  backBtnText: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  publishBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#006B3F', paddingVertical: 14, borderRadius: 25, gap: 8,
  },
  publishBtnDisabled: { opacity: 0.6 },
  publishBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});