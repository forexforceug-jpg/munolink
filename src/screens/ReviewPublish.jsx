import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function ReviewPublish({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Mock data from previous steps (in real app, passed via route params)
  const productData = {
    name: 'Wireless Earbuds Pro',
    category: 'Electronics',
    subcategory: 'Audio',
    sku: 'ML-EB-PRO-001',
    specifications: {
      color: 'Black',
      condition: 'New',
      warranty: '6 Months',
      packaging: 'Original Box',
    },
    pricing: {
      costPrice: 90000,
      sellingPrice: 150000,
      comparePrice: 200000,
      profit: 60000,
      profitMargin: 40,
    },
    stock: {
      quantity: 24,
      lowStockAlert: 5,
    },
    delivery: {
      processingTime: '1-2 Days',
      domesticDelivery: 'Available',
      returnPolicy: '7 Days Return',
    },
  };

  const handlePublish = async () => {
    setLoading(true);

    // Find seller's shop
    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', user?.id)
      .single();

    if (!shop) {
      Alert.alert('Error', 'No shop found for your account.');
      setLoading(false);
      return;
    }

    // Find catalog entry (or create if custom)
    const { data: catalogEntry } = await supabase
      .from('catalog')
      .select('id')
      .eq('name', productData.name)
      .single();

    const catalogId = catalogEntry?.id;

    if (!catalogId) {
      // Product not in catalog — insert it
      const { data: newCatalog } = await supabase
        .from('catalog')
        .insert({
          name: productData.name,
          category: productData.category,
          description: `${productData.name} - ${productData.subcategory}`,
          specifications: productData.specifications,
        })
        .select('id')
        .single();

      if (!newCatalog) {
        Alert.alert('Error', 'Failed to add product to catalog.');
        setLoading(false);
        return;
      }

      // Use the new catalog ID
      const { error: insertError } = await supabase
        .from('shop_products')
        .insert({
          shop_id: shop.id,
          catalog_id: newCatalog.id,
          regular_price: productData.pricing.sellingPrice,
          in_stock: productData.stock.quantity > 0,
          seller_specifications: productData.specifications,
        });

      if (insertError) {
        Alert.alert('Error', 'Failed to publish product: ' + insertError.message);
        setLoading(false);
        return;
      }
    } else {
      // Product exists in catalog — add to shop
      const { error: insertError } = await supabase
        .from('shop_products')
        .insert({
          shop_id: shop.id,
          catalog_id: catalogId,
          regular_price: productData.pricing.sellingPrice,
          in_stock: productData.stock.quantity > 0,
          seller_specifications: productData.specifications,
        });

      if (insertError) {
        Alert.alert('Error', 'Failed to publish product: ' + insertError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    Alert.alert(
      'Product Published! 🎉',
      `${productData.name} is now live on Munolink. Customers can find and purchase it.`,
      [{ text: 'OK', onPress: () => navigation.navigate('SellerProducts') }]
    );
  };

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
                  <Text style={[styles.progressDotText, styles.progressDotTextActive]}>3</Text>
                )}
              </View>
              <Text style={[styles.progressLabel, index === 2 && styles.progressLabelActive]}>{step}</Text>
              {index < 2 && <View style={styles.progressLine} />}
            </View>
          ))}
        </View>

        {/* Product Info Card */}
        <View style={styles.reviewCard}>
          <Text style={styles.reviewSectionTitle}>Product Information</Text>
          <View style={styles.reviewRow}>
            <View style={styles.productImageLarge}>
              <Ionicons name="headset-outline" size={40} color="#006B3F" />
            </View>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewProductName}>{productData.name}</Text>
              <View style={styles.reviewCategories}>
                <View style={styles.reviewCatBadge}>
                  <Text style={styles.reviewCatText}>{productData.category}</Text>
                </View>
                <View style={styles.reviewCatBadge}>
                  <Text style={styles.reviewCatText}>{productData.subcategory}</Text>
                </View>
              </View>
              <Text style={styles.reviewSku}>SKU: {productData.sku}</Text>
            </View>
          </View>

          {/* Specifications */}
          <View style={styles.reviewDivider} />
          <Text style={styles.reviewSubtitle}>Specifications</Text>
          <View style={styles.specsGrid}>
            {Object.entries(productData.specifications).map(([key, value]) => (
              <View key={key} style={styles.specItem}>
                <Text style={styles.specKey}>{key}</Text>
                <Text style={styles.specValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Card */}
        <View style={styles.reviewCard}>
          <Text style={styles.reviewSectionTitle}>Pricing</Text>
          <View style={styles.pricingGrid}>
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>Cost Price</Text>
              <Text style={styles.pricingValue}>UGX {productData.pricing.costPrice.toLocaleString()}</Text>
            </View>
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>Selling Price</Text>
              <Text style={styles.pricingValueHighlight}>UGX {productData.pricing.sellingPrice.toLocaleString()}</Text>
            </View>
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>Compare at</Text>
              <Text style={[styles.pricingValue, styles.pricingStrikethrough]}>UGX {productData.pricing.comparePrice.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.reviewDivider} />
          <View style={styles.profitRow}>
            <View style={styles.profitMini}>
              <Ionicons name="trending-up" size={14} color="#006B3F" />
              <Text style={styles.profitMiniText}>Profit: UGX {productData.pricing.profit.toLocaleString()}</Text>
            </View>
            <View style={styles.profitMini}>
              <Ionicons name="pie-chart" size={14} color="#006B3F" />
              <Text style={styles.profitMiniText}>Margin: {productData.pricing.profitMargin}%</Text>
            </View>
          </View>
        </View>

        {/* Stock Card */}
        <View style={styles.reviewCard}>
          <Text style={styles.reviewSectionTitle}>Stock & Delivery</Text>
          <View style={styles.stockGrid}>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Stock Quantity</Text>
              <Text style={styles.stockValue}>{productData.stock.quantity} units</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Low Stock Alert</Text>
              <Text style={styles.stockValue}>{productData.stock.lowStockAlert} units</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Processing</Text>
              <Text style={styles.stockValue}>{productData.delivery.processingTime}</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Delivery</Text>
              <Text style={styles.stockValue}>{productData.delivery.domesticDelivery}</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>Return Policy</Text>
              <Text style={styles.stockValue}>{productData.delivery.returnPolicy}</Text>
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
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 22,
  },
  progressStep: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center',
  },
  progressDotDone: { backgroundColor: '#006B3F' },
  progressDotText: { fontSize: 11, fontWeight: '700', color: '#888' },
  progressDotTextActive: { color: '#FFFFFF' },
  progressLabel: { fontSize: 10, color: '#888', fontWeight: '500', marginLeft: 4 },
  progressLabelActive: { color: '#006B3F', fontWeight: '700' },
  progressLine: { width: 40, height: 2, backgroundColor: '#006B3F', marginHorizontal: 4 },
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
  pricingGrid: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  pricingItem: { flex: 1, alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 10, padding: 10 },
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
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 16 },
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