// src/features/business/BusinessDashboardScreen.tsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';
import * as ImagePicker from 'expo-image-picker';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const { width, height } = Dimensions.get('window');

// --- Types ---
type Shop = Database['public']['Tables']['shops']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type CatalogItem = Database['public']['Tables']['catalog']['Row'];
type ServiceCatalogItem = Database['public']['Tables']['service_catalog']['Row'];
type ShopProduct = Database['public']['Tables']['shop_products']['Row'];
type ProviderService = Database['public']['Tables']['provider_services']['Row'];
type ProductAttribute = Database['public']['Tables']['product_attributes']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

// --- Opportunity Scene Interface ---
interface OpportunityScene {
  id: string;
  opportunity_id: string;
  opportunity_type: 'product' | 'service';
  scene_index: number;
  scene_type: 'hero' | 'details' | 'trust' | 'gallery' | 'extra';
  image_url: string;
  image_caption: string | null;
  order_index: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// --- Business Type Configuration ---
const BUSINESS_CONFIGS: Record<string, any> = {
  shop: {
    offeringLabel: 'Products',
    offeringIcon: 'cube-outline',
    activityLabel: 'Orders',
    activityIcon: 'receipt-outline',
    statuses: ['New', 'Confirmed', 'Preparing', 'Ready', 'Shipped', 'Completed', 'Cancelled'],
    stats: ['Revenue', 'Orders', 'Customers', 'Products'],
    catalogTable: 'catalog',
    offeringTable: 'shop_products',
    foreignKey: 'catalog_id',
    priceField: 'regular_price',
    stockField: 'in_stock',
    activeField: 'in_stock',
    sellerSpecsField: 'seller_specifications' as string,
    supportsAttributes: true,
    hasStock: true,
  },
  service: {
    offeringLabel: 'Services',
    offeringIcon: 'construct-outline',
    activityLabel: 'Bookings',
    activityIcon: 'calendar-outline',
    statuses: ['Requested', 'Accepted', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    stats: ['Revenue', 'Bookings', 'Customers', 'Services'],
    catalogTable: 'service_catalog',
    offeringTable: 'provider_services',
    foreignKey: 'service_id',
    priceField: 'price',
    activeField: 'is_active',
    sellerSpecsField: null,
    supportsAttributes: false,
    hasStock: false,
  },
  institution: {
    offeringLabel: 'Offerings',
    offeringIcon: 'business-outline',
    activityLabel: 'Reservations',
    activityIcon: 'calendar-outline',
    statuses: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
    stats: ['Revenue', 'Reservations', 'Customers', 'Offerings'],
    catalogTable: 'service_catalog',
    offeringTable: 'provider_services',
    foreignKey: 'service_id',
    priceField: 'price',
    activeField: 'is_active',
    sellerSpecsField: null,
    supportsAttributes: false,
    hasStock: false,
  },
};

// --- Scene Types ---
const SCENE_TYPES = [
  { id: 'hero', label: 'Hero', icon: 'star', description: 'Main image shown first' },
  { id: 'details', label: 'Details', icon: 'information-circle', description: 'Product details view' },
  { id: 'trust', label: 'Trust', icon: 'shield-checkmark', description: 'Trust signals' },
  { id: 'gallery', label: 'Gallery', icon: 'images', description: 'Multiple images' },
  { id: 'extra', label: 'Extra', icon: 'add-circle', description: 'Additional image' },
];

// --- Tag Suggestions ---
const SUGGESTED_TAGS = [
  'Premium', 'Best Seller', 'New', 'Limited', 'Exclusive', 
  'Free Delivery', 'Warranty', 'Certified', 'Eco-Friendly', 
  'Organic', 'Handmade', 'Custom', 'On Sale', 'Trending'
];

// ============================================================
// BUSINESS DASHBOARD MAIN COMPONENT
// ============================================================

const BusinessDashboardContent = ({ navigation }: any) => {
  const { user } = useAuth();
  const { isDesktop } = useBreakpoint();
  
  // --- State ---
  const [business, setBusiness] = useState<Shop | null>(null);
  const [businessType, setBusinessType] = useState<string>('shop');
  const [category, setCategory] = useState<string>('');
  const [config, setConfig] = useState<any>(BUSINESS_CONFIGS.shop);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [offerings, setOfferings] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedOffering, setSelectedOffering] = useState<any>(null);
  const [showSceneManager, setShowSceneManager] = useState(false);
  const [showBusinessSettings, setShowBusinessSettings] = useState(false);
  
  // --- Categories from Database ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  
  // --- Add Offering States ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [offeringType, setOfferingType] = useState<'product' | 'service'>('product');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    description: '',
    price: '',
    discount: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    stock: '',
    in_stock: true,
    is_active: true,
    images: [] as string[],
    specifications: {} as Record<string, any>,
    attributeValues: {} as Record<string, string>,
    tags: [] as string[],
    tagInput: '',
    duration: '',
    custom_name: '',
    custom_description: '',
  });
  const [saving, setSaving] = useState(false);
  const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([]);
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  
  // --- Scene Manager States ---
  const [sceneImages, setSceneImages] = useState<Record<string, string>>({});
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  // --- Business Settings States ---
  const [businessSettings, setBusinessSettings] = useState({
    logo: '',
    banner: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    workingHours: '',
    isOpen: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  // ============================================================
  // 1. HELPER FUNCTIONS
  // ============================================================

  // --- Load Categories ---
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('name', { ascending: true });

      if (!error && data) {
        const names = data.map(c => c.name);
        setCategoryOptions(names);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // --- Save Scenes ---
  const saveScenes = async (opportunityId: string, images: string[], type: 'product' | 'service') => {
    try {
      const sceneTypes = ['hero', 'details', 'trust', 'gallery', 'extra'];
      const maxScenes = Math.min(images.length, 5);

      for (let i = 0; i < maxScenes; i++) {
        const sceneType = sceneTypes[i] || 'gallery';
        await (supabase as any)
          .from('opportunity_scenes')
          .insert({
            opportunity_id: opportunityId,
            opportunity_type: type,
            scene_index: i + 1,
            scene_type: sceneType,
            image_url: images[i],
            is_primary: i === 0,
            order_index: i,
          });
      }
    } catch (error) {
      console.error('Error saving scenes:', error);
    }
  };

  // --- Save Product Attributes ---
  const saveProductAttributes = async (catalogId: string, productId: string) => {
    try {
      const entries = Object.entries(formData.attributeValues).filter(([_, value]) => 
        value && typeof value === 'string' && value.trim() !== ''
      );

      for (const [attributeName, value] of entries) {
        let { data: existingAttribute } = await supabase
          .from('product_attributes')
          .select('id')
          .eq('catalog_id', catalogId)
          .eq('attribute_name', attributeName)
          .single();

        let attributeId: string;

        if (!existingAttribute) {
          const { data: newAttr, error: createError } = await supabase
            .from('product_attributes')
            .insert({
              catalog_id: catalogId,
              attribute_name: attributeName,
              attribute_value: value,
              attribute_type: 'text',
            })
            .select()
            .single();

          if (createError) throw createError;
          if (!newAttr) throw new Error('Failed to create attribute');
          attributeId = (newAttr as any).id;
        } else {
          attributeId = existingAttribute.id;
        }

        await supabase
          .from('product_attribute_values')
          .insert({
            product_id: productId,
            attribute_id: attributeId,
            value: value,
          });
      }
    } catch (error) {
      console.error('Error saving attributes:', error);
    }
  };

  // --- Add Tag ---
  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (formData.tags.includes(trimmed)) {
      Alert.alert('Tag Exists', 'This tag is already added');
      return;
    }
    if (formData.tags.length >= 10) {
      Alert.alert('Too Many Tags', 'Maximum 10 tags allowed');
      return;
    }
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, trimmed],
      tagInput: '',
    }));
  };

  // --- Remove Tag ---
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  // --- Remove Specification ---
  const removeSpecification = (key: string) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData(prev => ({ ...prev, specifications: newSpecs }));
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
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...imageUris],
        }));
      }
    } catch (error) {
      console.error('Image pick error:', error);
      Alert.alert('Error', 'Failed to pick images.');
    }
  };

  // --- Remove Image ---
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // --- Select Catalog Item ---
  const selectCatalogItem = (item: any) => {
    setSelectedCatalogItem(item);
    setIsCustomMode(false);
    setShowCustomForm(true);
    
    const specs = item.specifications || {};
    const editableSpecs: Record<string, any> = {};
    Object.keys(specs).forEach(key => {
      editableSpecs[key] = specs[key] || '';
    });

    setFormData({
      name: item.name || '',
      category: item.category || '',
      brand: item.brand || '',
      description: item.description || '',
      price: '',
      discount: '',
      discountType: 'percentage',
      stock: '',
      in_stock: true,
      is_active: true,
      images: item.images || [],
      specifications: editableSpecs,
      attributeValues: {},
      tags: item.tags || [],
      tagInput: '',
      duration: item.duration || '',
      custom_name: item.name || '',
      custom_description: item.description || '',
    });

    if (offeringType === 'product' && config.supportsAttributes) {
      loadProductAttributes(item.id);
    }
  };

  // --- Create New Custom Offering ---
  const createCustomOffering = () => {
    setSelectedCatalogItem(null);
    setIsCustomMode(true);
    setShowCustomForm(true);
    setFormData({
      name: searchQuery.trim() || '',
      category: '',
      brand: '',
      description: '',
      price: '',
      discount: '',
      discountType: 'percentage',
      stock: '',
      in_stock: true,
      is_active: true,
      images: [],
      specifications: {},
      attributeValues: {},
      tags: [],
      tagInput: '',
      duration: '',
      custom_name: '',
      custom_description: '',
    });
    setSearchResults([]);
    setSearchQuery('');
    setProductAttributes([]);
  };

  // --- Load Product Attributes ---
  const loadProductAttributes = async (catalogId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('catalog_id', catalogId)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setProductAttributes(data);
        const attributeValues: Record<string, string> = {};
        data.forEach((attr: ProductAttribute) => {
          attributeValues[attr.attribute_name] = '';
        });
        setFormData(prev => ({ ...prev, attributeValues }));
      }
    } catch (error) {
      console.error('Error loading attributes:', error);
    }
  };

  // --- Add Specification ---
  const addSpecification = () => {
    if (!specKey.trim() || !specValue.trim()) {
      Alert.alert('Error', 'Please enter both key and value');
      return;
    }
    setFormData(prev => ({
      ...prev,
      specifications: { ...prev.specifications, [specKey.trim()]: specValue.trim() },
    }));
    setSpecKey('');
    setSpecValue('');
    setShowSpecsModal(false);
  };

  // --- Smart Search ---
  const performSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const table = offeringType === 'product' ? 'catalog' : 'service_catalog';
    
    try {
      let searchQuery = `name.ilike.%${query}%,category.ilike.%${query}%`;
      if (offeringType === 'product') {
        searchQuery += `,brand.ilike.%${query}%`;
      }
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .or(searchQuery)
        .limit(15);

      if (!error && data) {
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // --- Reset Form ---
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      brand: '',
      description: '',
      price: '',
      discount: '',
      discountType: 'percentage',
      stock: '',
      in_stock: true,
      is_active: true,
      images: [],
      specifications: {},
      attributeValues: {},
      tags: [],
      tagInput: '',
      duration: '',
      custom_name: '',
      custom_description: '',
    });
    setSelectedCatalogItem(null);
    setIsCustomMode(false);
    setSearchResults([]);
    setSearchQuery('');
    setProductAttributes([]);
    setShowCustomForm(false);
  };

  // --- Load All Offerings (Products + Services) ---
  const loadAllOfferings = async (shop: Shop) => {
    console.log('🔄 Loading offerings for shop:', shop.id);
    let allOfferings: any[] = [];

    // 1. Load Products with catalog data
    try {
      const { data: productData, error: productError } = await supabase
        .from('shop_products')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });

      if (!productError && productData) {
        console.log('✅ Found', productData.length, 'products');
        
        const productsWithCatalog = await Promise.all(productData.map(async (item) => {
          let catalogData = null;
          if (item.catalog_id) {
            const { data: catalog, error: catalogError } = await supabase
              .from('catalog')
              .select('*')
              .eq('id', item.catalog_id)
              .single();
            
            if (!catalogError) {
              catalogData = catalog;
            }
          }
          
          const { data: sceneData } = await (supabase as any)
            .from('opportunity_scenes')
            .select('*')
            .eq('opportunity_id', item.id)
            .eq('opportunity_type', 'product')
            .order('scene_index', { ascending: true });
          
          return { 
            ...item, 
            catalog: catalogData, 
            type: 'product', 
            scenes: sceneData || [] 
          };
        }));
        
        allOfferings = [...allOfferings, ...productsWithCatalog];
      } else if (productError) {
        console.error('❌ Product load error:', productError);
      }
    } catch (error) {
      console.error('❌ Product load exception:', error);
    }

    // 2. Load Services with catalog data
    if (shop.owner_id) {
      try {
        const { data: serviceData, error: serviceError } = await supabase
          .from('provider_services')
          .select('*')
          .eq('user_id', shop.owner_id)
          .order('created_at', { ascending: false });

        if (!serviceError && serviceData) {
          console.log('✅ Found', serviceData.length, 'services');
          
          const servicesWithCatalog = await Promise.all(serviceData.map(async (item) => {
            let catalogData = null;
            if (item.service_id) {
              const { data: catalog, error: catalogError } = await supabase
                .from('service_catalog')
                .select('*')
                .eq('id', item.service_id)
                .single();
              
              if (!catalogError) {
                catalogData = catalog;
              }
            }
            
            const { data: sceneData } = await (supabase as any)
              .from('opportunity_scenes')
              .select('*')
              .eq('opportunity_id', item.id)
              .eq('opportunity_type', 'service')
              .order('scene_index', { ascending: true });
            
            return { 
              ...item, 
              service_catalog: catalogData, 
              type: 'service', 
              scenes: sceneData || [] 
            };
          }));
          
          allOfferings = [...allOfferings, ...servicesWithCatalog];
        } else if (serviceError) {
          console.error('❌ Service load error:', serviceError);
        }
      } catch (error) {
        console.error('❌ Service load exception:', error);
      }
    }

    allOfferings.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log('📊 Total offerings loaded:', allOfferings.length);
    setOfferings(allOfferings);
  };

  // ============================================================
  // 2. MAIN FUNCTIONS
  // ============================================================

  // --- Load Dashboard ---
  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: businessData, error: businessError } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (businessError || !businessData || businessData.length === 0) {
        setLoading(false);
        return;
      }

      const shop = businessData[0];
      setBusiness(shop);
      
      const bizType = shop.business_type || 'shop';
      setBusinessType(bizType);
      setCategory(shop.category || '');
      setConfig(BUSINESS_CONFIGS[bizType] || BUSINESS_CONFIGS.shop);

      setBusinessSettings({
        logo: shop.logo_url || '',
        banner: '',
        description: shop.description || '',
        phone: shop.phone || '',
        email: '',
        website: '',
        workingHours: shop.opening_hours || '',
        isOpen: shop.is_open !== false,
      });

      await loadAllOfferings(shop);

      const { data: activityData } = await supabase
        .from('transactions')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const today = new Date().toISOString().split('T')[0];
      const todayActivity = activityData?.filter(a => a.created_at?.startsWith(today)) ?? [];
      const todayRevenue = todayActivity.reduce((sum, a) => sum + (a.amount || 0), 0);

      setStats({
        revenue: todayRevenue,
        activityCount: activityData?.length || 0,
        customers: new Set(activityData?.map(a => a.user_id)).size || 0,
        offerings: offerings.length,
        rating: shop.rating || 0,
        reviews: shop.review_count || 0,
      });

      await loadCategories();

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // --- Publish Offering ---
  const publishOffering = async () => {
    if (!business) {
      Alert.alert('Error', 'No business found');
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setSaving(true);

    try {
      const price = parseFloat(formData.price);
      const discount = formData.discount ? parseFloat(formData.discount) : 0;
      
      let finalPrice = price;
      if (discount > 0) {
        if (formData.discountType === 'percentage') {
          finalPrice = price - (price * discount / 100);
        } else {
          finalPrice = price - discount;
        }
      }

      let catalogId: string = selectedCatalogItem?.id || '';
      const table = offeringType === 'product' ? 'catalog' : 'service_catalog';

      // If custom mode or no catalog ID, create catalog entry first
      if (isCustomMode || !catalogId) {
        const insertData: any = {
          name: formData.name.trim(),
          category: formData.category || 'Uncategorized',
          description: formData.description || null,
          specifications: formData.specifications || {},
          images: formData.images || [],
          is_active: true,
          tags: formData.tags || [],
        };
        
        if (offeringType === 'product') {
          insertData.brand = formData.brand || null;
        }
        
        if (offeringType === 'service') {
          insertData.duration = formData.duration || null;
        }

        const { data: newCatalog, error: catalogError } = await supabase
          .from(table)
          .insert(insertData)
          .select()
          .single();

        if (catalogError) throw catalogError;
        if (!newCatalog) throw new Error('Failed to create catalog item');
        catalogId = (newCatalog as any).id;
      }

      if (!catalogId) {
        throw new Error('No catalog ID available. Please select or create a catalog item.');
      }

      let existingOffering = null;
      
      if (offeringType === 'product') {
        const { data, error } = await supabase
          .from('shop_products')
          .select('id, catalog_id, regular_price, in_stock, seller_specifications')
          .eq('shop_id', business.id)
          .eq('catalog_id', catalogId)
          .maybeSingle();

        if (!error && data) {
          existingOffering = data;
        }
      } else {
        const { data, error } = await supabase
          .from('provider_services')
          .select('id, service_id, price, is_active')
          .eq('user_id', business.owner_id!)
          .eq('service_id', catalogId)
          .maybeSingle();

        if (!error && data) {
          existingOffering = data;
        }
      }

      let offeringId: string | null = null;

      if (existingOffering) {
        if (offeringType === 'product') {
          const { data, error } = await supabase
            .from('shop_products')
            .update({
              regular_price: finalPrice,
              in_stock: formData.in_stock,
              seller_specifications: formData.specifications || {},
            })
            .eq('id', existingOffering.id)
            .select()
            .single();

          if (error) throw error;
          offeringId = existingOffering.id;
        } else {
          const { data, error } = await supabase
            .from('provider_services')
            .update({
              price: finalPrice,
              is_active: formData.is_active,
            })
            .eq('id', existingOffering.id)
            .select()
            .single();

          if (error) throw error;
          offeringId = existingOffering.id;
        }

        Alert.alert(
          'Updated!',
          `Your ${offeringType} has been updated successfully!`,
          [{ text: 'OK' }]
        );

      } else {
        if (offeringType === 'product') {
          const { data, error } = await supabase
            .from('shop_products')
            .insert({
              shop_id: business.id,
              catalog_id: catalogId,
              regular_price: finalPrice,
              in_stock: formData.in_stock,
              seller_specifications: formData.specifications || {},
            })
            .select()
            .single();

          if (error) {
            if (error.code === '23505') {
              await loadDashboard();
              Alert.alert(
                'Already Exists',
                `This ${offeringType} is already in your catalog. It has been refreshed.`,
                [{ text: 'OK' }]
              );
              setSaving(false);
              setShowAddModal(false);
              setShowCustomForm(false);
              resetForm();
              return;
            }
            throw error;
          }
          if (!data) throw new Error('Failed to create product');
          offeringId = (data as any).id;

          if (config.supportsAttributes && Object.keys(formData.attributeValues).length > 0 && catalogId) {
            await saveProductAttributes(catalogId, offeringId);
          }

        } else {
          const { data, error } = await supabase
            .from('provider_services')
            .insert({
              user_id: business.owner_id!,
              service_id: catalogId,
              price: finalPrice,
              is_active: formData.is_active,
              ...(businessType === 'institution' ? { institution_id: business.id } : {}),
            })
            .select()
            .single();

          if (error) {
            if (error.code === '23505') {
              await loadDashboard();
              Alert.alert(
                'Already Exists',
                `This ${offeringType} is already in your catalog. It has been refreshed.`,
                [{ text: 'OK' }]
              );
              setSaving(false);
              setShowAddModal(false);
              setShowCustomForm(false);
              resetForm();
              return;
            }
            throw error;
          }
          if (!data) throw new Error('Failed to create service');
          offeringId = (data as any).id;
        }

        Alert.alert(
          'Success!',
          `${isCustomMode ? 'Custom ' : ''}${offeringType === 'product' ? 'Product' : 'Service'} published successfully!`,
          [{ text: 'OK' }]
        );
      }

      if (offeringId && formData.images.length > 0) {
        await (supabase as any)
          .from('opportunity_scenes')
          .delete()
          .eq('opportunity_id', offeringId)
          .eq('opportunity_type', offeringType);
        
        await saveScenes(offeringId, formData.images, offeringType);
      }

      resetForm();
      setShowAddModal(false);
      setShowCustomForm(false);
      await loadDashboard();

    } catch (error: any) {
      console.error('Publish error:', error);
      Alert.alert('Error', error.message || 'Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  // --- Open Scene Manager ---
  const openSceneManager = async (offering: any) => {
    setSelectedOffering(offering);
    setShowSceneManager(true);
    
    const type = offering.type || 'product';
    
    const { data } = await (supabase as any)
      .from('opportunity_scenes')
      .select('*')
      .eq('opportunity_id', offering.id)
      .eq('opportunity_type', type)
      .order('scene_index', { ascending: true });

    if (data) {
      const sceneMap: Record<string, string> = {};
      const gallery: string[] = [];
      data.forEach((scene: OpportunityScene) => {
        if (scene.scene_type === 'gallery') {
          gallery.push(scene.image_url);
        } else {
          sceneMap[scene.scene_type] = scene.image_url;
        }
      });
      setSceneImages(sceneMap);
      setGalleryImages(gallery);
    } else {
      const catalogData = offering.catalog || offering.service_catalog;
      if (catalogData?.images && catalogData.images.length > 0) {
        const initialSceneMap: Record<string, string> = {};
        const initialGallery: string[] = [];
        catalogData.images.forEach((img: string, index: number) => {
          if (index < 3) {
            const sceneTypes = ['hero', 'details', 'trust'];
            initialSceneMap[sceneTypes[index]] = img;
          } else {
            initialGallery.push(img);
          }
        });
        setSceneImages(initialSceneMap);
        setGalleryImages(initialGallery);
      }
    }
  };

  // --- Update Scene Image ---
  const updateSceneImage = async (sceneType: string, imageUri: string) => {
    if (!selectedOffering) return;

    try {
      const imageUrl = imageUri;
      const type = selectedOffering.type || 'product';
      
      const { error } = await (supabase as any)
        .from('opportunity_scenes')
        .upsert({
          opportunity_id: selectedOffering.id,
          opportunity_type: type,
          scene_type: sceneType,
          scene_index: SCENE_TYPES.findIndex(s => s.id === sceneType) + 1,
          image_url: imageUrl,
          is_primary: sceneType === 'hero',
        }, { onConflict: 'opportunity_id, scene_type' });

      if (error) throw error;

      setSceneImages(prev => ({ ...prev, [sceneType]: imageUrl }));
      Alert.alert('Success', 'Scene updated successfully!');

    } catch (error) {
      console.error('Error updating scene:', error);
      Alert.alert('Error', 'Failed to update scene');
    }
  };

  // --- Add Gallery Images ---
  const addGalleryImages = async () => {
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
        const newImages = result.assets.map(asset => asset.uri);
        const allImages = [...galleryImages, ...newImages];
        const type = selectedOffering.type || 'product';
        
        for (const img of newImages) {
          await (supabase as any)
            .from('opportunity_scenes')
            .insert({
              opportunity_id: selectedOffering.id,
              opportunity_type: type,
              scene_type: 'gallery',
              scene_index: galleryImages.length + 1,
              image_url: img,
              is_primary: false,
            });
        }
        
        setGalleryImages(allImages);
      }
    } catch (error) {
      console.error('Error adding gallery images:', error);
    }
  };

  // --- Remove Gallery Image ---
  const removeGalleryImage = async (index: number) => {
    const imageToRemove = galleryImages[index];
    try {
      await (supabase as any)
        .from('opportunity_scenes')
        .delete()
        .eq('opportunity_id', selectedOffering.id)
        .eq('image_url', imageToRemove);

      setGalleryImages(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error removing gallery image:', error);
    }
  };

  // --- Save Business Settings ---
  const saveBusinessSettings = async () => {
    if (!business) return;
    
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          logo_url: businessSettings.logo || null,
          description: businessSettings.description || null,
          phone: businessSettings.phone || null,
          opening_hours: businessSettings.workingHours || null,
          is_open: businessSettings.isOpen,
        })
        .eq('id', business.id);

      if (error) throw error;

      Alert.alert('Success', 'Business settings updated successfully!');
      setShowBusinessSettings(false);
      loadDashboard();

    } catch (error: any) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', error.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // --- Pick Logo ---
  const pickLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setBusinessSettings(prev => ({ ...prev, logo: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error picking logo:', error);
    }
  };

  // --- Pick Banner ---
  const pickBanner = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setBusinessSettings(prev => ({ ...prev, banner: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error picking banner:', error);
    }
  };

  // --- Animated Modals ---
  const showAddModalAnimated = (show: boolean, type: 'product' | 'service' = 'product') => {
    if (show) {
      setOfferingType(type);
      setShowAddModal(true);
      setShowCustomForm(false);
      setSearchQuery('');
      setSearchResults([]);
      setIsCustomMode(false);
      setSelectedCatalogItem(null);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: height, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setShowAddModal(false);
        resetForm();
      });
    }
  };

  // ============================================================
  // 3. EFFECTS AND HANDLERS
  // ============================================================

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  // ============================================================
  // 4. RENDER FUNCTIONS
  // ============================================================

  // --- Render Stats ---
  const renderStats = () => {
    const statItems = [
      { 
        icon: '💰', 
        label: 'Revenue Today', 
        value: `UGX ${stats.revenue?.toLocaleString() || 0}`,
        color: '#4A7DFF',
        bg: 'rgba(74,125,255,0.1)'
      },
      { 
        icon: '📦', 
        label: 'Products', 
        value: offerings.filter(o => o.type === 'product').length.toString() || '0',
        color: '#2ECC71',
        bg: 'rgba(46,204,113,0.1)'
      },
      { 
        icon: '🔧', 
        label: 'Services', 
        value: offerings.filter(o => o.type === 'service').length.toString() || '0',
        color: '#6C5CE7',
        bg: 'rgba(108,92,231,0.1)'
      },
      { 
        icon: '⭐', 
        label: 'Rating', 
        value: stats.rating?.toFixed(1) || '0.0',
        color: '#F1C40F',
        bg: 'rgba(241,196,15,0.1)'
      },
    ];

    return (
      <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
        {statItems.map((stat, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: stat.bg }]}>
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
    <View style={[styles.quickActions, isDesktop && styles.quickActionsDesktop]}>
      <TouchableOpacity style={styles.quickAction} onPress={() => showAddModalAnimated(true, 'product')}>
        <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(46,204,113,0.15)' }]}>
          <Ionicons name="cube-outline" size={24} color="#2ECC71" />
        </View>
        <Text style={styles.quickActionLabel}>Add Product</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.quickAction} onPress={() => showAddModalAnimated(true, 'service')}>
        <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(108,92,231,0.15)' }]}>
          <Ionicons name="construct-outline" size={24} color="#6C5CE7" />
        </View>
        <Text style={styles.quickActionLabel}>Add Service</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.quickAction} onPress={() => setShowBusinessSettings(true)}>
        <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(241,196,15,0.15)' }]}>
          <Ionicons name="settings-outline" size={24} color="#F1C40F" />
        </View>
        <Text style={styles.quickActionLabel}>Settings</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.quickAction} onPress={() => setActiveTab('wallet')}>
        <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(231,76,60,0.15)' }]}>
          <Ionicons name="wallet-outline" size={24} color="#E74C3C" />
        </View>
        <Text style={styles.quickActionLabel}>Wallet</Text>
      </TouchableOpacity>
    </View>
  );

  // --- Render Offerings ---
  const renderOfferings = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Offerings ({offerings.length})</Text>
        <View style={styles.addButtonsRow}>
          <TouchableOpacity style={[styles.addButton, styles.addButtonProduct]} onPress={() => showAddModalAnimated(true, 'product')}>
            <Ionicons name="cube-outline" size={14} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addButton, styles.addButtonService]} onPress={() => showAddModalAnimated(true, 'service')}>
            <Ionicons name="construct-outline" size={14} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Service</Text>
          </TouchableOpacity>
        </View>
      </View>

      {offerings.length === 0 ? (
        <View style={styles.emptyOfferings}>
          <Ionicons name="storefront-outline" size={48} color="#8A8AAE" />
          <Text style={styles.emptyOfferingsTitle}>No offerings yet</Text>
          <Text style={styles.emptyOfferingsSubtext}>
            Add your first product or service to start selling
          </Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity style={[styles.browseCatalogBtn, { backgroundColor: '#2ECC71' }]} onPress={() => showAddModalAnimated(true, 'product')}>
              <Text style={styles.browseCatalogBtnText}>Add Product</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.browseCatalogBtn, { backgroundColor: '#6C5CE7' }]} onPress={() => showAddModalAnimated(true, 'service')}>
              <Text style={styles.browseCatalogBtnText}>Add Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        offerings.map((item, index) => {
          const catalogData = item.catalog || item.service_catalog || {};
          const name = catalogData.name || item.name || 'Offering';
          const price = item.regular_price || item.price || 0;
          const images = catalogData.images || [];
          const sceneCount = item.scenes?.length || images.length || 0;
          const isActive = item.type === 'product' ? item.in_stock : item.is_active;
          const isProduct = item.type === 'product';
          
          return (
            <View key={index} style={[styles.offeringCard, isProduct ? styles.offeringCardProduct : styles.offeringCardService]}>
              <View style={styles.offeringTypeBadge}>
                <Text style={[styles.offeringTypeBadgeText, { color: isProduct ? '#2ECC71' : '#6C5CE7' }]}>
                  {isProduct ? 'Product' : 'Service'}
                </Text>
              </View>
              <Image
                source={{ uri: images[0] || 'https://via.placeholder.com/80/4A7DFF/FFFFFF?text=No+Image' }}
                style={styles.offeringImage}
              />
              <View style={styles.offeringInfo}>
                <Text style={styles.offeringName}>{name}</Text>
                <Text style={styles.offeringPrice}>UGX {price.toLocaleString()}</Text>
                <View style={styles.offeringStats}>
                  <Text style={styles.offeringStat}>🖼️ {sceneCount} scenes</Text>
                  <Text style={[styles.offeringStock, { color: isActive ? '#2ECC71' : '#E74C3C' }]}>
                    {isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <View style={styles.offeringActions}>
                <TouchableOpacity 
                  style={styles.offeringAction}
                  onPress={() => openSceneManager(item)}
                >
                  <Ionicons name="images-outline" size={18} color="#4A7DFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.offeringAction}>
                  <Ionicons name="create-outline" size={18} color="#4A7DFF" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  // --- Render Wallet ---
  const renderWallet = () => (
    <View style={styles.tabContent}>
      <View style={styles.walletSummary}>
        <View style={styles.walletBalanceCard}>
          <Text style={styles.walletBalanceLabel}>Available Balance</Text>
          <View style={styles.walletBalanceRow}>
            <Text style={styles.walletBalanceAmount}>UGX {walletBalance.toLocaleString()}</Text>
            <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
              <Ionicons 
                name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} 
                size={20} 
                color="#8A8AAE" 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>
        
        <View style={styles.emptyOfferings}>
          <Ionicons name="receipt-outline" size={40} color="#8A8AAE" />
          <Text style={styles.emptyOfferingsTitle}>No transactions yet</Text>
          <Text style={styles.emptyOfferingsSubtext}>
            Your financial activity will appear here
          </Text>
        </View>
      </View>
    </View>
  );

  // --- Render Tab Content ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.tabContent}>
            {renderStats()}
            {renderQuickActions()}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Offerings</Text>
            </View>
            {offerings.slice(0, 3).map((item, index) => {
              const catalogData = item.catalog || item.service_catalog || {};
              const name = catalogData.name || item.name || 'Offering';
              const price = item.regular_price || item.price || 0;
              const images = catalogData.images || [];
              const isProduct = item.type === 'product';
              
              return (
                <View key={index} style={[styles.offeringCard, isProduct ? styles.offeringCardProduct : styles.offeringCardService]}>
                  <Image
                    source={{ uri: images[0] || 'https://via.placeholder.com/80/4A7DFF/FFFFFF?text=No+Image' }}
                    style={styles.offeringImage}
                  />
                  <View style={styles.offeringInfo}>
                    <Text style={styles.offeringName}>{name}</Text>
                    <Text style={styles.offeringPrice}>UGX {price.toLocaleString()}</Text>
                    <View style={styles.offeringStats}>
                      <Text style={[styles.offeringStock, { color: isProduct ? '#2ECC71' : '#6C5CE7' }]}>
                        {isProduct ? 'Product' : 'Service'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.offeringAction}
                    onPress={() => openSceneManager(item)}
                  >
                    <Ionicons name="images-outline" size={18} color="#4A7DFF" />
                  </TouchableOpacity>
                </View>
              );
            })}
            {offerings.length > 3 && (
              <TouchableOpacity style={styles.viewAllBtn} onPress={() => setActiveTab('offerings')}>
                <Text style={styles.viewAllBtnText}>View All Offerings →</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      case 'offerings':
        return renderOfferings();
      case 'wallet':
        return renderWallet();
      default:
        return null;
    }
  };

  // --- Render Add Modal ---
  const renderAddModal = () => {
    if (!showAddModal) return null;
    
    return (
      <Modal
        visible={showAddModal}
        transparent
        animationType="none"
        onRequestClose={() => showAddModalAnimated(false)}
      >
        <View style={styles.addModalOverlay}>
          <TouchableOpacity 
            style={styles.addModalBackdrop} 
            activeOpacity={1}
            onPress={() => showAddModalAnimated(false)}
          />
          <Animated.View 
            style={[
              styles.addModalContent,
              { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
            ]}
          >
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>
                Add {offeringType === 'product' ? 'Product' : 'Service'}
              </Text>
              <TouchableOpacity onPress={() => showAddModalAnimated(false)}>
                <Ionicons name="close" size={24} color="#1F2F5F" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.addModalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {!showCustomForm ? (
                // Search / Selection Mode
                <View>
                  <View style={styles.typeSelector}>
                    <TouchableOpacity
                      style={[styles.typeOption, offeringType === 'product' && styles.typeOptionActive]}
                      onPress={() => setOfferingType('product')}
                    >
                      <Ionicons name="cube-outline" size={18} color={offeringType === 'product' ? '#2ECC71' : '#8A8AAE'} />
                      <Text style={[styles.typeOptionText, offeringType === 'product' && styles.typeOptionTextActive]}>
                        Product
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeOption, offeringType === 'service' && styles.typeOptionActive]}
                      onPress={() => setOfferingType('service')}
                    >
                      <Ionicons name="construct-outline" size={18} color={offeringType === 'service' ? '#6C5CE7' : '#8A8AAE'} />
                      <Text style={[styles.typeOptionText, offeringType === 'service' && styles.typeOptionTextActive]}>
                        Service
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.searchSection}>
                    <View style={styles.searchInputWrapper}>
                      <Ionicons name="search" size={20} color="#8A8AAE" />
                      <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder={`Search ${offeringType === 'product' ? 'products' : 'services'}...`}
                        placeholderTextColor="#8A8AAE"
                        value={searchQuery}
                        onChangeText={performSearch}
                        autoFocus={false}
                      />
                      {isSearching && <ActivityIndicator size="small" color="#4A7DFF" />}
                    </View>
                    
                    <TouchableOpacity style={styles.createCustomBtn} onPress={createCustomOffering}>
                      <Ionicons name="add-circle-outline" size={18} color="#4A7DFF" />
                      <Text style={styles.createCustomBtnText}>Create Custom {offeringType === 'product' ? 'Product' : 'Service'}</Text>
                    </TouchableOpacity>
                  </View>

                  {isSearching ? (
                    <View style={styles.searchLoading}>
                      <ActivityIndicator size="small" color="#4A7DFF" />
                      <Text style={styles.searchLoadingText}>Searching...</Text>
                    </View>
                  ) : searchResults.length > 0 ? (
                    <FlatList
                      data={searchResults}
                      keyExtractor={(item) => item.id}
                      style={styles.searchResultsList}
                      renderItem={({ item }) => (
                        <TouchableOpacity style={styles.searchResultItem} onPress={() => selectCatalogItem(item)}>
                          {item.images && item.images.length > 0 ? (
                            <Image source={{ uri: item.images[0] }} style={styles.searchResultImage} />
                          ) : (
                            <View style={[styles.searchResultImage, { backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' }]}>
                              <Ionicons name={offeringType === 'product' ? 'cube-outline' : 'construct-outline'} size={20} color="#8A8AAE" />
                            </View>
                          )}
                          <View style={styles.searchResultInfo}>
                            <Text style={styles.searchResultName}>{item.name}</Text>
                            <Text style={styles.searchResultCategory}>{item.category || 'Uncategorized'}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color="#8A8AAE" />
                        </TouchableOpacity>
                      )}
                    />
                  ) : searchQuery.trim() ? (
                    <View style={styles.searchEmpty}>
                      <Ionicons name="search-outline" size={40} color="#8A8AAE" />
                      <Text style={styles.searchEmptyTitle}>No results found</Text>
                      <Text style={styles.searchEmptySubtext}>
                        Try a different search term or create a custom {offeringType}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                // Custom Form
                <View style={styles.formSection}>
                  <TouchableOpacity onPress={() => {
                    setShowCustomForm(false);
                    resetForm();
                  }}>
                    <Ionicons name="arrow-back" size={20} color="#4A7DFF" />
                  </TouchableOpacity>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Name *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Enter name"
                      value={formData.name}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Category</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g., Electronics"
                      value={formData.category}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
                    />
                  </View>

                  {offeringType === 'product' && (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Brand</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g., Apple"
                        value={formData.brand}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, brand: text }))}
                      />
                    </View>
                  )}

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Description</Text>
                    <TextInput
                      style={[styles.formInput, styles.formTextArea]}
                      placeholder="Describe your offering..."
                      multiline
                      numberOfLines={3}
                      value={formData.description}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formGroupHalf}>
                      <Text style={styles.formLabel}>Price *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="0"
                        keyboardType="numeric"
                        value={formData.price}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                      />
                    </View>
                    <View style={styles.formGroupHalf}>
                      <Text style={styles.formLabel}>Discount</Text>
                      <View style={styles.discountRow}>
                        <TextInput
                          style={[styles.formInput, styles.discountInput]}
                          placeholder="0"
                          keyboardType="numeric"
                          value={formData.discount}
                          onChangeText={(text) => setFormData(prev => ({ ...prev, discount: text }))}
                        />
                        <View style={styles.discountTypeContainer}>
                          <TouchableOpacity
                            style={[styles.discountTypeBtn, formData.discountType === 'percentage' && styles.discountTypeActive]}
                            onPress={() => setFormData(prev => ({ ...prev, discountType: 'percentage' }))}
                          >
                            <Text style={[styles.discountTypeText, formData.discountType === 'percentage' && styles.discountTypeTextActive]}>%</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.discountTypeBtn, formData.discountType === 'fixed' && styles.discountTypeActive]}
                            onPress={() => setFormData(prev => ({ ...prev, discountType: 'fixed' }))}
                          >
                            <Text style={[styles.discountTypeText, formData.discountType === 'fixed' && styles.discountTypeTextActive]}>UGX</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>

                  {offeringType === 'service' && (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Duration (optional)</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g., 1 hour"
                        value={formData.duration}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
                      />
                    </View>
                  )}

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Images</Text>
                    <View style={styles.imageUploadRow}>
                      {formData.images.map((uri, index) => (
                        <View key={index} style={styles.imagePreviewContainer}>
                          <Image source={{ uri }} style={styles.imagePreview} />
                          <TouchableOpacity onPress={() => removeImage(index)} style={styles.imageRemoveBtn}>
                            <Ionicons name="close-circle" size={20} color="#E74C3C" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      {formData.images.length < 5 && (
                        <TouchableOpacity style={styles.imageAddBtn} onPress={pickImages}>
                          <Ionicons name="camera" size={20} color="#4A7DFF" />
                          <Text style={styles.imageAddText}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>In Stock / Active</Text>
                    <Switch
                      value={offeringType === 'product' ? formData.in_stock : formData.is_active}
                      onValueChange={(value) => {
                        if (offeringType === 'product') {
                          setFormData(prev => ({ ...prev, in_stock: value }));
                        } else {
                          setFormData(prev => ({ ...prev, is_active: value }));
                        }
                      }}
                      trackColor={{ false: '#E8ECF4', true: '#4A7DFF' }}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.publishButton, saving && styles.publishButtonDisabled]}
                    onPress={publishOffering}
                    disabled={saving}
                  >
                    <LinearGradient colors={['#4A7DFF', '#6C5CE7']} style={styles.publishGradient}>
                      {saving ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.publishButtonText}>
                          {isCustomMode ? 'Create Custom' : 'Publish'} {offeringType}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // --- Render Scene Manager ---
  const renderSceneManager = () => {
    if (!showSceneManager || !selectedOffering) return null;

    const catalogData = selectedOffering.catalog || selectedOffering.service_catalog || {};
    const name = catalogData.name || selectedOffering.name || 'Offering';
    const price = selectedOffering.regular_price || selectedOffering.price || 0;
    const isProduct = selectedOffering.type === 'product';

    return (
      <Modal
        visible={showSceneManager}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSceneManager(false)}
      >
        <View style={styles.sceneManagerContainer}>
          <View style={styles.sceneManagerHeader}>
            <TouchableOpacity onPress={() => setShowSceneManager(false)}>
              <Ionicons name="arrow-back" size={24} color="#1F2F5F" />
            </TouchableOpacity>
            <Text style={styles.sceneManagerTitle}>Manage Scenes</Text>
            <TouchableOpacity onPress={() => setShowSceneManager(false)}>
              <Ionicons name="close" size={24} color="#1F2F5F" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sceneManagerContent} showsVerticalScrollIndicator={false}>
            <View style={styles.sceneManagerProduct}>
              <View style={styles.sceneManagerTypeBadge}>
                <Text style={styles.sceneManagerTypeBadgeText}>
                  {isProduct ? 'Product' : 'Service'}
                </Text>
              </View>
              <Text style={styles.sceneManagerProductName}>{name}</Text>
              <Text style={styles.sceneManagerProductPrice}>UGX {price.toLocaleString()}</Text>
            </View>

            <Text style={styles.sceneManagerSectionTitle}>Scene Images</Text>
            <Text style={styles.sceneManagerSectionSubtitle}>
              Each scene represents a different image slot for your offering
            </Text>

            {SCENE_TYPES.map((sceneType) => (
              <View key={sceneType.id} style={styles.sceneItem}>
                <View style={styles.sceneItemHeader}>
                  <View style={styles.sceneItemIcon}>
                    <Ionicons name={sceneType.icon as any} size={16} color="#4A7DFF" />
                  </View>
                  <View style={styles.sceneItemInfo}>
                    <Text style={styles.sceneItemLabel}>{sceneType.label}</Text>
                    <Text style={styles.sceneItemDescription}>{sceneType.description}</Text>
                  </View>
                  <View style={styles.sceneItemBadge}>
                    <Text style={styles.sceneItemBadgeText}>
                      {sceneImages[sceneType.id] ? 'Set' : 'Empty'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.sceneImageContainer}
                  onPress={async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      quality: 0.8,
                    });
                    if (!result.canceled && result.assets[0]) {
                      updateSceneImage(sceneType.id, result.assets[0].uri);
                    }
                  }}
                >
                  {sceneImages[sceneType.id] ? (
                    <Image source={{ uri: sceneImages[sceneType.id] }} style={styles.sceneImage} />
                  ) : (
                    <View style={styles.sceneImagePlaceholder}>
                      <Ionicons name="image-outline" size={32} color="#8A8AAE" />
                      <Text style={styles.sceneImagePlaceholderText}>Tap to add image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ))}

            <Text style={styles.sceneManagerSectionTitle}>Gallery Images</Text>
            <Text style={styles.sceneManagerSectionSubtitle}>
              Additional images for your offering
            </Text>

            <View style={styles.galleryContainer}>
              {galleryImages.length === 0 ? (
                <View style={styles.galleryEmpty}>
                  <Ionicons name="images-outline" size={40} color="#8A8AAE" />
                  <Text style={styles.galleryEmptyText}>No gallery images yet</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {galleryImages.map((uri, index) => (
                    <View key={index} style={styles.galleryImageContainer}>
                      <Image source={{ uri }} style={styles.galleryImage} />
                      <TouchableOpacity 
                        style={styles.galleryImageRemove} 
                        onPress={() => removeGalleryImage(index)}
                      >
                        <Ionicons name="close" size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.galleryAddButton} onPress={addGalleryImages}>
              <Ionicons name="add-circle-outline" size={20} color="#4A7DFF" />
              <Text style={styles.galleryAddText}>Add Gallery Images</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.saveScenesButton} 
              onPress={() => {
                Alert.alert('Success', 'Scenes updated successfully!');
                setShowSceneManager(false);
              }}
            >
              <LinearGradient colors={['#4A7DFF', '#6C5CE7']} style={styles.saveScenesGradient}>
                <Text style={styles.saveScenesButtonText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // --- Render Business Settings ---
  const renderBusinessSettings = () => {
    if (!showBusinessSettings) return null;

    return (
      <Modal
        visible={showBusinessSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBusinessSettings(false)}
      >
        <View style={styles.settingsContainer}>
          <View style={styles.settingsHeader}>
            <TouchableOpacity onPress={() => setShowBusinessSettings(false)}>
              <Ionicons name="arrow-back" size={24} color="#1F2F5F" />
            </TouchableOpacity>
            <Text style={styles.settingsTitle}>Business Settings</Text>
            <TouchableOpacity onPress={saveBusinessSettings} disabled={savingSettings}>
              <Text style={styles.settingsSave}>
                {savingSettings ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.settingsContent} showsVerticalScrollIndicator={false}>
            <View style={styles.settingsGroup}>
              <Text style={styles.settingsGroupTitle}>Branding</Text>
              
              <View style={styles.settingsImagePicker}>
                <TouchableOpacity onPress={pickLogo}>
                  {businessSettings.logo ? (
                    <Image source={{ uri: businessSettings.logo }} style={styles.settingsLogo} />
                  ) : (
                    <View style={styles.settingsImagePlaceholder}>
                      <Ionicons name="camera" size={24} color="#8A8AAE" />
                      <Text style={styles.settingsImagePlaceholderText}>Logo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.settingsBannerPicker}>
                <TouchableOpacity onPress={pickBanner}>
                  {businessSettings.banner ? (
                    <Image source={{ uri: businessSettings.banner }} style={styles.settingsBanner} />
                  ) : (
                    <View style={styles.settingsBannerPlaceholder}>
                      <Ionicons name="image-outline" size={32} color="#8A8AAE" />
                      <Text style={styles.settingsBannerPlaceholderText}>Add Banner</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={styles.settingsGroupTitle}>Business Details</Text>
              
              <View style={styles.settingsField}>
                <Text style={styles.settingsLabel}>Description</Text>
                <TextInput
                  style={[styles.settingsInput, styles.settingsTextArea]}
                  placeholder="Describe your business"
                  multiline
                  numberOfLines={3}
                  value={businessSettings.description}
                  onChangeText={(text) => setBusinessSettings(prev => ({ ...prev, description: text }))}
                />
              </View>

              <View style={styles.settingsField}>
                <Text style={styles.settingsLabel}>Phone</Text>
                <TextInput
                  style={styles.settingsInput}
                  placeholder="+256 700 000 000"
                  value={businessSettings.phone}
                  onChangeText={(text) => setBusinessSettings(prev => ({ ...prev, phone: text }))}
                />
              </View>

              <View style={styles.settingsField}>
                <Text style={styles.settingsLabel}>Working Hours</Text>
                <TextInput
                  style={styles.settingsInput}
                  placeholder="Mon-Fri 9AM-5PM"
                  value={businessSettings.workingHours}
                  onChangeText={(text) => setBusinessSettings(prev => ({ ...prev, workingHours: text }))}
                />
              </View>

              <View style={styles.settingsToggle}>
                <Text style={styles.toggleLabel}>Business Open</Text>
                <Switch
                  value={businessSettings.isOpen}
                  onValueChange={(value) => setBusinessSettings(prev => ({ ...prev, isOpen: value }))}
                  trackColor={{ false: '#E8ECF4', true: '#4A7DFF' }}
                />
              </View>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={styles.settingsGroupTitle}>Verification</Text>
              <View style={styles.verificationItem}>
                <View style={[styles.verificationIcon, { backgroundColor: 'rgba(46,204,113,0.1)' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />
                </View>
                <View style={styles.verificationContent}>
                  <Text style={styles.verificationTitle}>Email Verified</Text>
                  <Text style={styles.verificationDesc}>Your email has been confirmed</Text>
                </View>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // ============================================================
  // 5. TABS AND LOADING STATES
  // ============================================================

  // --- Tabs ---
  const tabs = [
    { key: 'overview', icon: 'home-outline', label: 'Overview' },
    { key: 'offerings', icon: 'grid-outline', label: 'Offerings' },
    { key: 'wallet', icon: 'wallet-outline', label: 'Wallet' },
  ];

  // --- Loading State ---
  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDesktop && styles.loadingContainerDesktop]}>
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // --- No Business State ---
  if (!business) {
    return (
      <View style={[styles.emptyState, isDesktop && styles.emptyStateDesktop]}>
        <Ionicons name="storefront-outline" size={48} color="#8A8AAE" />
        <Text style={styles.emptyTitle}>No business found</Text>
        <Text style={styles.emptySubtitle}>Set up your business to start selling on Munolink.</Text>
        <TouchableOpacity style={styles.setupBtn} onPress={() => navigation.navigate('BusinessRegistration')}>
          <Text style={styles.setupBtnText}>Set Up Business</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Main Render ---
  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {isDesktop ? (
        <View style={styles.desktopHeader}>
          <Text style={styles.desktopHeaderTitle}>Business Dashboard</Text>
          <Text style={styles.desktopHeaderSubtitle}>Manage your business on Munolink</Text>
        </View>
      ) : (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2F5F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity onPress={() => setShowBusinessSettings(true)}>
            <Ionicons name="settings-outline" size={24} color="#1F2F5F" />
          </TouchableOpacity>
        </View>
      )}

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

      {renderAddModal()}
      {renderSceneManager()}
      {renderBusinessSettings()}
    </View>
  );
};

// --- Main Component ---
export const BusinessDashboardScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout 
      currentRoute="BusinessDashboard" 
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      <BusinessDashboardContent navigation={navigation} />
    </ResponsiveLayout>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  containerDesktop: {
    backgroundColor: '#F8F9FC',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainerDesktop: {
    padding: 40,
  },
  loadingText: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateDesktop: {
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
  desktopHeader: {
    marginBottom: 24,
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
  statsGridDesktop: {
    gap: 12,
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
  quickActionsDesktop: {
    gap: 12,
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
  addButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addButtonProduct: {
    backgroundColor: '#2ECC71',
  },
  addButtonService: {
    backgroundColor: '#6C5CE7',
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
  offeringCardProduct: {
    borderLeftWidth: 4,
    borderLeftColor: '#2ECC71',
  },
  offeringCardService: {
    borderLeftWidth: 4,
    borderLeftColor: '#6C5CE7',
  },
  offeringImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 10,
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
  offeringActions: {
    flexDirection: 'row',
    gap: 4,
  },
  offeringAction: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  offeringTypeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  offeringTypeBadgeText: {
    fontSize: 10,
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
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  addModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  addModalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  addModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    paddingBottom: 20,
  },
  addModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  addModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  addModalScroll: {
    paddingHorizontal: 20,
  },
  searchSection: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  searchInput: {
    flex: 1,
    color: '#1F2F5F',
    fontSize: 15,
    padding: 0,
  },
  createCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(74,125,255,0.08)',
    gap: 6,
  },
  createCustomBtnText: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: '500',
  },
  searchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  searchLoadingText: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  searchResultsList: {
    maxHeight: 300,
    marginTop: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6FA',
    gap: 10,
  },
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  searchResultCategory: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 1,
  },
  searchEmpty: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  searchEmptyTitle: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  searchEmptySubtext: {
    color: '#8A8AAE',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  formSection: {
    paddingTop: 12,
  },
  formGroup: {
    gap: 4,
    marginBottom: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
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
  publishButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 8,
  },
  publishButtonDisabled: {
    opacity: 0.5,
  },
  publishGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addSpecBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(74,125,255,0.08)',
    borderRadius: 6,
  },
  addSpecBtnText: {
    color: '#4A7DFF',
    fontSize: 12,
    fontWeight: '500',
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  specItemKey: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 4,
  },
  specItemValue: {
    color: '#8A8AAE',
    fontSize: 13,
    flex: 1,
  },
  specItemRemove: {
    padding: 4,
  },
  specEmptyText: {
    color: '#8A8AAE',
    fontSize: 12,
    paddingVertical: 4,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
  },
  addTagBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4A7DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74,125,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  tagChipText: {
    color: '#4A7DFF',
    fontSize: 12,
  },
  tagEmptyText: {
    color: '#8A8AAE',
    fontSize: 12,
    paddingVertical: 4,
  },
  suggestedTagsScroll: {
    maxHeight: 36,
    marginTop: 4,
  },
  suggestedTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F5F7FA',
    borderRadius: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  suggestedTagText: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  dropdownList: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    maxHeight: 150,
    zIndex: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6FA',
  },
  dropdownItemText: {
    color: '#1F2F5F',
    fontSize: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    backgroundColor: 'transparent',
  },
  typeOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeOptionText: {
    color: '#8A8AAE',
    fontSize: 13,
    fontWeight: '500',
  },
  typeOptionTextActive: {
    color: '#1F2F5F',
    fontWeight: '600',
  },
  sceneManagerContainer: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  sceneManagerHeader: {
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
  sceneManagerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  sceneManagerContent: {
    padding: 16,
  },
  sceneManagerProduct: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  sceneManagerProductName: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: '600',
  },
  sceneManagerProductPrice: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  sceneManagerTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(74,125,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  sceneManagerTypeBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4A7DFF',
  },
  sceneManagerSectionTitle: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  sceneManagerSectionSubtitle: {
    color: '#8A8AAE',
    fontSize: 12,
    marginBottom: 12,
  },
  sceneItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  sceneItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sceneItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sceneItemInfo: {
    flex: 1,
  },
  sceneItemLabel: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  sceneItemDescription: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  sceneItemBadge: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sceneItemBadgeText: {
    color: '#4A7DFF',
    fontSize: 10,
    fontWeight: '500',
  },
  sceneImageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    aspectRatio: 1.5,
    backgroundColor: '#F5F7FA',
  },
  sceneImage: {
    width: '100%',
    height: '100%',
  },
  sceneImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  sceneImagePlaceholderText: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  galleryContainer: {
    marginBottom: 16,
  },
  galleryImageContainer: {
    flex: 1,
    margin: 4,
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  galleryImageRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  galleryEmptyText: {
    color: '#8A8AAE',
    fontSize: 13,
    marginTop: 4,
  },
  galleryAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  galleryAddText: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: '500',
  },
  saveScenesButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  saveScenesGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveScenesButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  settingsHeader: {
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
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  settingsSave: {
    color: '#4A7DFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsContent: {
    padding: 16,
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  settingsGroupTitle: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingsImagePicker: {
    alignItems: 'center',
  },
  settingsLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F7FA',
  },
  settingsImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsImagePlaceholderText: {
    color: '#8A8AAE',
    fontSize: 10,
    marginTop: 4,
  },
  settingsBannerPicker: {
    alignItems: 'center',
    width: '100%',
  },
  settingsBanner: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
  },
  settingsBannerPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsBannerPlaceholderText: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 4,
  },
  settingsField: {
    marginBottom: 12,
  },
  settingsLabel: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingsInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1F2F5F',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  settingsTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  settingsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationContent: {
    flex: 1,
  },
  verificationTitle: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
  },
  verificationDesc: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  referralIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74,125,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralContent: {
    flex: 1,
  },
  referralTitle: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
  },
  referralDesc: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  referralCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  referralCodeLabel: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  referralCodeValue: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  viewAllBtnText: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: '500',
  },
  specsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specsModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: width * 0.85,
  },
  specsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  specsModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  specsModalClose: {
    padding: 4,
  },
  specsModalInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1F2F5F',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    marginBottom: 10,
  },
  specsModalAdd: {
    backgroundColor: '#4A7DFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  specsModalAddText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});