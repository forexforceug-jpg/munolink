import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function AddProduct({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Popular Products');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([
    'Paracetamol', 'Cough Syrup', 'Cement', 'Milk', 'Bread',
  ]);

  // Specifications
  const [selectedColor, setSelectedColor] = useState('Black');
  const [selectedCondition, setSelectedCondition] = useState('New');
  const [selectedWarranty, setSelectedWarranty] = useState('6 Months');
  const [selectedPackaging, setSelectedPackaging] = useState('Original Box');

  const categories = ['Popular Products', 'Electronics', 'Fashion', 'Home & Kitchen', 'Beauty'];

  const [catalogProducts, setCatalogProducts] = useState([]);

  const colors = ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Red'];
  const conditions = ['New', 'Used - Like New', 'Used - Good', 'Refurbished'];
  const warranties = ['No Warranty', '3 Months', '6 Months', '1 Year', '2 Years'];
  const packaging = ['Original Box', 'Repackaged', 'No Packaging'];

  // Fetch suggestions as user types (autocomplete)
  const fetchSuggestions = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSuggestions(searchHistory.map((item) => ({ text: item, type: 'history' })));
      setShowSuggestions(searchHistory.length > 0);
      setCatalogProducts([]);
      return;
    }

    const { data } = await supabase
      .from('catalog')
      .select('name, category')
      .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(8);

    if (data && data.length > 0) {
      const unique = [];
      const seen = new Set();
      data.forEach((item) => {
        if (!seen.has(item.name)) {
          seen.add(item.name);
          unique.push({ text: item.name, type: 'product', category: item.category });
        }
      });
      setSuggestions(unique);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Full search when user taps suggestion or presses enter
  const runSearch = async (query) => {
    setSearchQuery(query);
    setShowSuggestions(false);

    if (query.length < 2) {
      setCatalogProducts([]);
      return;
    }

    const { data } = await supabase
      .from('catalog')
      .select('*')
      .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(15);

    if (data) {
      setCatalogProducts(data.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        subcategory: item.category,
        priceRange: 'UGX Varies',
        sku: item.id?.toString()?.slice(0, 8) || 'ML-001',
      })));

      // Add to search history
      if (!searchHistory.includes(query)) {
        setSearchHistory(prev => [query, ...prev].slice(0, 10));
      }
    }
  };

  const handleSuggestionTap = (suggestion) => {
    runSearch(suggestion.text);
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  const steps = ['Select Product', 'Set Specifications', 'Review & Publish'];

  // Products to display: search results or default popular products
  const displayProducts = searchQuery.length >= 2 && catalogProducts.length > 0
    ? catalogProducts
    : searchQuery.length >= 2
    ? []
    : [
        { id: 1, name: 'Paracetamol 500mg x10', category: 'Medicine', subcategory: 'Pharmacy', priceRange: 'UGX 2,500 - 5,000', sku: 'MED-001' },
        { id: 2, name: 'Cough Syrup 100ml', category: 'Medicine', subcategory: 'Pharmacy', priceRange: 'UGX 6,000 - 10,000', sku: 'MED-002' },
        { id: 3, name: 'Cement 50kg', category: 'Hardware', subcategory: 'Construction', priceRange: 'UGX 30,000 - 40,000', sku: 'HW-001' },
        { id: 4, name: 'Fresh Milk 500ml', category: 'Groceries', subcategory: 'Dairy', priceRange: 'UGX 2,500 - 4,000', sku: 'GROC-001' },
        { id: 5, name: 'Whole Wheat Bread', category: 'Groceries', subcategory: 'Bakery', priceRange: 'UGX 3,000 - 5,000', sku: 'GROC-002' },
      ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#212121" /></TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.logo}>MUNOLINK</Text><Text style={styles.tagline}>For Better Connections</Text></View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" onTouchStart={() => setShowSuggestions(false)}>
        <Text style={styles.pageTitle}>Add Product</Text>
        <Text style={styles.pageSubtitle}>Search and select the product you want to sell, then set your specifications.</Text>

        <View style={styles.progressBar}>
          {steps.map((s, index) => (
            <View key={index} style={styles.progressStep}>
              <View style={[styles.progressDot, index === 0 && styles.progressDotActive]}>
                <Text style={[styles.progressDotText, index === 0 && styles.progressDotTextActive]}>{index + 1}</Text>
              </View>
              <Text style={[styles.progressLabel, index === 0 && styles.progressLabelActive]}>{s}</Text>
              {index < 2 && <View style={styles.progressLine} />}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Search or Browse Product</Text>

        {/* Search with Autocomplete */}
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#888" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={fetchSuggestions}
                placeholder="Search for products..."
                placeholderTextColor="#CCCCCC"
                onFocus={() => {
                  if (searchQuery.length < 2) {
                    setSuggestions(searchHistory.map((item) => ({ text: item, type: 'history' })));
                    setShowSuggestions(searchHistory.length > 0);
                  }
                }}
                onSubmitEditing={() => {
                  if (searchQuery.length >= 2) runSearch(searchQuery);
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setShowSuggestions(false); setCatalogProducts([]); }}>
                  <Ionicons name="close-circle" size={18} color="#CCC" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Autocomplete Dropdown */}
          {showSuggestions && (
            <View style={styles.suggestionsDropdown}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionRow}
                  onPress={() => handleSuggestionTap(suggestion)}
                >
                  <Ionicons
                    name={suggestion.type === 'history' ? 'time-outline' : 'cube-outline'}
                    size={16}
                    color={suggestion.type === 'history' ? '#888' : '#006B3F'}
                  />
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                    {suggestion.category && (
                      <Text style={styles.suggestionCategory}>{suggestion.category}</Text>
                    )}
                  </View>
                  <Ionicons name="arrow-forward" size={14} color="#CCC" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat} style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]} onPress={() => setActiveCategory(cat)}>
              <Text style={[styles.categoryTabText, activeCategory === cat && styles.categoryTabTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.listTitle}>
          {searchQuery.length >= 2
            ? `Results for "${searchQuery}" (${displayProducts.length})`
            : 'Select a Product'}
        </Text>

        {searchQuery.length >= 2 && displayProducts.length === 0 ? (
          <Text style={styles.noResults}>No products found. Try a different search.</Text>
        ) : (
          displayProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={[styles.productCard, selectedProduct?.id === product.id && styles.productCardSelected]}
              onPress={() => handleSelectProduct(product)}
            >
              <View style={styles.productImage}><Ionicons name="cube-outline" size={30} color="#006B3F" /></View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productMeta}>{product.category} · {product.subcategory}</Text>
                <Text style={styles.productPriceRange}>{product.priceRange}</Text>
              </View>
              <View style={[styles.selectCircle, selectedProduct?.id === product.id && styles.selectCircleActive]}>
                {selectedProduct?.id === product.id ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : <Ionicons name="chevron-forward" size={16} color="#CCC" />}
              </View>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={styles.requestLink}><Ionicons name="add-circle-outline" size={16} color="#006B3F" /><Text style={styles.requestText}>Can't find your product? Request to add new product.</Text></TouchableOpacity>

        {selectedProduct && (
          <View style={styles.specsSection}>
            <Text style={styles.sectionTitle}>Select Product Specifications</Text>
            <Text style={styles.specsSubtitle}>Configure the specific version of {selectedProduct.name} you have in stock.</Text>
            <Text style={styles.specsLabel}>Color</Text>
            <View style={styles.optionsRow}>{colors.map((color) => (<TouchableOpacity key={color} style={[styles.optionChip, selectedColor === color && styles.optionChipActive]} onPress={() => setSelectedColor(color)}><Text style={[styles.optionText, selectedColor === color && styles.optionTextActive]}>{color}</Text></TouchableOpacity>))}</View>
            <Text style={styles.specsLabel}>Condition</Text>
            <View style={styles.optionsRow}>{conditions.map((condition) => (<TouchableOpacity key={condition} style={[styles.optionChipWide, selectedCondition === condition && styles.optionChipActive]} onPress={() => setSelectedCondition(condition)}><Text style={[styles.optionText, selectedCondition === condition && styles.optionTextActive]}>{condition}</Text></TouchableOpacity>))}</View>
            <Text style={styles.specsLabel}>Warranty</Text>
            <View style={styles.optionsRow}>{warranties.map((w) => (<TouchableOpacity key={w} style={[styles.optionChip, selectedWarranty === w && styles.optionChipActive]} onPress={() => setSelectedWarranty(w)}><Text style={[styles.optionText, selectedWarranty === w && styles.optionTextActive]}>{w}</Text></TouchableOpacity>))}</View>
            <Text style={styles.specsLabel}>Packaging</Text>
            <View style={styles.optionsRow}>{packaging.map((p) => (<TouchableOpacity key={p} style={[styles.optionChipWide, selectedPackaging === p && styles.optionChipActive]} onPress={() => setSelectedPackaging(p)}><Text style={[styles.optionText, selectedPackaging === p && styles.optionTextActive]}>{p}</Text></TouchableOpacity>))}</View>
            <View style={styles.skuCard}><Ionicons name="barcode-outline" size={18} color="#888" /><Text style={styles.skuLabel}>Barcode/SKU</Text><Text style={styles.skuValue}>{selectedProduct.sku}</Text></View>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextBtn, !selectedProduct && styles.nextBtnDisabled]}
            disabled={!selectedProduct}
            onPress={() => navigation.navigate('SetPriceStock', {
              productData: {
                name: selectedProduct?.name || 'Product',
                category: selectedProduct?.category || 'General',
                subcategory: selectedProduct?.subcategory || '',
                sku: selectedProduct?.sku || 'ML-001',
                specifications: { color: selectedColor, condition: selectedCondition, warranty: selectedWarranty, packaging: selectedPackaging },
              },
            })}
          >
            <Text style={styles.nextText}>Next: Set Price & Stock</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerCenter: { alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 9, color: '#888' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 18 },
  progressBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 22 },
  progressStep: { flexDirection: 'row', alignItems: 'center' },
  progressDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  progressDotActive: { backgroundColor: '#006B3F' },
  progressDotText: { fontSize: 11, fontWeight: '700', color: '#888' },
  progressDotTextActive: { color: '#FFFFFF' },
  progressLabel: { fontSize: 10, color: '#888', fontWeight: '500', marginLeft: 4 },
  progressLabelActive: { color: '#006B3F', fontWeight: '700' },
  progressLine: { width: 40, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 8 },
  searchContainer: { zIndex: 10, marginBottom: 14 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: '#ECECEC' },
  searchInput: { flex: 1, fontSize: 14, color: '#212121', marginLeft: 8 },
  suggestionsDropdown: { backgroundColor: '#FFFFFF', borderRadius: 14, marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden' },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 10 },
  suggestionInfo: { flex: 1 },
  suggestionText: { fontSize: 13, fontWeight: '600', color: '#212121' },
  suggestionCategory: { fontSize: 10, color: '#888', marginTop: 1 },
  categoriesScroll: { marginBottom: 16 },
  categoryTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', marginRight: 8 },
  categoryTabActive: { backgroundColor: '#006B3F' },
  categoryTabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  categoryTabTextActive: { color: '#FFFFFF' },
  listTitle: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 10 },
  noResults: { fontSize: 13, color: '#888', textAlign: 'center', paddingVertical: 20 },
  productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: '#F0F0F0' },
  productCardSelected: { borderColor: '#006B3F', backgroundColor: '#FAFFFA' },
  productImage: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 2 },
  productMeta: { fontSize: 11, color: '#888', marginBottom: 2 },
  productPriceRange: { fontSize: 12, fontWeight: '700', color: '#006B3F' },
  selectCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  selectCircleActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  requestLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, marginBottom: 22 },
  requestText: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  specsSection: { backgroundColor: '#F8F8F8', borderRadius: 16, padding: 16, marginBottom: 22 },
  specsSubtitle: { fontSize: 12, color: '#888', marginBottom: 16 },
  specsLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8, marginTop: 4 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0' },
  optionChipWide: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0', width: '47%' },
  optionChipActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  optionText: { fontSize: 12, fontWeight: '600', color: '#555' },
  optionTextActive: { color: '#FFFFFF' },
  skuCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginTop: 8, gap: 8 },
  skuLabel: { fontSize: 12, color: '#888', flex: 1 },
  skuValue: { fontSize: 13, fontWeight: '700', color: '#212121' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E0E0E0', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: '#888' },
  nextBtn: { flex: 2, flexDirection: 'row', backgroundColor: '#006B3F', paddingVertical: 14, borderRadius: 25, alignItems: 'center', justifyContent: 'center', gap: 6 },
  nextBtnDisabled: { opacity: 0.5 },
  nextText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});