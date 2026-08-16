import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

type Shop = Database['public']['Tables']['shops']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type CatalogItem = Database['public']['Tables']['catalog']['Row'];
type ServiceCatalogItem = Database['public']['Tables']['service_catalog']['Row'];
type ShopProduct = Database['public']['Tables']['shop_products']['Row'];
type ProviderService = Database['public']['Tables']['provider_services']['Row'];
type ProductAttribute = Database['public']['Tables']['product_attributes']['Row'];
type ProductAttributeValue = Database['public']['Tables']['product_attribute_values']['Row'];

// --- Business Type Configuration ---
const BUSINESS_CONFIGS: Record<string, any> = {
  shop: {
    offeringLabel: 'Products',
    offeringIcon: 'cube-outline',
    activityLabel: 'Orders',
    activityIcon: 'receipt-outline',
    statuses: ['New', 'Confirmed', 'Preparing', 'Ready', 'Shipped', 'Completed', 'Cancelled'],
    stats: ['Revenue', 'Orders', 'Customers', 'Products'],
    quickActions: ['Browse Catalog', 'View Orders', 'Analytics', 'Business Settings'],
    catalogTable: 'catalog',
    offeringTable: 'shop_products',
    foreignKey: 'catalog_id',
    priceField: 'regular_price',
    stockField: 'in_stock',
    activeField: 'in_stock',
    sellerSpecsField: 'seller_specifications',
    supportsAttributes: true,
  },
  service: {
    offeringLabel: 'Services',
    offeringIcon: 'construct-outline',
    activityLabel: 'Bookings',
    activityIcon: 'calendar-outline',
    statuses: ['Requested', 'Accepted', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    stats: ['Revenue', 'Bookings', 'Customers', 'Services'],
    quickActions: ['Browse Catalog', 'View Bookings', 'Set Availability', 'Business Settings'],
    catalogTable: 'service_catalog',
    offeringTable: 'provider_services',
    foreignKey: 'service_id',
    priceField: 'price',
    activeField: 'is_active',
    sellerSpecsField: null,
    supportsAttributes: false,
  },
  institution: {
    offeringLabel: 'Offerings',
    offeringIcon: 'business-outline',
    activityLabel: 'Reservations',
    activityIcon: 'calendar-outline',
    statuses: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
    stats: ['Revenue', 'Reservations', 'Customers', 'Offerings'],
    quickActions: ['Browse Catalog', 'View Reservations', 'Business Hours', 'Business Settings'],
    catalogTable: 'service_catalog',
    offeringTable: 'provider_services',
    foreignKey: 'service_id',
    priceField: 'price',
    activeField: 'is_active',
    sellerSpecsField: null,
    supportsAttributes: false,
  },
};

// --- Main Component ---
export const BusinessDashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Shop | null>(null);
  const [businessType, setBusinessType] = useState<string>('shop');
  const [category, setCategory] = useState<string>('');
  const [config, setConfig] = useState<any>(BUSINESS_CONFIGS.shop);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState<Transaction[]>([]);
  
  // --- Catalog Browser States ---
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState<any[]>([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('All');
  const [catalogCategories, setCatalogCategories] = useState<string[]>([]);
  
  // --- Offering Customization States ---
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customOffering, setCustomOffering] = useState<any>({
    price: '',
    discount: '',
    discountType: 'percentage',
    specifications: {} as Record<string, any>,
    attributeValues: {} as Record<string, string>,
    in_stock: true,
    is_active: true,
    custom_name: '',
    custom_description: '',
    custom_images: [] as string[],
    stock: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([]);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // 1. Get business data
      const { data: businessData, error: businessError } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (businessError) {
        console.error('Business load error:', businessError);
        setLoading(false);
        return;
      }

      if (!businessData || businessData.length === 0) {
        setLoading(false);
        return;
      }

      const shop = businessData[0];
      setBusiness(shop);
      
      const bizType = shop.business_type || 'shop';
      setBusinessType(bizType);
      setCategory(shop.category || '');

      const bizConfig = BUSINESS_CONFIGS[bizType] || BUSINESS_CONFIGS.shop;
      setConfig(bizConfig);

      // 2. Get wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('transactions')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!walletError && walletData) {
        const totalBalance = walletData
          .filter((transaction) => transaction.status === 'completed')
          .reduce(
            (sum: number, transaction) =>
              sum + (transaction.seller_received ?? transaction.amount ?? 0),
            0,
          );
        setWalletBalance(totalBalance);
        setWalletTransactions(walletData);
      }

      // 3. Get activity
      const { data: activityData, error: activityError } = await supabase
        .from('transactions')
        .select(`
          *,
          users:user_id (
            full_name,
            phone_number
          )
        `)
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!activityError && activityData) {
        setRecentActivity(activityData);
      }

      // 4. Get offerings based on business type
      await loadOfferings(shop, bizType);

      // 5. Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayActivity: Transaction[] =
        activityData?.filter(
          (activity) => activity.created_at?.startsWith(today),
        ) ?? [];

      const todayRevenue = todayActivity.reduce(
        (sum: number, activity: Transaction) =>
          sum + (activity.seller_received ?? activity.amount ?? 0),
        0,
      );

      setStats({
        revenue: todayRevenue,
        activityCount: activityData?.length || 0,
        customers: new Set(activityData?.map((a: any) => a.user_id)).size || 0,
        offerings: offerings.length,
        rating: shop.rating || 0,
        reviews: shop.review_count || 0,
      });

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Load offerings separately
const loadOfferings = async (shop: Shop, bizType: string) => {
  if (bizType === 'shop') {
    // SIMPLIFIED QUERY - try without the join first
    const { data: productData, error: productError } = await supabase
      .from('shop_products')
      .select(`
        *,
        catalog:catalog_id (
          id,
          name,
          description,
          images,
          specifications,
          category,
          brand
        )
      `)
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });

    if (productError) {
      console.error('Product load error:', productError);
      // If the join fails, try without it
      if (productError.code === 'PGRST200' || productError.message?.includes('could not find')) {
        console.log('⚠️ Join failed, trying without join...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('shop_products')
          .select('*')
          .eq('shop_id', shop.id)
          .order('created_at', { ascending: false });
        
        if (!fallbackError && fallbackData) {
          setOfferings(fallbackData);
        }
        return;
      }
      return;
    }
    
    if (productData) {
      setOfferings(productData);
    }
  } else if (bizType === 'service' || bizType === 'institution') {
    if (shop.owner_id) {
      const { data: serviceData, error: serviceError } = await supabase
        .from('provider_services')
        .select(`
          *,
          service_catalog:service_id (
            id,
            name,
            description,
            images,
            duration,
            category,
            specifications
          )
        `)
        .eq('user_id', shop.owner_id)
        .order('created_at', { ascending: false });

      if (serviceError) {
        console.error('Service load error:', serviceError);
        // Fallback without join
        if (serviceError.code === 'PGRST200' || serviceError.message?.includes('could not find')) {
          console.log('⚠️ Join failed, trying without join...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('provider_services')
            .select('*')
            .eq('user_id', shop.owner_id)
            .order('created_at', { ascending: false });
          
          if (!fallbackError && fallbackData) {
            setOfferings(fallbackData);
          }
        }
        return;
      }

      if (serviceData) {
        setOfferings(serviceData);
      }
    }
  }
};

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  // --- Get the correct catalog table based on business type ---
  const getCatalogTable = () => {
    return config.catalogTable || 'catalog';
  };

  // --- Get the correct offering table based on business type ---
  const getOfferingTable = () => {
    return config.offeringTable || 'shop_products';
  };

  // --- Catalog Search ---
  const searchCatalog = async (query: string, categoryFilter: string = 'All') => {
    setCatalogSearchQuery(query);
    setCatalogCategoryFilter(categoryFilter);
    
    const table = getCatalogTable();
    setCatalogLoading(true);
    
    try {
      let supabaseQuery = supabase
        .from(table)
        .select('*')
        .order('name');

      if (query.trim()) {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);
      }

      if (categoryFilter !== 'All') {
        supabaseQuery = supabaseQuery.eq('category', categoryFilter);
      }

      supabaseQuery = supabaseQuery.limit(30);

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('Catalog search error:', error);
        return;
      }

      setCatalogResults(data || []);

      // Extract unique categories
      const categories = ['All', ...new Set(data?.map((item: any) => item.category).filter(Boolean))];
      setCatalogCategories(categories);

    } catch (error) {
      console.error('Catalog search error:', error);
    } finally {
      setCatalogLoading(false);
    }
  };

  // --- Open Catalog Browser ---
  const openCatalogBrowser = () => {
    setShowCatalogModal(true);
    setCatalogSearchQuery('');
    setCatalogCategoryFilter('All');
    searchCatalog('', 'All');
  };

  // --- Select Catalog Item ---
  const handleSelectCatalogItem = async (item: any) => {
    setSelectedCatalogItem(item);
    
    // Pre-fill customization with catalog data
    const specs = item.specifications || {};
    const editableSpecs: Record<string, any> = {};
    Object.keys(specs).forEach(key => {
      editableSpecs[key] = specs[key] || '';
    });

    setCustomOffering({
      price: '',
      discount: '',
      discountType: 'percentage',
      specifications: editableSpecs,
      attributeValues: {},
      in_stock: true,
      is_active: true,
      custom_name: item.name || '',
      custom_description: item.description || '',
      custom_images: item.images || [],
      stock: '',
    });

    // If shop and supports attributes, load product attributes
    if (businessType === 'shop' && config.supportsAttributes) {
      await loadProductAttributes(item.id);
    }

    setShowCatalogModal(false);
    setShowCustomizeModal(true);
  };

  // --- Load Product Attributes ---
  const loadProductAttributes = async (catalogId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('catalog_id', catalogId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error loading attributes:', error);
        return;
      }

      setProductAttributes(data || []);
      
      // Initialize attribute values
      const attributeValues: Record<string, string> = {};
      data?.forEach((attr: ProductAttribute) => {
        attributeValues[attr.attribute_name] = '';
      });
      
      setCustomOffering((prev: any) => ({
        ...prev,
        attributeValues,
      }));
      
    } catch (error) {
      console.error('Error loading attributes:', error);
    }
  };

  // --- Pick Images ---
  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const imageUris = result.assets.map(asset => asset.uri);
        setCustomOffering((prev: any) => ({
          ...prev,
          custom_images: [...prev.custom_images, ...imageUris],
        }));
      }
    } catch (error) {
      console.error('Image pick error:', error);
      Alert.alert('Error', 'Failed to pick images.');
    }
  };

  // --- Remove Image ---
  const removeImage = (index: number) => {
    setCustomOffering((prev: any) => ({
      ...prev,
      custom_images: prev.custom_images.filter((_: any, i: number) => i !== index),
    }));
  };

  // --- Add Offering with Customization ---
  const handleAddCustomizedOffering = async () => {
    if (!business || !selectedCatalogItem) {
      Alert.alert('Error', 'No item selected');
      return;
    }

    if (!customOffering.price || parseFloat(customOffering.price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setSaving(true);
    try {
      const price = parseFloat(customOffering.price);
      const discount = customOffering.discount ? parseFloat(customOffering.discount) : 0;
      
      let finalPrice = price;
      if (discount > 0) {
        if (customOffering.discountType === 'percentage') {
          finalPrice = price - (price * discount / 100);
        } else {
          finalPrice = price - discount;
        }
      }

      // --- Step 1: Insert into the appropriate table ---
      let offeringId: string | null = null;
      let shopProductId: string | null = null;

      if (businessType === 'shop') {
        // For shops: insert into shop_products
        const offeringData = {
          shop_id: business.id,
          catalog_id: selectedCatalogItem.id,
          regular_price: finalPrice,
          in_stock: customOffering.in_stock,
          seller_specifications: customOffering.specifications || {},
        };

        console.log('📤 Inserting into shop_products:', offeringData);

        const { data, error } = await supabase
          .from('shop_products')
          .insert(offeringData)
          .select()
          .single();

        if (error) {
          console.error('❌ Shop product insert error:', error);
          
          // Check for specific foreign key errors
          if (error.message?.includes('catalog_id')) {
            throw new Error('Invalid catalog item. Please try again.');
          }
          if (error.message?.includes('shop_id')) {
            throw new Error('Invalid shop. Please contact support.');
          }
          throw error;
        }

        offeringId = data.id;
        shopProductId = data.id;
        console.log('✅ Shop product created:', offeringId);

        // --- Step 2: Handle product attributes for shops ---
        if (config.supportsAttributes && Object.keys(customOffering.attributeValues).length > 0) {
          await handleProductAttributes(selectedCatalogItem.id, shopProductId);
        }

      } else {
        // For services and institutions: insert into provider_services
        const offeringData: any = {
          user_id: business.owner_id,
          service_id: selectedCatalogItem.id,
          price: finalPrice,
          is_active: customOffering.is_active,
        };

        if (businessType === 'institution') {
          offeringData.institution_id = business.id;
        }

        console.log('📤 Inserting into provider_services:', offeringData);

        const { data, error } = await supabase
          .from('provider_services')
          .insert(offeringData)
          .select()
          .single();

        if (error) {
          console.error('❌ Provider service insert error:', error);
          
          if (error.message?.includes('service_id')) {
            throw new Error('Invalid service. Please try again.');
          }
          if (error.message?.includes('user_id')) {
            throw new Error('Invalid user. Please contact support.');
          }
          throw error;
        }

        offeringId = data.id;
        console.log('✅ Provider service created:', offeringId);
      }

      Alert.alert(
        'Success', 
        `${config.offeringLabel.slice(0, -1)} added successfully!`,
        [{ text: 'OK' }]
      );
      
      // Reset and refresh
      setShowCustomizeModal(false);
      setSelectedCatalogItem(null);
      setProductAttributes([]);
      setCustomOffering({
        price: '',
        discount: '',
        discountType: 'percentage',
        specifications: {},
        attributeValues: {},
        in_stock: true,
        is_active: true,
        custom_name: '',
        custom_description: '',
        custom_images: [],
        stock: '',
      });
      loadDashboard();

    } catch (error: any) {
      console.error('❌ Add offering error:', error);
      Alert.alert('Error', error.message || 'Failed to add offering');
    } finally {
      setSaving(false);
    }
  };

  // --- Handle Product Attributes ---
  const handleProductAttributes = async (catalogId: string, productId: string) => {
    try {
      const attributeValues = customOffering.attributeValues || {};
const entries = Object.entries(attributeValues).filter(([_, value]) => 
  value && typeof value === 'string' && value.trim() !== ''
);
      if (entries.length === 0) {
        console.log('No attribute values to save');
        return;
      }

      console.log('📤 Saving product attributes:', entries);

      for (const [attributeName, value] of entries) {
        // 1. Find existing product_attribute or create one
        let { data: existingAttribute, error: findError } = await supabase
          .from('product_attributes')
          .select('id')
          .eq('catalog_id', catalogId)
          .eq('attribute_name', attributeName)
          .single();

        if (findError && findError.code !== 'PGRST116') {
          console.error('Error finding attribute:', findError);
          continue;
        }

        let attributeId: string;

        if (!existingAttribute) {
          // Create new product_attribute
          const { data: newAttr, error: createError } = await supabase
  .from('product_attributes')
  .insert({
    catalog_id: catalogId,
    attribute_name: attributeName,
    attribute_value: typeof value === 'string' ? value : String(value),
    attribute_type: 'text',
  })
  .select()
  .single();

          if (createError) {
            console.error('Error creating attribute:', createError);
            continue;
          }
          attributeId = newAttr.id;
        } else {
          attributeId = existingAttribute.id;
        }

        // 2. Insert into product_attribute_values
        const { error: valueError } = await supabase
  .from('product_attribute_values')
  .insert({
    product_id: productId,
    attribute_id: attributeId,
    value: typeof value === 'string' ? value : String(value),
  });

        if (valueError) {
          console.error('Error inserting attribute value:', valueError);
          // If duplicate, update instead
          if (valueError.code === '23505') {
            const { error: updateError } = await supabase
  .from('product_attribute_values')
  .update({ value: typeof value === 'string' ? value : String(value) })
  .eq('product_id', productId)
  .eq('attribute_id', attributeId);
            if (updateError) {
              console.error('Error updating attribute value:', updateError);
            }
          }
        }
      }

      console.log('✅ Product attributes saved successfully');

    } catch (error) {
      console.error('Error handling product attributes:', error);
    }
  };

  // --- Render Catalog Browser ---
  const renderCatalogBrowser = () => (
    <Modal
      visible={showCatalogModal}
      transparent={false}
      animationType="slide"
      onRequestClose={() => setShowCatalogModal(false)}
    >
      <SafeAreaView style={styles.modalFullScreen}>
        <View style={styles.modalFullHeader}>
          <TouchableOpacity onPress={() => setShowCatalogModal(false)}>
            <Ionicons name="arrow-back" size={24} color="#1F2F5F" />
          </TouchableOpacity>
          <Text style={styles.modalFullTitle}>Browse {config.offeringLabel}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8A8AAE" />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${config.offeringLabel.toLowerCase()}...`}
              placeholderTextColor="#8A8AAE"
              value={catalogSearchQuery}
              onChangeText={(text) => searchCatalog(text, catalogCategoryFilter)}
            />
            {catalogSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => searchCatalog('', catalogCategoryFilter)}>
                <Ionicons name="close-circle" size={20} color="#8A8AAE" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filters */}
        {catalogCategories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilters}
            contentContainerStyle={styles.categoryFiltersContent}
          >
            {catalogCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryFilterChip,
                  catalogCategoryFilter === cat && styles.categoryFilterChipActive,
                ]}
                onPress={() => searchCatalog(catalogSearchQuery, cat)}
              >
                <Text
                  style={[
                    styles.categoryFilterText,
                    catalogCategoryFilter === cat && styles.categoryFilterTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {catalogLoading ? (
          <View style={styles.catalogLoading}>
            <ActivityIndicator size="large" color="#4A7DFF" />
            <Text style={styles.catalogLoadingText}>Loading catalog...</Text>
          </View>
        ) : catalogResults.length === 0 ? (
          <View style={styles.catalogEmpty}>
            <Ionicons name="search-outline" size={48} color="#8A8AAE" />
            <Text style={styles.catalogEmptyTitle}>No items found</Text>
            <Text style={styles.catalogEmptySubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          <FlatList
            data={catalogResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.catalogItemCard}
                onPress={() => handleSelectCatalogItem(item)}
              >
                <Image
                  source={{ uri: item.images?.[0] || 'https://via.placeholder.com/80' }}
                  style={styles.catalogItemImage}
                />
                <View style={styles.catalogItemInfo}>
                  <Text style={styles.catalogItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.catalogItemCategory}>
                    {item.category || 'Uncategorized'}
                  </Text>
                  {item.brand && (
                    <Text style={styles.catalogItemBrand}>🏷️ {item.brand}</Text>
                  )}
                  {item.duration && (
                    <Text style={styles.catalogItemDuration}>⏱️ {item.duration}</Text>
                  )}
                </View>
                <View style={styles.catalogItemSelect}>
                  <Ionicons name="chevron-forward" size={20} color="#4A7DFF" />
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.catalogListContent}
          />
        )}
      </SafeAreaView>
    </Modal>
  );

  // --- Render Customization Modal ---
  const renderCustomizeModal = () => (
    <Modal
      visible={showCustomizeModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setShowCustomizeModal(false);
        setSelectedCatalogItem(null);
        setProductAttributes([]);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Customize {config.offeringLabel.slice(0, -1)}
            </Text>
            <TouchableOpacity onPress={() => {
              setShowCustomizeModal(false);
              setSelectedCatalogItem(null);
              setProductAttributes([]);
            }}>
              <Ionicons name="close" size={24} color="#8A8AAE" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Catalog Item Preview */}
            {selectedCatalogItem && (
              <View style={styles.catalogPreview}>
                <Image
                  source={{ uri: selectedCatalogItem.images?.[0] || 'https://via.placeholder.com/100' }}
                  style={styles.catalogPreviewImage}
                />
                <View style={styles.catalogPreviewInfo}>
                  <Text style={styles.catalogPreviewName}>{selectedCatalogItem.name}</Text>
                  <Text style={styles.catalogPreviewCategory}>
                    {selectedCatalogItem.category}
                  </Text>
                </View>
              </View>
            )}

            {/* Price */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Your Price (UGX) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter your price"
                placeholderTextColor="#8A8AAE"
                keyboardType="numeric"
                value={customOffering.price}
                onChangeText={(text) => setCustomOffering((prev: any) => ({ ...prev, price: text }))}
              />
            </View>

            {/* Discount */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Discount</Text>
              <View style={styles.discountRow}>
                <TextInput
                  style={[styles.formInput, styles.discountInput]}
                  placeholder="0"
                  placeholderTextColor="#8A8AAE"
                  keyboardType="numeric"
                  value={customOffering.discount}
                  onChangeText={(text) => setCustomOffering((prev: any) => ({ ...prev, discount: text }))}
                />
                <View style={styles.discountTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.discountTypeBtn,
                      customOffering.discountType === 'percentage' && styles.discountTypeActive,
                    ]}
                    onPress={() => setCustomOffering((prev: any) => ({ ...prev, discountType: 'percentage' }))}
                  >
                    <Text style={[styles.discountTypeText, customOffering.discountType === 'percentage' && styles.discountTypeTextActive]}>
                      %
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.discountTypeBtn,
                      customOffering.discountType === 'fixed' && styles.discountTypeActive,
                    ]}
                    onPress={() => setCustomOffering((prev: any) => ({ ...prev, discountType: 'fixed' }))}
                  >
                    <Text style={[styles.discountTypeText, customOffering.discountType === 'fixed' && styles.discountTypeTextActive]}>
                      UGX
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Stock (for shops) */}
            {businessType === 'shop' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Stock Quantity</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter stock quantity"
                  placeholderTextColor="#8A8AAE"
                  keyboardType="numeric"
                  value={customOffering.stock}
                  onChangeText={(text) => setCustomOffering((prev: any) => ({ ...prev, stock: text }))}
                />
              </View>
            )}

            {/* Custom Images */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Your Images</Text>
              <View style={styles.imageUploadRow}>
                {customOffering.custom_images.map((uri: string, index: number) => (
                  <View key={index} style={styles.imagePreviewContainer}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.imageRemoveBtn}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#E74C3C" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.imageAddBtn} onPress={pickImages}>
                  <Ionicons name="camera" size={24} color="#4A7DFF" />
                  <Text style={styles.imageAddText}>Add Photos</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Custom Name & Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Custom Name (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Override the default name"
                placeholderTextColor="#8A8AAE"
                value={customOffering.custom_name}
                onChangeText={(text) => setCustomOffering((prev: any) => ({ ...prev, custom_name: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Custom Description (Optional)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Override the default description"
                placeholderTextColor="#8A8AAE"
                multiline
                numberOfLines={3}
                value={customOffering.custom_description}
                onChangeText={(text) => setCustomOffering((prev: any) => ({ ...prev, custom_description: text }))}
              />
            </View>

            {/* Specifications */}
            {Object.keys(customOffering.specifications).length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Specifications</Text>
                {Object.keys(customOffering.specifications).map((key) => (
                  <View key={key} style={styles.specRow}>
                    <Text style={styles.specLabel}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                    <TextInput
                      style={styles.specInput}
                      placeholder={`Enter ${key}`}
                      placeholderTextColor="#8A8AAE"
                      value={customOffering.specifications[key] || ''}
                      onChangeText={(text) => {
                        setCustomOffering((prev: any) => ({
                          ...prev,
                          specifications: { ...prev.specifications, [key]: text }
                        }));
                      }}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Product Attributes (for shops) */}
            {businessType === 'shop' && productAttributes.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Product Attributes</Text>
                {productAttributes.map((attr: ProductAttribute) => (
                  <View key={attr.id} style={styles.specRow}>
                    <Text style={styles.specLabel}>
                      {attr.attribute_name}
                    </Text>
                    <TextInput
                      style={styles.specInput}
                      placeholder={`Enter ${attr.attribute_name}`}
                      placeholderTextColor="#8A8AAE"
                      value={customOffering.attributeValues[attr.attribute_name] || ''}
                      onChangeText={(text) => {
                        setCustomOffering((prev: any) => ({
                          ...prev,
                          attributeValues: { 
                            ...prev.attributeValues, 
                            [attr.attribute_name]: text 
                          }
                        }));
                      }}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Toggles */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>
                {businessType === 'shop' ? 'In Stock' : 'Available'}
              </Text>
              <Switch
                value={customOffering.in_stock}
                onValueChange={(value) => setCustomOffering((prev: any) => ({ ...prev, in_stock: value }))}
                trackColor={{ false: '#E8ECF4', true: '#4A7DFF' }}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Visible to Customers</Text>
              <Switch
                value={customOffering.is_active}
                onValueChange={(value) => setCustomOffering((prev: any) => ({ ...prev, is_active: value }))}
                trackColor={{ false: '#E8ECF4', true: '#4A7DFF' }}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalSubmit, saving && styles.modalSubmitDisabled]}
              onPress={handleAddCustomizedOffering}
              disabled={saving}
            >
              <LinearGradient
                colors={['#4A7DFF', '#6B94FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalSubmitGradient}
              >
                <Text style={styles.modalSubmitText}>
                  {saving ? 'Publishing...' : `Publish ${config.offeringLabel.slice(0, -1)}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // --- Render Stats ---
  const renderStats = () => {
    const statItems = [
      { 
        icon: '💰', 
        label: config.stats[0] || 'Revenue', 
        value: `UGX ${stats.revenue?.toLocaleString() || 0}`,
        color: '#4A7DFF' 
      },
      { 
        icon: '📦', 
        label: config.stats[1] || 'Orders', 
        value: stats.activityCount?.toString() || '0',
        color: '#2ECC71' 
      },
      { 
        icon: '👥', 
        label: config.stats[2] || 'Customers', 
        value: stats.customers?.toString() || '0',
        color: '#F1C40F' 
      },
      { 
        icon: '📋', 
        label: config.stats[3] || 'Products', 
        value: stats.offerings?.toString() || '0',
        color: '#E74C3C' 
      },
    ];

    const lastStatIndex = statItems.length - 1;
    statItems[lastStatIndex].label = config.offeringLabel || 'Offerings';

    return (
      <View style={styles.statsGrid}>
        {statItems.map((stat, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: stat.color + '10' }]}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  // --- Render Quick Actions ---
  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      {(config.quickActions || []).map((action: string, index: number) => {
        let icon = '';
        let onPress = () => {};

        switch(action) {
          case 'Browse Catalog':
            icon = 'grid-outline';
            onPress = openCatalogBrowser;
            break;
          case 'View Orders':
          case 'View Bookings':
          case 'View Reservations':
            icon = 'list-outline';
            onPress = () => setActiveTab('activity');
            break;
          case 'Set Availability':
          case 'Business Hours':
            icon = 'time-outline';
            onPress = () => console.log('Set availability');
            break;
          case 'Analytics':
            icon = 'analytics-outline';
            onPress = () => console.log('Analytics');
            break;
          case 'Business Settings':
            icon = 'settings-outline';
            onPress = () => setActiveTab('business');
            break;
          default:
            icon = 'apps-outline';
        }

        return (
          <TouchableOpacity key={index} style={styles.quickAction} onPress={onPress}>
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(74, 125, 255, 0.1)' }]}>
              <Ionicons name={icon as any} size={24} color="#4A7DFF" />
            </View>
            <Text style={styles.quickActionLabel}>{action}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // --- Render Recent Activity ---
  const renderRecentActivity = () => (
    <View style={styles.recentActivity}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent {config.activityLabel}</Text>
        <TouchableOpacity onPress={() => setActiveTab('activity')}>
          <Text style={styles.sectionLink}>View All</Text>
        </TouchableOpacity>
      </View>
      {recentActivity.length === 0 ? (
        <Text style={styles.noDataText}>No {config.activityLabel.toLowerCase()} yet.</Text>
      ) : (
        recentActivity.map((item, index) => {
          const status = item.status || 'pending';
          const statusColors: Record<string, any> = {
            completed: { bg: 'rgba(46, 204, 113, 0.1)', color: '#2ECC71' },
            pending: { bg: 'rgba(241, 196, 15, 0.1)', color: '#F1C40F' },
            confirmed: { bg: 'rgba(74, 125, 255, 0.1)', color: '#4A7DFF' },
            cancelled: { bg: 'rgba(231, 76, 60, 0.1)', color: '#E74C3C' },
          };
          const statusStyle = statusColors[status] || statusColors.pending;

          return (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle}>
                  {item.type || config.activityLabel.slice(0, -1)}
                </Text>
                <Text style={styles.activityAmount}>UGX {item.amount?.toLocaleString() || 0}</Text>
              </View>
              <View style={styles.activityFooter}>
                <Text style={styles.activityCustomer}>
                  {item.users?.full_name || 'Customer'}
                </Text>
                <View style={[styles.activityStatus, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.activityStatusText, { color: statusStyle.color }]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  // --- Render Offerings ---
  const renderOfferings = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{config.offeringLabel} ({offerings.length})</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCatalogBrowser}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Browse Catalog</Text>
        </TouchableOpacity>
      </View>

      {offerings.length === 0 ? (
        <View style={styles.emptyOfferings}>
          <Ionicons name={config.offeringIcon} size={48} color="#8A8AAE" />
          <Text style={styles.emptyOfferingsTitle}>No {config.offeringLabel.toLowerCase()} yet</Text>
          <Text style={styles.emptyOfferingsSubtext}>
            Browse the catalog to add {config.offeringLabel.toLowerCase()} to your shop
          </Text>
          <TouchableOpacity style={styles.browseCatalogBtn} onPress={openCatalogBrowser}>
            <Text style={styles.browseCatalogBtnText}>Browse Catalog</Text>
          </TouchableOpacity>
        </View>
      ) : (
        offerings.map((item, index) => {
          const catalogData = item.catalog || item.service_catalog || {};
          const name = catalogData.name || item.name || 'Offering';
          const price = item.regular_price || item.price || 0;
          const images = catalogData.images || [];
          
          return (
            <View key={index} style={styles.offeringCard}>
              {images.length > 0 ? (
                <Image source={{ uri: images[0] }} style={styles.offeringImage} />
              ) : (
                <View style={[styles.offeringImage, styles.offeringImagePlaceholder]}>
                  <Text style={styles.offeringImageText}>📦</Text>
                </View>
              )}
              <View style={styles.offeringInfo}>
                <Text style={styles.offeringName}>{name}</Text>
                <Text style={styles.offeringPrice}>UGX {price.toLocaleString()}</Text>
                <View style={styles.offeringStats}>
                  {businessType === 'shop' ? (
                    <>
                      <Text style={styles.offeringStat}>👁️ {item.views || 0}</Text>
                      <Text style={styles.offeringStat}>🛒 {item.sales || 0}</Text>
                      <Text style={[styles.offeringStock, { color: item.in_stock ? '#2ECC71' : '#E74C3C' }]}>
                        {item.in_stock ? 'In Stock' : 'Out of Stock'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.offeringStat}>📅 {catalogData.duration || 'N/A'}</Text>
                      <Text style={[styles.offeringStock, { color: item.is_active ? '#2ECC71' : '#E74C3C' }]}>
                        {item.is_active ? 'Available' : 'Unavailable'}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.offeringAction}>
                <Ionicons name="create-outline" size={20} color="#4A7DFF" />
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );

  // --- Render Activity ---
  const renderActivity = () => {
    const statuses = config.statuses || ['All', 'Pending', 'Completed', 'Cancelled'];

    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{config.activityLabel}</Text>
          <View style={styles.filterChips}>
            {statuses.slice(0, 4).map((status: string) => (
              <TouchableOpacity key={status} style={[styles.filterChip, status === 'All' && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, status === 'All' && styles.filterChipTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {recentActivity.length === 0 ? (
          <Text style={styles.noDataText}>No {config.activityLabel.toLowerCase()} found.</Text>
        ) : (
          recentActivity.map((item, index) => {
            const status = item.status || 'pending';
            const statusColors: Record<string, any> = {
              completed: { bg: 'rgba(46, 204, 113, 0.1)', color: '#2ECC71' },
              pending: { bg: 'rgba(241, 196, 15, 0.1)', color: '#F1C40F' },
              confirmed: { bg: 'rgba(74, 125, 255, 0.1)', color: '#4A7DFF' },
              cancelled: { bg: 'rgba(231, 76, 60, 0.1)', color: '#E74C3C' },
              'in progress': { bg: 'rgba(74, 125, 255, 0.1)', color: '#4A7DFF' },
            };
            const statusStyle = statusColors[status] || statusColors.pending;
            const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);

            return (
              <View key={index} style={styles.activityCard}>
                <View style={styles.activityCardHeader}>
                  <Text style={styles.activityCardId}>#{item.reference || item.id?.slice(0, 8)}</Text>
                  <View style={[styles.activityCardStatus, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.activityCardStatusText, { color: statusStyle.color }]}>
                      {statusDisplay}
                    </Text>
                  </View>
                </View>
                <View style={styles.activityCardBody}>
                  <Text style={styles.activityCardCustomer}>
                    {item.users?.full_name || 'Customer'}
                  </Text>
                  <Text style={styles.activityCardAmount}>
                    UGX {item.amount?.toLocaleString() || 0}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  };

  // --- Render Wallet ---
  const renderWallet = () => (
    <View style={styles.tabContent}>
      <View style={styles.walletSummary}>
        <View style={styles.walletBalanceCard}>
          <Text style={styles.walletBalanceLabel}>Available Balance</Text>
          <View style={styles.walletBalanceRow}>
            <Text style={styles.walletBalanceAmount}>
              {balanceVisible ? `UGX ${walletBalance.toLocaleString()}` : '****'}
            </Text>
            <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
              <Ionicons 
                name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} 
                size={20} 
                color="#8A8AAE" 
              />
            </TouchableOpacity>
          </View>
          <View style={styles.walletBalanceActions}>
            <TouchableOpacity style={styles.walletActionBtn}>
              <Ionicons name="arrow-down-outline" size={16} color="#FFFFFF" />
              <Text style={styles.walletActionBtnText}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.walletActionBtn, styles.walletActionBtnSecondary]}>
              <Ionicons name="arrow-up-outline" size={16} color="#4A7DFF" />
              <Text style={styles.walletActionBtnTextSecondary}>Add Funds</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.walletStats}>
          <View style={styles.walletStat}>
            <Text style={styles.walletStatValue}>UGX {walletBalance.toLocaleString()}</Text>
            <Text style={styles.walletStatLabel}>Total Earnings</Text>
          </View>
          <View style={styles.walletStatDivider} />
          <View style={styles.walletStat}>
            <Text style={styles.walletStatValue}>{recentActivity.length}</Text>
            <Text style={styles.walletStatLabel}>Transactions</Text>
          </View>
          <View style={styles.walletStatDivider} />
          <View style={styles.walletStat}>
            <Text style={styles.walletStatValue}>UGX 0</Text>
            <Text style={styles.walletStatLabel}>Pending</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity>
          <Text style={styles.sectionLink}>View All</Text>
        </TouchableOpacity>
      </View>

      {walletTransactions.length === 0 ? (
        <Text style={styles.noDataText}>No transactions yet.</Text>
      ) : (
        walletTransactions.map((item, index) => (
          <View key={index} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <View style={[styles.transactionIcon, { backgroundColor: item.amount > 0 ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)' }]}>
                <Ionicons name={item.amount > 0 ? 'arrow-down' : 'arrow-up'} size={16} color={item.amount > 0 ? '#2ECC71' : '#E74C3C'} />
              </View>
              <View>
                <Text style={styles.transactionTitle}>{item.type || 'Transaction'}</Text>
                <Text style={styles.transactionDate}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                </Text>
              </View>
            </View>
            <Text style={[styles.transactionAmount, { color: item.amount > 0 ? '#2ECC71' : '#E74C3C' }]}>
              {item.amount > 0 ? '+' : ''}UGX {Math.abs(item.amount || 0).toLocaleString()}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  // --- Render Business Settings ---
  const renderBusiness = () => (
    <View style={styles.tabContent}>
      <View style={styles.businessProfile}>
        <View style={styles.businessHeader}>
          <View style={styles.businessLogoContainer}>
            <View style={styles.businessLogo}>
              <Text style={styles.businessLogoText}>
                {business?.name?.charAt(0)?.toUpperCase() || 'B'}
              </Text>
            </View>
            <View style={[styles.businessVerified, { backgroundColor: business?.is_verified ? '#2ECC71' : '#F1C40F' }]}>
              <Text style={styles.businessVerifiedText}>
                {business?.is_verified ? '✓' : '⏳'}
              </Text>
            </View>
          </View>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{business?.name || 'Business'}</Text>
            <Text style={styles.businessType}>{category || 'Uncategorized'}</Text>
            <Text style={styles.businessJoin}>
              {business?.is_active ? '🟢 Active' : '⏸️ Inactive'}
            </Text>
          </View>
          <TouchableOpacity style={styles.businessEditButton}>
            <Ionicons name="create-outline" size={20} color="#4A7DFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.businessStats}>
          <View style={styles.businessStat}>
            <Text style={styles.businessStatValue}>{stats.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.businessStatLabel}>⭐ Rating</Text>
          </View>
          <View style={styles.businessStatDivider} />
          <View style={styles.businessStat}>
            <Text style={styles.businessStatValue}>{stats.activityCount || 0}</Text>
            <Text style={styles.businessStatLabel}>{config.activityLabel}</Text>
          </View>
          <View style={styles.businessStatDivider} />
          <View style={styles.businessStat}>
            <Text style={styles.businessStatValue}>{offerings.length}</Text>
            <Text style={styles.businessStatLabel}>{config.offeringLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.businessSections}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="image-outline" size={20} color="#4A7DFF" />
          <Text style={styles.settingsLabel}>Logo & Cover</Text>
          <Ionicons name="chevron-forward" size={20} color="#8A8AAE" style={styles.settingsArrow} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="information-circle-outline" size={20} color="#4A7DFF" />
          <Text style={styles.settingsLabel}>Business Description</Text>
          <Ionicons name="chevron-forward" size={20} color="#8A8AAE" style={styles.settingsArrow} />
        </TouchableOpacity>
      </View>

      <View style={styles.businessSections}>
        <Text style={styles.sectionTitle}>Operations</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="time-outline" size={20} color="#4A7DFF" />
          <Text style={styles.settingsLabel}>Business Hours</Text>
          <Ionicons name="chevron-forward" size={20} color="#8A8AAE" style={styles.settingsArrow} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="location-outline" size={20} color="#4A7DFF" />
          <Text style={styles.settingsLabel}>Location & Service Area</Text>
          <Ionicons name="chevron-forward" size={20} color="#8A8AAE" style={styles.settingsArrow} />
        </TouchableOpacity>
      </View>

      <View style={styles.businessSections}>
        <Text style={styles.sectionTitle}>Payments</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="wallet-outline" size={20} color="#4A7DFF" />
          <Text style={styles.settingsLabel}>Payout Account</Text>
          <Ionicons name="chevron-forward" size={20} color="#8A8AAE" style={styles.settingsArrow} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="card-outline" size={20} color="#4A7DFF" />
          <Text style={styles.settingsLabel}>Accepted Payment Methods</Text>
          <Ionicons name="chevron-forward" size={20} color="#8A8AAE" style={styles.settingsArrow} />
        </TouchableOpacity>
      </View>

      <View style={styles.businessSections}>
        <Text style={styles.sectionTitle}>Verification</Text>
        <View style={styles.verificationItem}>
          <View style={[styles.verificationIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#2ECC71" />
          </View>
          <View style={styles.verificationContent}>
            <Text style={styles.verificationTitle}>Phone Verified</Text>
            <Text style={styles.verificationDesc}>Your phone number is verified</Text>
          </View>
        </View>
        <View style={[styles.verificationItem, { opacity: 0.6 }]}>
          <View style={[styles.verificationIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="document-text-outline" size={20} color="#FF9800" />
          </View>
          <View style={styles.verificationContent}>
            <Text style={styles.verificationTitle}>Business Documents</Text>
            <Text style={styles.verificationDesc}>Upload business registration</Text>
          </View>
          <TouchableOpacity style={styles.verificationButton}>
            <Text style={styles.verificationButtonText}>Upload</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // --- Render Tab Content ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            {renderStats()}
            {renderQuickActions()}
            {renderRecentActivity()}
          </>
        );
      case 'offerings':
        return renderOfferings();
      case 'activity':
        return renderActivity();
      case 'wallet':
        return renderWallet();
      case 'business':
        return renderBusiness();
      default:
        return null;
    }
  };

  // --- Tabs Configuration ---
  const getTabs = () => {
    return [
      { key: 'overview', icon: 'home-outline', label: 'Overview' },
      { key: 'offerings', icon: config.offeringIcon || 'cube-outline', label: config.offeringLabel },
      { key: 'activity', icon: config.activityIcon || 'receipt-outline', label: config.activityLabel },
      { key: 'wallet', icon: 'wallet-outline', label: 'Wallet' },
      { key: 'business', icon: 'business-outline', label: 'Business' },
    ];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A7DFF" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!business) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={48} color="#8A8AAE" />
          <Text style={styles.emptyTitle}>No business found</Text>
          <Text style={styles.emptySubtitle}>Set up your business to start selling on Munolink.</Text>
          <TouchableOpacity style={styles.setupBtn} onPress={() => navigation.navigate('BusinessRegistration')}>
            <Text style={styles.setupBtnText}>Set Up Business</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const tabs = getTabs();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2F5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Dashboard</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#1F2F5F" />
        </TouchableOpacity>
      </View>

      <View style={styles.banner}>
        <View>
          <Text style={styles.bannerName}>{business.name}</Text>
          <Text style={styles.bannerType}>{category || 'Uncategorized'}</Text>
        </View>
        <View style={styles.bannerStatus}>
          <View style={[styles.bannerDot, { backgroundColor: business.is_active ? '#2ECC71' : '#F1C40F' }]} />
          <Text style={[styles.bannerStatusText, { color: business.is_active ? '#2ECC71' : '#F1C40F' }]}>
            {business.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.walletCompact} onPress={() => setActiveTab('wallet')}>
        <View style={styles.walletCompactLeft}>
          <Text style={styles.walletCompactLabel}>Wallet Balance</Text>
          <Text style={styles.walletCompactAmount}>
            {balanceVisible ? `UGX ${walletBalance.toLocaleString()}` : '****'}
          </Text>
        </View>
        <View style={styles.walletCompactRight}>
          <Ionicons name="chevron-forward" size={20} color="#4A7DFF" />
        </View>
      </TouchableOpacity>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? '#4A7DFF' : '#8A8AAE'}
            />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A7DFF" />
        }
      >
        {renderTabContent()}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {renderCatalogBrowser()}
      {renderCustomizeModal()}
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  bannerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  bannerType: {
    fontSize: 12,
    color: '#8A8AAE',
    marginTop: 2,
  },
  bannerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bannerStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  walletCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  walletCompactLeft: {
    flex: 1,
  },
  walletCompactLabel: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  walletCompactAmount: {
    color: '#1F2F5F',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  walletCompactRight: {
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4A7DFF',
  },
  tabLabel: {
    color: '#8A8AAE',
    fontSize: 11,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#4A7DFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  tabContent: {
    paddingBottom: 8,
  },
  bottomSpacer: {
    height: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 42) / 2,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  statValue: {
    color: '#1F2F5F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8A8AAE',
    fontSize: 11,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickAction: {
    flex: 1,
    minWidth: (width - 40) / 4 - 8,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionLabel: {
    color: '#1F2F5F',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#1F2F5F',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionLink: {
    color: '#4A7DFF',
    fontSize: 12,
  },
  noDataText: {
    color: '#8A8AAE',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  recentActivity: {
    marginBottom: 8,
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityTitle: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  activityAmount: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityCustomer: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activityStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  activityCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityCardId: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '600',
  },
  activityCardStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activityCardStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  activityCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityCardCustomer: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  activityCardAmount: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
  },
  filterChips: {
    flexDirection: 'row',
    gap: 4,
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#F5F7FA',
  },
  filterChipActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  filterChipText: {
    color: '#8A8AAE',
    fontSize: 10,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#4A7DFF',
  },
  offeringCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    alignItems: 'center',
  },
  offeringImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 10,
  },
  offeringImagePlaceholder: {
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offeringImageText: {
    fontSize: 24,
  },
  offeringInfo: {
    flex: 1,
  },
  offeringName: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '500',
  },
  offeringPrice: {
    color: '#4A7DFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  offeringStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  offeringStat: {
    color: '#8A8AAE',
    fontSize: 10,
  },
  offeringStock: {
    fontSize: 10,
    fontWeight: '500',
  },
  offeringAction: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  walletSummary: {
    marginBottom: 16,
  },
  walletBalanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    marginBottom: 12,
  },
  walletBalanceLabel: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  walletBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  walletBalanceAmount: {
    color: '#1F2F5F',
    fontSize: 24,
    fontWeight: 'bold',
  },
  walletBalanceActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  walletActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4A7DFF',
    paddingVertical: 8,
    borderRadius: 8,
  },
  walletActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  walletActionBtnSecondary: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  walletActionBtnTextSecondary: {
    color: '#4A7DFF',
  },
  walletStats: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  walletStat: {
    flex: 1,
    alignItems: 'center',
  },
  walletStatValue: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: 'bold',
  },
  walletStatLabel: {
    color: '#8A8AAE',
    fontSize: 10,
    marginTop: 2,
  },
  walletStatDivider: {
    width: 1,
    backgroundColor: '#E8ECF4',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionTitle: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '500',
  },
  transactionDate: {
    color: '#8A8AAE',
    fontSize: 11,
    marginTop: 1,
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  businessProfile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  businessLogoContainer: {
    position: 'relative',
  },
  businessLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessLogoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A7DFF',
  },
  businessVerified: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  businessVerifiedText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: 'bold',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: '600',
  },
  businessType: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  businessJoin: {
    fontSize: 12,
    marginTop: 2,
  },
  businessEditButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  businessStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF4',
  },
  businessStat: {
    alignItems: 'center',
  },
  businessStatValue: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  businessStatLabel: {
    color: '#8A8AAE',
    fontSize: 11,
    marginTop: 2,
  },
  businessStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E8ECF4',
  },
  businessSections: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6FA',
  },
  settingsLabel: {
    flex: 1,
    color: '#1F2F5F',
    fontSize: 13,
    marginLeft: 10,
  },
  settingsArrow: {
    marginLeft: 8,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  verificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  verificationContent: {
    flex: 1,
  },
  verificationTitle: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '500',
  },
  verificationDesc: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  verificationButton: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verificationButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2F5F',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8A8AAE',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  setupBtn: {
    backgroundColor: '#4A7DFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  setupBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyOfferings: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyOfferingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2F5F',
    marginTop: 12,
  },
  emptyOfferingsSubtext: {
    fontSize: 13,
    color: '#8A8AAE',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  browseCatalogBtn: {
    backgroundColor: '#4A7DFF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseCatalogBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // --- Modal Styles ---
  modalFullScreen: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  modalFullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  modalFullTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: '#1F2F5F',
    fontSize: 14,
  },
  categoryFilters: {
    maxHeight: 44,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  categoryFiltersContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  categoryFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  categoryFilterChipActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    borderColor: '#4A7DFF',
  },
  categoryFilterText: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  categoryFilterTextActive: {
    color: '#4A7DFF',
    fontWeight: '500',
  },
  catalogLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catalogLoadingText: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 10,
  },
  catalogEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catalogEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2F5F',
    marginTop: 12,
  },
  catalogEmptySubtext: {
    fontSize: 14,
    color: '#8A8AAE',
    marginTop: 4,
  },
  catalogListContent: {
    padding: 16,
    gap: 8,
  },
  catalogItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    marginBottom: 8,
  },
  catalogItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  catalogItemInfo: {
    flex: 1,
  },
  catalogItemName: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  catalogItemCategory: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  catalogItemBrand: {
    color: '#8A8AAE',
    fontSize: 11,
    marginTop: 2,
  },
  catalogItemDuration: {
    color: '#8A8AAE',
    fontSize: 11,
    marginTop: 2,
  },
  catalogItemSelect: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
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
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#1F2F5F',
    fontSize: 18,
    fontWeight: '600',
  },
  modalSubmit: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 20,
  },
  modalSubmitDisabled: {
    opacity: 0.5,
  },
  modalSubmitGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  formGroup: {
    gap: 4,
    marginBottom: 12,
  },
  formLabel: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '500',
  },
  formInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1F2F5F',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountInput: {
    flex: 1,
  },
  discountTypeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  discountTypeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  discountTypeActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    borderColor: '#4A7DFF',
  },
  discountTypeText: {
    color: '#8A8AAE',
    fontSize: 12,
    fontWeight: '500',
  },
  discountTypeTextActive: {
    color: '#4A7DFF',
  },
  imageUploadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  imageAddBtn: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF4',
    borderStyle: 'dashed',
  },
  imageAddText: {
    color: '#4A7DFF',
    fontSize: 10,
    marginTop: 2,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  specLabel: {
    color: '#1F2F5F',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 80,
  },
  specInput: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#1F2F5F',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6FA',
  },
  toggleLabel: {
    color: '#1F2F5F',
    fontSize: 14,
  },
  catalogPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    marginBottom: 16,
  },
  catalogPreviewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  catalogPreviewInfo: {
    flex: 1,
  },
  catalogPreviewName: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  catalogPreviewCategory: {
    color: '#8A8AAE',
    fontSize: 12,
  },
});