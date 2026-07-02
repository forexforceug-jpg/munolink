import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function AddProduct({ navigation }) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Popular Products');
  const [catalog, setCatalog] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Specifications
  const [selectedColor, setSelectedColor] = useState('Black');
  const [selectedCondition, setSelectedCondition] = useState('New');
  const [selectedWarranty, setSelectedWarranty] = useState('6 Months');
  const [selectedPackaging, setSelectedPackaging] = useState('Original Box');

  const categories = ['Popular Products', 'Electronics', 'Fashion', 'Home & Kitchen', 'Beauty'];

  const demoProducts = [
    { id: 1, name: 'Wireless Earbuds Pro', category: 'Electronics', subcategory: 'Audio', priceRange: 'UGX 120,000 - 180,000', sku: 'ML-EB-PRO-001', selected: true },
    { id: 2, name: 'Smart Watch Series 6', category: 'Electronics', subcategory: 'Wearables', priceRange: 'UGX 200,000 - 300,000', sku: 'ML-SW6-001', selected: false },
    { id: 3, name: 'Leather Laptop Backpack', category: 'Fashion', subcategory: 'Bags', priceRange: 'UGX 80,000 - 150,000', sku: 'ML-LLB-001', selected: false },
    { id: 4, name: 'Munolink Branded Mug', category: 'Home & Kitchen', subcategory: 'Drinkware', priceRange: 'UGX 20,000 - 35,000', sku: 'ML-MUG-001', selected: false },
    { id: 5, name: 'Genuine Leather Wallet', category: 'Fashion', subcategory: 'Accessories', priceRange: 'UGX 35,000 - 60,000', sku: 'ML-GLW-001', selected: false },
  ];

  const colors = ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Red'];
  const conditions = ['New', 'Used - Like New', 'Used - Good', 'Refurbished'];
  const warranties = ['No Warranty', '3 Months', '6 Months', '1 Year', '2 Years'];
  const packaging = ['Original Box', 'Repackaged', 'No Packaging'];

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    const { data } = await supabase.from('catalog').select('*').limit(20);
    if (data) setCatalog(data);
    setLoading(false);
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  const steps = ['Select Product', 'Set Specifications', 'Review & Publish'];

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
        <Text style={styles.pageTitle}>Add Product</Text>
        <Text style={styles.pageSubtitle}>Search and select the product you want to sell, then set your specifications.</Text>

        {/* Progress Steps */}
        <View style={styles.progressBar}>
          {steps.map((s, index) => (
            <View key={index} style={styles.progressStep}>
              <View style={[styles.progressDot, index === 0 && styles.progressDotActive, index < 0 && styles.progressDotDone]}>
                {index < 0 ? (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.progressDotText, index === 0 && styles.progressDotTextActive]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text style={[styles.progressLabel, index === 0 && styles.progressLabelActive]}>{s}</Text>
              {index < 2 && <View style={styles.progressLine} />}
            </View>
          ))}
        </View>

        {/* Search + Browse */}
        <Text style={styles.sectionTitle}>Search or Browse Product</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for products..."
              placeholderTextColor="#CCCCCC"
            />
          </View>
          <TouchableOpacity style={styles.browseBtn}>
            <Ionicons name="grid-outline" size={18} color="#006B3F" />
            <Text style={styles.browseBtnText}>Browse</Text>
          </TouchableOpacity>
        </View>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryTabText, activeCategory === cat && styles.categoryTabTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Product List */}
        <Text style={styles.listTitle}>Select a Product</Text>
        {demoProducts.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={[styles.productCard, selectedProduct?.id === product.id && styles.productCardSelected]}
            onPress={() => handleSelectProduct(product)}
          >
            <View style={styles.productImage}>
              <Ionicons name="cube-outline" size={30} color="#006B3F" />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productMeta}>{product.category} · {product.subcategory}</Text>
              <Text style={styles.productPriceRange}>{product.priceRange}</Text>
            </View>
            <View style={[styles.selectCircle, selectedProduct?.id === product.id && styles.selectCircleActive]}>
              {selectedProduct?.id === product.id ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Ionicons name="chevron-forward" size={16} color="#CCC" />
              )}
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.requestLink}>
          <Ionicons name="add-circle-outline" size={16} color="#006B3F" />
          <Text style={styles.requestText}>Can't find your product? Request to add new product.</Text>
        </TouchableOpacity>

        {/* Specifications Section */}
        {selectedProduct && (
          <View style={styles.specsSection}>
            <Text style={styles.sectionTitle}>Select Product Specifications</Text>
            <Text style={styles.specsSubtitle}>Configure the specific version of {selectedProduct.name} you have in stock.</Text>

            {/* Color */}
            <Text style={styles.specsLabel}>Color</Text>
            <View style={styles.optionsRow}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.optionChip, selectedColor === color && styles.optionChipActive]}
                  onPress={() => setSelectedColor(color)}
                >
                  <Text style={[styles.optionText, selectedColor === color && styles.optionTextActive]}>
                    {color}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Condition */}
            <Text style={styles.specsLabel}>Condition</Text>
            <View style={styles.optionsRow}>
              {conditions.map((condition) => (
                <TouchableOpacity
                  key={condition}
                  style={[styles.optionChipWide, selectedCondition === condition && styles.optionChipActive]}
                  onPress={() => setSelectedCondition(condition)}
                >
                  <Text style={[styles.optionText, selectedCondition === condition && styles.optionTextActive]}>
                    {condition}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Warranty */}
            <Text style={styles.specsLabel}>Warranty</Text>
            <View style={styles.optionsRow}>
              {warranties.map((warranty) => (
                <TouchableOpacity
                  key={warranty}
                  style={[styles.optionChip, selectedWarranty === warranty && styles.optionChipActive]}
                  onPress={() => setSelectedWarranty(warranty)}
                >
                  <Text style={[styles.optionText, selectedWarranty === warranty && styles.optionTextActive]}>
                    {warranty}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Packaging */}
            <Text style={styles.specsLabel}>Packaging</Text>
            <View style={styles.optionsRow}>
              {packaging.map((pack) => (
                <TouchableOpacity
                  key={pack}
                  style={[styles.optionChipWide, selectedPackaging === pack && styles.optionChipActive]}
                  onPress={() => setSelectedPackaging(pack)}
                >
                  <Text style={[styles.optionText, selectedPackaging === pack && styles.optionTextActive]}>
                    {pack}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* SKU */}
            <View style={styles.skuCard}>
              <Ionicons name="barcode-outline" size={18} color="#888" />
              <Text style={styles.skuLabel}>Barcode/SKU</Text>
              <Text style={styles.skuValue}>{selectedProduct.sku}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextBtn, !selectedProduct && styles.nextBtnDisabled]}
            disabled={!selectedProduct}
            onPress={() => navigation.navigate('SetPriceStock')}
          >
            <Text style={styles.nextText}>Next: Set Price & Stock</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 18 },
  progressBar: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 22,
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
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 8 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: '#ECECEC',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#212121', marginLeft: 8 },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#006B3F', borderRadius: 14,
    paddingHorizontal: 14, gap: 4,
  },
  browseBtnText: { fontSize: 13, fontWeight: '600', color: '#006B3F' },
  categoriesScroll: { marginBottom: 16 },
  categoryTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F5F5F5', marginRight: 8,
  },
  categoryTabActive: { backgroundColor: '#006B3F' },
  categoryTabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  categoryTabTextActive: { color: '#FFFFFF' },
  listTitle: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 10 },
  productCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1.5, borderColor: '#F0F0F0',
  },
  productCardSelected: { borderColor: '#006B3F', backgroundColor: '#FAFFFA' },
  productImage: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 2 },
  productMeta: { fontSize: 11, color: '#888', marginBottom: 2 },
  productPriceRange: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  selectCircle: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center',
  },
  selectCircleActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  requestLink: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, marginBottom: 22,
  },
  requestText: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  specsSection: {
    backgroundColor: '#F8F8F8', borderRadius: 16, padding: 16, marginBottom: 22,
  },
  specsSubtitle: { fontSize: 12, color: '#888', marginBottom: 16 },
  specsLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8, marginTop: 4 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  optionChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0',
  },
  optionChipWide: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0',
    width: '47%',
  },
  optionChipActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  optionText: { fontSize: 12, fontWeight: '600', color: '#555' },
  optionTextActive: { color: '#FFFFFF' },
  skuCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginTop: 8, gap: 8,
  },
  skuLabel: { fontSize: 12, color: '#888', flex: 1 },
  skuValue: { fontSize: 13, fontWeight: '700', color: '#212121' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#E0E0E0',
    paddingVertical: 14, borderRadius: 25, alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '700', color: '#888' },
  nextBtn: {
    flex: 2, flexDirection: 'row', backgroundColor: '#006B3F',
    paddingVertical: 14, borderRadius: 25, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
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