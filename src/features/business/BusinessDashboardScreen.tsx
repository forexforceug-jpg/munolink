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
type Institution = Database['public']['Tables']['institutions']['Row'];

// --- Extended Business Type ---
interface ExtendedBusiness {
  id: string;
  owner_id: string | null;
  name: string;
  category: string | null;
  description: string | null;
  business_type: string | null;
  is_active: boolean;
  is_verified: boolean | null;
  rating: number | null;
  review_count: number | null;
  logo_url: string | null;
  banner_url?: string | null;
  phone: string | null;
  opening_hours: string | null;
  is_open: boolean | null;
  created_at: string | null;
  price?: number;
  service_id?: string;
  institution_id?: string;
}

// --- Simplified Business Type Configuration ---
const BUSINESS_CONFIGS: Record<string, any> = {
  shop: {
    offeringLabel: 'Products',
    offeringIcon: 'cube-outline',
    catalogTable: 'catalog',
    offeringTable: 'shop_products',
    foreignKey: 'catalog_id',
    priceField: 'regular_price',
    stockField: 'in_stock',
    activeField: 'in_stock',
    supportsAttributes: false,
    hasStock: true,
  },
  service: {
    offeringLabel: 'Services',
    offeringIcon: 'construct-outline',
    catalogTable: 'service_catalog',
    offeringTable: 'provider_services',
    foreignKey: 'service_id',
    priceField: 'price',
    activeField: 'is_active',
    supportsAttributes: false,
    hasStock: false,
  },
  institution: {
    offeringLabel: 'Offerings',
    offeringIcon: 'business-outline',
    catalogTable: 'service_catalog',
    offeringTable: 'provider_services',
    foreignKey: 'service_id',
    priceField: 'price',
    activeField: 'is_active',
    supportsAttributes: false,
    hasStock: false,
  },
};

// --- Placeholder Image ---
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiM0QTdERkYiLz48dGV4dCB4PSI0MCIgeT0iNDAiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiNGRkZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LWZhbWlseT0iQXJpYWwiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

// ============================================================
// BUSINESS DASHBOARD MAIN COMPONENT
// ============================================================

const BusinessDashboardContent = ({ navigation }: any) => {
  const { user } = useAuth();
  const { isDesktop } = useBreakpoint();
  
  // --- State ---
  const [business, setBusiness] = useState<ExtendedBusiness | null>(null);
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
  
  // --- Add Offering States ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [offeringType, setOfferingType] = useState<'product' | 'service'>('product');
  const [saving, setSaving] = useState(false);
  
  // --- Form Data ---
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    images: [] as string[],
    in_stock: true,
    is_active: true,
    brand: '',
    duration: '',
  });
  
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
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  // ============================================================
  // 1. HELPER FUNCTIONS
  // ============================================================

  // --- Upload Image to Supabase Storage ---
  const uploadImage = async (uri: string, folder: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = blob.type.split('/')[1] || 'jpg';
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('catalog-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('catalog-images')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // --- Upload Multiple Images ---
  const uploadImages = async (uris: string[], folder: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const uri of uris) {
      try {
        const url = await uploadImage(uri, folder);
        uploadedUrls.push(url);
      } catch (error) {
        console.error('Failed to upload image:', uri, error);
      }
    }
    
    return uploadedUrls;
  };

  // --- Upload Business Image to catalog-images bucket ---
  const uploadBusinessImage = async (uri: string, folder: string): Promise<string> => {
    try {
      console.log('📤 Uploading business image to catalog-images...');
      
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = blob.type.split('/')[1] || 'jpg';
      const fileName = `business/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      console.log(`📝 Filename: ${fileName}`);
      
      const { data, error } = await supabase.storage
        .from('catalog-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('catalog-images')
        .getPublicUrl(fileName);

      console.log('✅ Uploaded:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading business image:', error);
      throw error;
    }
  };

  // --- Delete Image from Storage ---
  const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
    try {
      const urlParts = imageUrl.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('catalog-images') + 1).join('/');
      
      if (filePath) {
        const { error } = await supabase.storage
          .from('catalog-images')
          .remove([filePath]);
        
        if (error) {
          console.error('Error deleting image from storage:', error);
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  // --- Delete Multiple Images from Storage ---
  const deleteImagesFromStorage = async (imageUrls: string[]): Promise<void> => {
    for (const url of imageUrls) {
      await deleteImageFromStorage(url);
    }
  };

  // --- Save Scenes ---
  const saveScenes = async (opportunityId: string, images: string[], type: 'product' | 'service') => {
    try {
      const sceneTypes: ('hero' | 'details' | 'trust' | 'gallery' | 'extra')[] = ['hero', 'details', 'trust', 'gallery', 'extra'];
      const maxScenes = Math.min(images.length, 5);

      await supabase
        .from('opportunity_scenes')
        .delete()
        .eq('opportunity_id', opportunityId)
        .eq('opportunity_type', type);

      for (let i = 0; i < maxScenes; i++) {
        const sceneType = sceneTypes[i] || 'gallery';
        await supabase
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

  // --- Remove Image from Form ---
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // --- Reset Form ---
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      images: [],
      in_stock: true,
      is_active: true,
      brand: '',
      duration: '',
    });
  };

  // --- Load Shop Offerings (Products) ---
  const loadShopOfferings = async (shopId: string) => {
    console.log('🔄 Loading shop offerings for shop:', shopId);
    let allOfferings: any[] = [];

    try {
      const { data: productData, error: productError } = await supabase
        .from('shop_products')
        .select('*')
        .eq('shop_id', shopId)
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
          
          const { data: sceneData } = await supabase
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
      }
    } catch (error) {
      console.error('❌ Product load exception:', error);
    }

    setOfferings(allOfferings);
    console.log('📊 Total shop offerings loaded:', allOfferings.length);
  };

  // --- Load Service Offerings (Services) ---
  const loadServiceOfferings = async (userId: string) => {
    console.log('🔄 Loading service offerings for user:', userId);
    let allOfferings: any[] = [];

    try {
      const { data: serviceData, error: serviceError } = await supabase
        .from('provider_services')
        .select('*')
        .eq('user_id', userId)
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
          
          const { data: sceneData } = await supabase
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
      }
    } catch (error) {
      console.error('❌ Service load exception:', error);
    }

    setOfferings(allOfferings);
    console.log('📊 Total service offerings loaded:', allOfferings.length);
  };

  // --- Load Institution Offerings ---
  const loadInstitutionOfferings = async (institutionId: string) => {
    console.log('🔄 Loading institution offerings for institution:', institutionId);
    let allOfferings: any[] = [];

    try {
      const { data: serviceData, error: serviceError } = await supabase
        .from('provider_services')
        .select('*')
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });

      if (!serviceError && serviceData) {
        console.log('✅ Found', serviceData.length, 'institution services');
        
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
          
          const { data: sceneData } = await supabase
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
      }
    } catch (error) {
      console.error('❌ Institution service load exception:', error);
    }

    setOfferings(allOfferings);
    console.log('📊 Total institution offerings loaded:', allOfferings.length);
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
      let businessData: ExtendedBusiness | null = null;
      let businessType = 'shop';
      let businessId: string | null = null;

      // 1. Try to load from shops table
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (!shopError && shopData && shopData.length > 0) {
        const shop = shopData[0];
        businessData = {
          id: shop.id,
          owner_id: shop.owner_id,
          name: shop.name,
          category: shop.category,
          description: shop.description,
          business_type: shop.business_type,
          is_active: shop.is_active || false,
          is_verified: shop.is_verified || false,
          rating: shop.rating || 0,
          review_count: shop.review_count || 0,
          logo_url: shop.logo_url || null,
          banner_url: (shop as any).banner_url || null,
          phone: shop.phone || null,
          opening_hours: shop.opening_hours || null,
          is_open: shop.is_open !== false,
          created_at: shop.created_at,
        };
        businessType = 'shop';
        businessId = shop.id;
        console.log('✅ Found shop business:', businessData.name);
      }

      // 2. If no shop, try to load from provider_services
      if (!businessData) {
        const { data: serviceData, error: serviceError } = await supabase
          .from('provider_services')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!serviceError && serviceData && serviceData.length > 0) {
          const service = serviceData[0];
          
          let catalogData = null;
          if (service.service_id) {
            const { data: catalog, error: catalogError } = await supabase
              .from('service_catalog')
              .select('*')
              .eq('id', service.service_id)
              .single();
            
            if (!catalogError) {
              catalogData = catalog;
            }
          }

          businessData = {
            id: service.id,
            owner_id: service.user_id,
            name: catalogData?.name || 'Service Business',
            category: catalogData?.category || 'Uncategorized',
            description: catalogData?.description || '',
            business_type: 'service',
            is_active: service.is_active || false,
            is_verified: false,
            rating: 0,
            review_count: 0,
            logo_url: null,
            banner_url: null,
            phone: null,
            opening_hours: null,
            is_open: true,
            created_at: service.created_at,
            price: service.price,
            service_id: service.service_id,
          };
          businessType = 'service';
          businessId = service.id;
          console.log('✅ Found service business:', businessData.name);
        }
      }

      // 3. If no shop or service, try to load from institutions
      if (!businessData) {
        const { data: institutionData, error: institutionError } = await supabase
          .from('institutions')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (!institutionError && institutionData && institutionData.length > 0) {
          const institution = institutionData[0];
          businessData = {
            id: institution.id,
            owner_id: user.id,
            name: institution.name,
            category: institution.type || 'Uncategorized',
            description: institution.description || '',
            business_type: 'institution',
            is_active: institution.is_open || false,
            is_verified: institution.is_verified || false,
            rating: institution.rating || 0,
            review_count: institution.review_count || 0,
            logo_url: institution.logo || null,
            banner_url: institution.cover_image || null,
            phone: institution.phone || null,
            opening_hours: institution.working_hours ? JSON.stringify(institution.working_hours) : null,
            is_open: institution.is_open !== false,
            created_at: institution.created_at,
            institution_id: institution.id,
          };
          businessType = 'institution';
          businessId = institution.id;
          console.log('✅ Found institution business:', businessData.name);
        }
      }

      if (!businessData) {
        setLoading(false);
        return;
      }

      setBusiness(businessData);
      setBusinessType(businessType);
      setCategory(businessData.category || '');
      setConfig(BUSINESS_CONFIGS[businessType] || BUSINESS_CONFIGS.shop);

      setBusinessSettings({
        logo: businessData.logo_url || '',
        banner: businessData.banner_url || '',
        description: businessData.description || '',
        phone: businessData.phone || '',
        email: '',
        website: '',
        workingHours: businessData.opening_hours || '',
        isOpen: businessData.is_open !== false,
      });

      // Load offerings based on business type
      if (businessType === 'shop' && businessId) {
        await loadShopOfferings(businessId);
      } else if (businessType === 'service' && user.id) {
        await loadServiceOfferings(user.id);
      } else if (businessType === 'institution' && businessId) {
        await loadInstitutionOfferings(businessId);
      }

      // Load transactions
      if (businessId) {
        const { data: activityData } = await supabase
          .from('transactions')
          .select('*')
          .eq('shop_id', businessId)
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
          rating: businessData.rating || 0,
          reviews: businessData.review_count || 0,
        });
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // --- Publish Offering (CREATE) ---
  const publishOffering = async () => {
    if (!business) {
      Alert.alert('Error', 'No business found');
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name/title');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setSaving(true);

    try {
      const price = parseFloat(formData.price);
      const folder = offeringType === 'product' ? 'products' : 'services';

      let uploadedImageUrls: string[] = [];
      if (formData.images.length > 0) {
        console.log('📤 Uploading images...');
        uploadedImageUrls = await uploadImages(formData.images, folder);
        console.log('✅ Uploaded images:', uploadedImageUrls);
      }

      const table = offeringType === 'product' ? 'catalog' : 'service_catalog';
      
      const insertData: any = {
        name: formData.name.trim(),
        category: formData.category.trim() || 'Uncategorized',
        description: formData.description || null,
        specifications: {},
        images: uploadedImageUrls,
        is_active: true,
        tags: [],
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
      
      const catalogId = (newCatalog as any).id;

      let offeringId: string | null = null;

      if (offeringType === 'product') {
        const { data, error } = await supabase
          .from('shop_products')
          .insert({
            shop_id: business.id,
            catalog_id: catalogId,
            regular_price: price,
            in_stock: formData.in_stock,
            seller_specifications: {},
          })
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error('Failed to create product');
        offeringId = (data as any).id;
      } else {
        const { data, error } = await supabase
          .from('provider_services')
          .insert({
            user_id: business.owner_id!,
            service_id: catalogId,
            price: price,
            is_active: formData.is_active,
            ...(businessType === 'institution' ? { institution_id: business.id } : {}),
          })
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error('Failed to create service');
        offeringId = (data as any).id;
      }

      if (offeringId && uploadedImageUrls.length > 0) {
        await saveScenes(offeringId, uploadedImageUrls, offeringType);
      }

      Alert.alert(
        'Success!',
        `${offeringType === 'product' ? 'Product' : 'Service'} published successfully!`,
        [{ text: 'OK' }]
      );

      resetForm();
      setShowAddModal(false);
      await loadDashboard();

    } catch (error: any) {
      console.error('Publish error:', error);
      Alert.alert('Error', error.message || 'Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  // --- Update Offering (EDIT) ---
  const updateOffering = async () => {
    if (!selectedOffering) {
      Alert.alert('Error', 'No offering selected');
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name/title');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setSaving(true);

    try {
      const price = parseFloat(formData.price);
      const folder = offeringType === 'product' ? 'products' : 'services';
      
      const catalogData = selectedOffering.catalog || selectedOffering.service_catalog || {};
      const existingImages = catalogData.images || [];
      
      const removedImages = existingImages.filter((img: string) => !formData.images.includes(img));
      
      if (removedImages.length > 0) {
        console.log('🗑️ Deleting removed images:', removedImages);
        await deleteImagesFromStorage(removedImages);
      }
      
      const localUris = formData.images.filter((img: string) => img.startsWith('file://') || img.startsWith('blob:'));
      let newUploadedImages: string[] = [];
      
      if (localUris.length > 0) {
        console.log('📤 Uploading new images...');
        newUploadedImages = await uploadImages(localUris, folder);
        console.log('✅ Uploaded new images:', newUploadedImages);
      }
      
      const existingUrls = formData.images.filter((img: string) => !img.startsWith('file://') && !img.startsWith('blob:'));
      const allImageUrls = [...existingUrls, ...newUploadedImages];

      const table = offeringType === 'product' ? 'catalog' : 'service_catalog';
      const catalogId = catalogData.id;
      
      const updateData: any = {
        name: formData.name.trim(),
        category: formData.category.trim() || 'Uncategorized',
        description: formData.description || null,
        images: allImageUrls,
        updated_at: new Date().toISOString(),
      };
      
      if (offeringType === 'product') {
        updateData.brand = formData.brand || null;
      }
      
      if (offeringType === 'service') {
        updateData.duration = formData.duration || null;
      }

      const { error: catalogError } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', catalogId);

      if (catalogError) throw catalogError;

      if (offeringType === 'product') {
        const { error } = await supabase
          .from('shop_products')
          .update({
            regular_price: price,
            in_stock: formData.in_stock,
          })
          .eq('id', selectedOffering.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('provider_services')
          .update({
            price: price,
            is_active: formData.is_active,
          })
          .eq('id', selectedOffering.id);

        if (error) throw error;
      }

      if (allImageUrls.length > 0) {
        await saveScenes(selectedOffering.id, allImageUrls, offeringType);
      }

      Alert.alert(
        'Success!',
        `${offeringType === 'product' ? 'Product' : 'Service'} updated successfully!`,
        [{ text: 'OK' }]
      );

      setShowEditModal(false);
      resetForm();
      await loadDashboard();

    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // --- Delete Offering ---
  const deleteOffering = async () => {
    if (!selectedOffering) {
      Alert.alert('Error', 'No offering selected');
      return;
    }

    setSaving(true);
    try {
      const catalogData = selectedOffering.catalog || selectedOffering.service_catalog || {};
      
      if (catalogData.images && catalogData.images.length > 0) {
        console.log('🗑️ Deleting images...');
        await deleteImagesFromStorage(catalogData.images);
      }
      
      await supabase
        .from('opportunity_scenes')
        .delete()
        .eq('opportunity_id', selectedOffering.id)
        .eq('opportunity_type', selectedOffering.type || 'product');
      
      if (selectedOffering.type === 'product') {
        await supabase
          .from('shop_products')
          .delete()
          .eq('id', selectedOffering.id);
      } else {
        await supabase
          .from('provider_services')
          .delete()
          .eq('id', selectedOffering.id);
      }
      
      const table = selectedOffering.type === 'product' ? 'catalog' : 'service_catalog';
      await supabase
        .from(table)
        .delete()
        .eq('id', catalogData.id);
      
      Alert.alert('Success', 'Offering deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedOffering(null);
      await loadDashboard();
      
    } catch (error: any) {
      console.error('Delete error:', error);
      Alert.alert('Error', error.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  // --- Open Edit Modal ---
  const openEditModal = (offering: any) => {
    const catalogData = offering.catalog || offering.service_catalog || {};
    
    setSelectedOffering(offering);
    setOfferingType(offering.type || 'product');
    
    setFormData({
      name: catalogData.name || '',
      description: catalogData.description || '',
      price: offering.regular_price?.toString() || offering.price?.toString() || '',
      category: catalogData.category || '',
      images: catalogData.images || [],
      in_stock: offering.in_stock !== undefined ? offering.in_stock : true,
      is_active: offering.is_active !== undefined ? offering.is_active : true,
      brand: catalogData.brand || '',
      duration: catalogData.duration || '',
    });
    
    setShowEditModal(true);
  };

  // --- Open Scene Manager ---
  const openSceneManager = async (offering: any) => {
    setSelectedOffering(offering);
    setShowSceneManager(true);
    
    const type = offering.type || 'product';
    
    const { data } = await supabase
      .from('opportunity_scenes')
      .select('*')
      .eq('opportunity_id', offering.id)
      .eq('opportunity_type', type)
      .order('scene_index', { ascending: true });

    if (data) {
      const sceneMap: Record<string, string> = {};
      const gallery: string[] = [];
      data.forEach((scene: any) => {
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
      const type = selectedOffering.type || 'product';
      
      const validSceneTypes: ('hero' | 'details' | 'trust' | 'gallery' | 'extra')[] = ['hero', 'details', 'trust', 'gallery', 'extra'];
      const sceneIndex = validSceneTypes.indexOf(sceneType as any);
      
      if (sceneIndex === -1) {
        throw new Error('Invalid scene type');
      }
      
      const { error } = await supabase
        .from('opportunity_scenes')
        .upsert({
          opportunity_id: selectedOffering.id,
          opportunity_type: type,
          scene_type: sceneType as 'hero' | 'details' | 'trust' | 'gallery' | 'extra',
          scene_index: sceneIndex + 1,
          image_url: imageUri,
          is_primary: sceneType === 'hero',
        }, { onConflict: 'opportunity_id, scene_type' });

      if (error) throw error;

      setSceneImages(prev => ({ ...prev, [sceneType]: imageUri }));
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
        const type = selectedOffering.type || 'product';
        
        for (const img of newImages) {
          await supabase
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
        
        setGalleryImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error adding gallery images:', error);
    }
  };

  // --- Remove Gallery Image ---
  const removeGalleryImage = async (index: number) => {
    const imageToRemove = galleryImages[index];
    try {
      await supabase
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
      let logoUrl = businessSettings.logo;
      let bannerUrl = businessSettings.banner;

      console.log('🔄 Starting business settings save...');
      console.log('📷 Logo:', logoUrl ? 'Has logo' : 'No logo');
      console.log('📷 Banner:', bannerUrl ? 'Has banner' : 'No banner');

      // Upload logo if it's a local file
      if (logoUrl && (logoUrl.startsWith('file://') || logoUrl.startsWith('blob:'))) {
        console.log('📤 Uploading logo...');
        logoUrl = await uploadBusinessImage(logoUrl, 'logos');
        console.log('✅ Logo uploaded:', logoUrl);
        // Update the state immediately to show preview
        setBusinessSettings(prev => ({ ...prev, logo: logoUrl }));
      }

      // Upload banner if it's a local file
      if (bannerUrl && (bannerUrl.startsWith('file://') || bannerUrl.startsWith('blob:'))) {
        console.log('📤 Uploading banner...');
        bannerUrl = await uploadBusinessImage(bannerUrl, 'banners');
        console.log('✅ Banner uploaded:', bannerUrl);
        // Update the state immediately to show preview
        setBusinessSettings(prev => ({ ...prev, banner: bannerUrl }));
      }

      // Update based on business type
      if (businessType === 'shop' || businessType === 'service') {
        const updateData: any = {
          logo_url: logoUrl || null,
          description: businessSettings.description || null,
          phone: businessSettings.phone || null,
          opening_hours: businessSettings.workingHours || null,
          is_open: businessSettings.isOpen,
        };
        
        // Add banner_url if it exists in schema
        (updateData as any).banner_url = bannerUrl || null;

        console.log('📝 Updating shop with:', updateData);

        const { error } = await supabase
          .from('shops')
          .update(updateData)
          .eq('id', business.id);

        if (error) {
          console.error('❌ Update error:', error);
          throw error;
        }
        console.log('✅ Shop updated successfully');
      } else if (businessType === 'institution') {
        const updateData = {
          logo: logoUrl || null,
          cover_image: bannerUrl || null,
          description: businessSettings.description || null,
          phone: businessSettings.phone || null,
          working_hours: businessSettings.workingHours ? { hours: businessSettings.workingHours } : null,
          is_open: businessSettings.isOpen,
        };

        console.log('📝 Updating institution with:', updateData);

        const { error } = await supabase
          .from('institutions')
          .update(updateData)
          .eq('id', business.id);

        if (error) {
          console.error('❌ Update error:', error);
          throw error;
        }
        console.log('✅ Institution updated successfully');
      }

      // Update local business state
      setBusiness(prev => prev ? {
        ...prev,
        logo_url: logoUrl || prev.logo_url,
        banner_url: bannerUrl || prev.banner_url,
        description: businessSettings.description || prev.description,
        phone: businessSettings.phone || prev.phone,
        opening_hours: businessSettings.workingHours || prev.opening_hours,
        is_open: businessSettings.isOpen,
      } : null);

      Alert.alert('Success', 'Business settings updated successfully!');
      setShowBusinessSettings(false);
      
      // Reload dashboard to refresh everything
      await loadDashboard();

    } catch (error: any) {
      console.error('❌ Error saving settings:', error);
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
      resetForm();
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
        <Text style={styles.sectionTitle}>
          All Offerings ({offerings.length})
          <Text style={{ fontSize: 12, color: '#8A8AAE', fontWeight: '400' }}>
            {' '}({offerings.filter(o => o.type === 'product').length} products, {offerings.filter(o => o.type === 'service').length} services)
          </Text>
        </Text>
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
                source={{ uri: images[0] || PLACEHOLDER_IMAGE }}
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
                <TouchableOpacity 
                  style={styles.offeringAction}
                  onPress={() => openEditModal(item)}
                >
                  <Ionicons name="create-outline" size={18} color="#4A7DFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.offeringAction, { backgroundColor: 'rgba(231,76,60,0.08)' }]}
                  onPress={() => {
                    setSelectedOffering(item);
                    setShowDeleteConfirm(true);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#E74C3C" />
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
                    source={{ uri: images[0] || PLACEHOLDER_IMAGE }}
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
              <View style={styles.formSection}>
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

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Name/Title *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder={`Enter ${offeringType} name`}
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Category</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., Electronics, Fashion, Home Services"
                    value={formData.category}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
                  />
                </View>

                {offeringType === 'product' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Brand (optional)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g., Apple, Samsung"
                      value={formData.brand}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, brand: text }))}
                    />
                  </View>
                )}

                {offeringType === 'service' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Duration (optional)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g., 1 hour, 2-3 days"
                      value={formData.duration}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
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

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Price (UGX) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    keyboardType="numeric"
                    value={formData.price}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Images</Text>
                  <Text style={styles.formHelperText}>Upload photos to showcase your offering</Text>
                  
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
                        <Ionicons name="camera" size={24} color="#4A7DFF" />
                        <Text style={styles.imageAddText}>Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.imageHelperText}>
                    {formData.images.length}/5 images added
                  </Text>
                </View>

                {formData.images.length > 0 && (
                  <View style={styles.previewSection}>
                    <Text style={styles.previewLabel}>Preview</Text>
                    <View style={styles.previewContainer}>
                      <Image 
                        source={{ uri: formData.images[0] }} 
                        style={styles.previewImage}
                      />
                      <View style={styles.previewInfo}>
                        <Text style={styles.previewName}>{formData.name || 'Untitled'}</Text>
                        <Text style={styles.previewPrice}>UGX {formData.price || '0'}</Text>
                        <Text style={styles.previewCategory}>{formData.category || 'Uncategorized'}</Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    {offeringType === 'product' ? 'In Stock' : 'Active'}
                  </Text>
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
                        Publish {offeringType === 'product' ? 'Product' : 'Service'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // --- Render Edit Modal ---
  const renderEditModal = () => {
    if (!showEditModal || !selectedOffering) return null;
    
    return (
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.addModalOverlay}>
          <TouchableOpacity 
            style={styles.addModalBackdrop} 
            activeOpacity={1}
            onPress={() => setShowEditModal(false)}
          />
          <Animated.View 
            style={[
              styles.addModalContent,
              { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
            ]}
          >
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>
                Edit {offeringType === 'product' ? 'Product' : 'Service'}
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#1F2F5F" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.addModalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formSection}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Name/Title *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder={`Enter ${offeringType} name`}
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Category</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., Electronics, Fashion, Home Services"
                    value={formData.category}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
                  />
                </View>

                {offeringType === 'product' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Brand (optional)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g., Apple, Samsung"
                      value={formData.brand}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, brand: text }))}
                    />
                  </View>
                )}

                {offeringType === 'service' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Duration (optional)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g., 1 hour, 2-3 days"
                      value={formData.duration}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
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

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Price (UGX) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    keyboardType="numeric"
                    value={formData.price}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Images</Text>
                  <Text style={styles.formHelperText}>Upload photos to showcase your offering</Text>
                  
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
                        <Ionicons name="camera" size={24} color="#4A7DFF" />
                        <Text style={styles.imageAddText}>Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.imageHelperText}>
                    {formData.images.length}/5 images added
                  </Text>
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    {offeringType === 'product' ? 'In Stock' : 'Active'}
                  </Text>
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
                  onPress={updateOffering}
                  disabled={saving}
                >
                  <LinearGradient colors={['#4A7DFF', '#6C5CE7']} style={styles.publishGradient}>
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.publishButtonText}>
                        Update {offeringType === 'product' ? 'Product' : 'Service'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // --- Render Delete Confirmation ---
  const renderDeleteConfirm = () => {
    if (!showDeleteConfirm || !selectedOffering) return null;

    const name = selectedOffering.catalog?.name || selectedOffering.service_catalog?.name || 'this offering';

    return (
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.deleteIconContainer}>
              <Ionicons name="alert-circle" size={48} color="#E74C3C" />
            </View>
            <Text style={styles.deleteTitle}>Delete Offering?</Text>
            <Text style={styles.deleteDescription}>
              Are you sure you want to delete "{name}"? This will permanently remove it from your catalog and delete all associated images. This action cannot be undone.
            </Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity 
                style={[styles.deleteButton, styles.deleteCancelButton]} 
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.deleteButton, styles.deleteConfirmButton]} 
                onPress={deleteOffering}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.deleteConfirmText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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

            {['hero', 'details', 'trust', 'gallery', 'extra'].map((sceneType) => {
              const labels: Record<string, string> = {
                hero: 'Hero',
                details: 'Details',
                trust: 'Trust',
                gallery: 'Gallery',
                extra: 'Extra'
              };
              const descriptions: Record<string, string> = {
                hero: 'Main image shown first',
                details: 'Product details view',
                trust: 'Trust signals',
                gallery: 'Multiple images',
                extra: 'Additional image'
              };
              
              return (
                <View key={sceneType} style={styles.sceneItem}>
                  <View style={styles.sceneItemHeader}>
                    <View style={styles.sceneItemIcon}>
                      <Ionicons name="image-outline" size={16} color="#4A7DFF" />
                    </View>
                    <View style={styles.sceneItemInfo}>
                      <Text style={styles.sceneItemLabel}>{labels[sceneType]}</Text>
                      <Text style={styles.sceneItemDescription}>{descriptions[sceneType]}</Text>
                    </View>
                    <View style={styles.sceneItemBadge}>
                      <Text style={styles.sceneItemBadgeText}>
                        {sceneImages[sceneType] ? 'Set' : 'Empty'}
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
                        updateSceneImage(sceneType, result.assets[0].uri);
                      }
                    }}
                  >
                    {sceneImages[sceneType] ? (
                      <Image source={{ uri: sceneImages[sceneType] }} style={styles.sceneImage} />
                    ) : (
                      <View style={styles.sceneImagePlaceholder}>
                        <Ionicons name="image-outline" size={32} color="#8A8AAE" />
                        <Text style={styles.sceneImagePlaceholderText}>Tap to add image</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}

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
              
              {/* Logo Section */}
              <View style={styles.settingsImagePicker}>
                <Text style={styles.settingsLabel}>Logo</Text>
                <TouchableOpacity onPress={pickLogo} style={styles.logoTouchable}>
                  {businessSettings.logo ? (
                    <Image 
                      source={{ uri: businessSettings.logo }} 
                      style={styles.settingsLogo}
                      onError={(e) => {
                        console.log('Logo load error:', e.nativeEvent.error);
                      }}
                    />
                  ) : (
                    <View style={styles.settingsImagePlaceholder}>
                      <Ionicons name="camera" size={24} color="#8A8AAE" />
                      <Text style={styles.settingsImagePlaceholderText}>Add Logo</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {businessSettings.logo && (
                  <Text style={styles.previewUrlText} numberOfLines={1}>
                    {businessSettings.logo}
                  </Text>
                )}
              </View>

              {/* Banner Section */}
              <View style={styles.settingsBannerPicker}>
                <Text style={styles.settingsLabel}>Banner Image</Text>
                <TouchableOpacity onPress={pickBanner} style={styles.bannerTouchable}>
                  {businessSettings.banner ? (
                    <Image 
                      source={{ uri: businessSettings.banner }} 
                      style={styles.settingsBanner}
                      onError={(e) => {
                        console.log('Banner load error:', e.nativeEvent.error);
                      }}
                    />
                  ) : (
                    <View style={styles.settingsBannerPlaceholder}>
                      <Ionicons name="image-outline" size={32} color="#8A8AAE" />
                      <Text style={styles.settingsBannerPlaceholderText}>Tap to add banner image</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {businessSettings.banner && (
                  <Text style={styles.previewUrlText} numberOfLines={1}>
                    {businessSettings.banner}
                  </Text>
                )}
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

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // ============================================================
  // 5. TABS AND LOADING STATES
  // ============================================================

  const tabs = [
    { key: 'overview', icon: 'home-outline', label: 'Overview' },
    { key: 'offerings', icon: 'grid-outline', label: 'Offerings' },
    { key: 'wallet', icon: 'wallet-outline', label: 'Wallet' },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDesktop && styles.loadingContainerDesktop]}>
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

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
        <View style={styles.bannerLeft}>
          {business.logo_url && (
            <Image 
              source={{ uri: business.logo_url }} 
              style={styles.bannerLogo}
              onError={(e) => {
                console.log('Banner logo error:', e.nativeEvent.error);
              }}
            />
          )}
          <View>
            <Text style={styles.bannerName}>{business.name}</Text>
            <Text style={styles.bannerType}>{category || 'Uncategorized'}</Text>
          </View>
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
      {renderEditModal()}
      {renderDeleteConfirm()}
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

// ============================================================
// 6. STYLES
// ============================================================

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
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
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
  formSection: {
    paddingTop: 12,
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
  formHelperText: {
    color: '#8A8AAE',
    fontSize: 11,
    marginBottom: 6,
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
  imageUploadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  imageAddBtn: {
    width: 70,
    height: 70,
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
  imageHelperText: {
    color: '#8A8AAE',
    fontSize: 11,
    marginTop: 4,
  },
  previewSection: {
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  previewLabel: {
    color: '#1F2F5F',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
  },
  previewPrice: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: '600',
  },
  previewCategory: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6FA',
    marginBottom: 8,
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
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
  },
  deleteIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(231,76,60,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2F5F',
    marginBottom: 8,
  },
  deleteDescription: {
    fontSize: 14,
    color: '#8A8AAE',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteCancelButton: {
    backgroundColor: '#F5F7FA',
  },
  deleteCancelText: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteConfirmButton: {
    backgroundColor: '#E74C3C',
  },
  deleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  previewUrlText: {
    fontSize: 10,
    color: '#8A8AAE',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: '100%',
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
    marginBottom: 16,
  },
  settingsLabel: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  logoTouchable: {
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
    borderWidth: 1,
    borderColor: '#E8ECF4',
    borderStyle: 'dashed',
  },
  settingsImagePlaceholderText: {
    color: '#8A8AAE',
    fontSize: 10,
    marginTop: 4,
  },
  settingsBannerPicker: {
    marginBottom: 8,
  },
  bannerTouchable: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
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
    borderWidth: 1,
    borderColor: '#E8ECF4',
    borderStyle: 'dashed',
  },
  settingsBannerPlaceholderText: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 4,
  },
  settingsField: {
    marginBottom: 12,
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
});