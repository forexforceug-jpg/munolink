// src/features/explore/ExploreScreen.tsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Dimensions,
  StatusBar,
  Image,
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const { width, height } = Dimensions.get('window');

// --- Mock Data ---
const mockProducts = [
  { id: '1', title: 'Samsung Galaxy S25', shop: 'TechWorld Kampala', price: 2850000, image: 'https://via.placeholder.com/200/4A7DFF/FFFFFF?text=S25', rating: 4.8, category: 'Electronics', type: 'product' },
  { id: '2', title: 'iPhone 16 Pro Max', shop: 'City Electronics', price: 3200000, image: 'https://via.placeholder.com/200/6B94FF/FFFFFF?text=iPhone', rating: 4.9, category: 'Electronics', type: 'product' },
  { id: '3', title: 'MacBook Air M3', shop: 'TechWorld Kampala', price: 4500000, image: 'https://via.placeholder.com/200/4A7DFF/FFFFFF?text=MacBook', rating: 4.7, category: 'Electronics', type: 'product' },
  { id: '4', title: 'Phone Repair Service', shop: 'QuickFix Mobile', price: 75000, image: 'https://via.placeholder.com/200/6B94FF/FFFFFF?text=Repair', rating: 4.5, category: 'Services', type: 'service' },
  { id: '5', title: 'Sony WH-1000XM5', shop: 'AudioWorld', price: 850000, image: 'https://via.placeholder.com/200/4A7DFF/FFFFFF?text=Sony', rating: 4.9, category: 'Electronics', type: 'product' },
  { id: '6', title: 'Home Cleaning Service', shop: 'CleanHome Ltd', price: 120000, image: 'https://via.placeholder.com/200/6B94FF/FFFFFF?text=Cleaning', rating: 4.3, category: 'Services', type: 'service' },
  { id: '7', title: 'Mechanic Service', shop: 'QuickFix Auto', price: 150000, image: 'https://via.placeholder.com/200/6B94FF/FFFFFF?text=Mechanic', rating: 4.5, category: 'Services', type: 'service' },
  { id: '8', title: 'Dell XPS 16', shop: 'TechWorld Kampala', price: 4800000, image: 'https://via.placeholder.com/200/4A7DFF/FFFFFF?text=Dell', rating: 4.6, category: 'Electronics', type: 'product' },
  { id: '9', title: 'Sofa Set', shop: 'Furniture Hub', price: 2500000, image: 'https://via.placeholder.com/200/4A7DFF/FFFFFF?text=Sofa', rating: 4.4, category: 'Furniture', type: 'product' },
  { id: '10', title: 'Dining Table', shop: 'Furniture Hub', price: 1800000, image: 'https://via.placeholder.com/200/4A7DFF/FFFFFF?text=Table', rating: 4.2, category: 'Furniture', type: 'product' },
  { id: '11', title: 'Electrician Service', shop: 'Power Solutions', price: 80000, image: 'https://via.placeholder.com/200/6B94FF/FFFFFF?text=Electrician', rating: 4.7, category: 'Services', type: 'service' },
  { id: '12', title: 'Hotel Room - Deluxe', shop: 'Jinja Heights Hotel', price: 350000, image: 'https://via.placeholder.com/200/4A7DFF/FFFFFF?text=Hotel', rating: 4.8, category: 'Hospitality', type: 'service' },
];

// --- Filter Categories ---
const filterCategories = [
  { key: 'all', label: 'All' },
  { key: 'products', label: 'Products' },
  { key: 'services', label: 'Services' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'furniture', label: 'Furniture' },
  { key: 'hospitality', label: 'Hospitality' },
];

const sortOptions = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'price_low', label: 'Price: Low to High' },
  { key: 'price_high', label: 'Price: High to Low' },
  { key: 'rating', label: 'Top Rated' },
];

// --- Sub-components ---

// Filter Chip
const FilterChip = ({ label, selected, onPress, count }: any) => (
  <TouchableOpacity
    style={[styles.filterChip, selected && styles.filterChipActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
      {label}
    </Text>
    {count !== undefined && count > 0 && (
      <View style={styles.filterChipBadge}>
        <Text style={styles.filterChipBadgeText}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

// Product/Service Card
const ItemCard = ({ item, isDesktop }: any) => {
  const isService = item.type === 'service';
  const cardWidth = isDesktop ? (width - 120 - 48) / 4 - 12 : (width - 48) / 2 - 8;

  return (
    <TouchableOpacity
      style={[
        styles.itemCard,
        isDesktop && styles.itemCardDesktop,
        { width: cardWidth }
      ]}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.image }} style={[styles.itemImage, isDesktop && styles.itemImageDesktop]} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.itemShop} numberOfLines={1}>{item.shop}</Text>
        <Text style={styles.itemPrice}>UGX {item.price.toLocaleString()}</Text>
        <View style={styles.itemFooter}>
          <Text style={styles.itemRating}>⭐ {item.rating}</Text>
          {isService ? (
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>Book</Text>
            </View>
          ) : (
            <View style={styles.inStockBadge}>
              <Text style={styles.inStockBadgeText}>In Stock</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- Main ExploreScreen Component ---
const ExploreContent = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();
  const [items, setItems] = useState(mockProducts);
  const [filteredItems, setFilteredItems] = useState(mockProducts);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('relevance');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  // Apply filters and sorting
  const applyFilters = useCallback(() => {
    setIsLoading(true);
    
    setTimeout(() => {
      let result = [...items];

      // Filter by category/type
      if (selectedFilter !== 'all') {
        if (selectedFilter === 'products') {
          result = result.filter(item => item.type === 'product');
        } else if (selectedFilter === 'services') {
          result = result.filter(item => item.type === 'service');
        } else {
          result = result.filter(item => item.category === selectedFilter);
        }
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        result = result.filter(item =>
          item.title.toLowerCase().includes(query) ||
          item.shop.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      }

      // Sort
      switch (selectedSort) {
        case 'price_low':
          result.sort((a, b) => a.price - b.price);
          break;
        case 'price_high':
          result.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          result.sort((a, b) => b.rating - a.rating);
          break;
        default:
          // relevance - keep original order
          break;
      }

      setFilteredItems(result);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setIsLoading(false);
    }, 300);
  }, [items, selectedFilter, selectedSort, searchQuery]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Get category counts
  const getCategoryCounts = () => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const key = item.type === 'product' ? item.category : item.type + 's';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  };

  const categoryCounts = getCategoryCounts();

  // Render grid
  const renderItem = ({ item }: { item: any }) => (
    <ItemCard item={item} isDesktop={isDesktop} />
  );

  // Render list view
  const renderListItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.listItem} activeOpacity={0.8}>
      <Image source={{ uri: item.image }} style={styles.listItemImage} />
      <View style={styles.listItemInfo}>
        <Text style={styles.listItemTitle}>{item.title}</Text>
        <Text style={styles.listItemShop}>{item.shop}</Text>
        <Text style={styles.listItemPrice}>UGX {item.price.toLocaleString()}</Text>
        <View style={styles.listItemFooter}>
          <Text style={styles.listItemRating}>⭐ {item.rating}</Text>
          <View style={[styles.listItemBadge, item.type === 'service' ? styles.serviceBadge : styles.inStockBadge]}>
            <Text style={styles.listItemBadgeText}>
              {item.type === 'service' ? 'Book' : 'In Stock'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Sort Modal
  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <Ionicons name="close" size={24} color="#1F2F5F" />
            </TouchableOpacity>
          </View>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortOption,
                selectedSort === option.key && styles.sortOptionActive,
              ]}
              onPress={() => {
                setSelectedSort(option.key);
                setShowSortModal(false);
              }}
            >
              <Text style={[
                styles.sortOptionText,
                selectedSort === option.key && styles.sortOptionTextActive,
              ]}>
                {option.label}
              </Text>
              {selectedSort === option.key && (
                <Ionicons name="checkmark" size={20} color="#4A7DFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Desktop Header */}
      {isDesktop && (
        <View style={styles.desktopHeader}>
          <Text style={styles.desktopHeaderTitle}>Explore</Text>
          <Text style={styles.desktopHeaderSubtitle}>Discover products and services near you</Text>
        </View>
      )}

      {/* Mobile Header */}
      {!isDesktop && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={[styles.searchContainer, isDesktop && styles.searchContainerDesktop]}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={20} color="#8A8AAE" />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search products and services..."
            placeholderTextColor="#8A8AAE"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#8A8AAE" />
            </TouchableOpacity>
          )}
        </View>
        {isDesktop && (
          <TouchableOpacity
            style={styles.sortButtonDesktop}
            onPress={() => setShowSortModal(true)}
          >
            <Ionicons name="options-outline" size={20} color="#4A7DFF" />
            <Text style={styles.sortButtonDesktopText}>Sort</Text>
          </TouchableOpacity>
        )}
        {!isDesktop && (
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <Ionicons name="options-outline" size={24} color="#4A7DFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterCategories.map((filter) => {
          const count = filter.key === 'all' ? items.length :
                       filter.key === 'products' ? items.filter(i => i.type === 'product').length :
                       filter.key === 'services' ? items.filter(i => i.type === 'service').length :
                       items.filter(i => i.category === filter.key).length;
          return (
            <FilterChip
              key={filter.key}
              label={filter.label}
              selected={selectedFilter === filter.key}
              count={count}
              onPress={() => setSelectedFilter(filter.key)}
            />
          );
        })}
      </ScrollView>

      {/* Results Count and Sort */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
        </Text>
        {isDesktop && (
          <TouchableOpacity
            style={styles.sortTriggerDesktop}
            onPress={() => setShowSortModal(true)}
          >
            <Ionicons name="swap-vertical-outline" size={16} color="#4A7DFF" />
            <Text style={styles.sortTriggerText}>
              Sort: {sortOptions.find(s => s.key === selectedSort)?.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results Grid/List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A7DFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#8A8AAE" />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters or search terms</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={isDesktop ? 4 : 2}
          contentContainerStyle={[styles.gridContent, isDesktop && styles.gridContentDesktop]}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={isDesktop ? styles.columnWrapper : undefined}
        />
      )}

      {renderSortModal()}
    </View>
  );
};

// --- Main Component (Wrapped with ResponsiveLayout) ---
export const ExploreScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout 
      currentRoute="Explore" 
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      <ExploreContent navigation={navigation} />
    </ResponsiveLayout>
  );
};

const styles = StyleSheet.create({
  // ============================================================
  // DESKTOP STYLES
  // ============================================================
  containerDesktop: {
    backgroundColor: '#F8F9FC',
    padding: 24,
  },
  desktopHeader: {
    marginBottom: 20,
  },
  desktopHeaderTitle: {
    color: '#1F2F5F',
    fontSize: 32,
    fontWeight: 'bold',
  },
  desktopHeaderSubtitle: {
    color: '#8A8AAE',
    fontSize: 16,
    marginTop: 4,
  },
  searchContainerDesktop: {
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 12,
  },
  sortButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  sortButtonDesktopText: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: '500',
  },
  sortTriggerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sortTriggerText: {
    color: '#4A7DFF',
    fontSize: 13,
    fontWeight: '500',
  },
  gridContentDesktop: {
    padding: 0,
    gap: 16,
  },
  columnWrapper: {
    gap: 16,
  },
  itemCardDesktop: {
    marginBottom: 0,
  },
  itemImageDesktop: {
    height: 160,
  },

  // ============================================================
  // MOBILE STYLES
  // ============================================================
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2F5F',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#1F2F5F',
    fontSize: 14,
    padding: 0,
  },
  sortButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F5F7FA',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E8ECF4',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    borderColor: '#4A7DFF',
  },
  filterChipText: {
    color: '#8A8AAE',
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#4A7DFF',
  },
  filterChipBadge: {
    backgroundColor: '#4A7DFF',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  filterChipBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  resultsCount: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  gridContent: {
    padding: 8,
    gap: 8,
  },
  itemCard: {
    flex: 1,
    margin: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  itemImage: {
    width: '100%',
    height: 120,
  },
  itemInfo: {
    padding: 10,
  },
  itemTitle: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '600',
  },
  itemShop: {
    color: '#8A8AAE',
    fontSize: 11,
    marginTop: 2,
  },
  itemPrice: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemRating: {
    color: '#F1C40F',
    fontSize: 11,
  },
  serviceBadge: {
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  serviceBadgeText: {
    color: '#6C5CE7',
    fontSize: 9,
    fontWeight: '500',
  },
  inStockBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  inStockBadgeText: {
    color: '#2ECC71',
    fontSize: 9,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#1F2F5F',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 4,
  },
  // List View Styles
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  listItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemTitle: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
  },
  listItemShop: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  listItemPrice: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  listItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  listItemRating: {
    color: '#F1C40F',
    fontSize: 12,
  },
  listItemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  listItemBadgeText: {
    fontSize: 9,
    fontWeight: '500',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  sortOptionActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.05)',
  },
  sortOptionText: {
    color: '#1F2F5F',
    fontSize: 16,
  },
  sortOptionTextActive: {
    color: '#4A7DFF',
    fontWeight: '500',
  },
});