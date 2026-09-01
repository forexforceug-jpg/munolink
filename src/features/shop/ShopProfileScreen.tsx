// src/features/shop/ShopProfileScreen.tsx
import * as Haptics from 'expo-haptics';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { ReviewsBottomSheet } from '../feed/components/ReviewsBottomSheet';
import { AIBottomSheet } from '../feed/components/AIBottomSheet';
import { Opportunity } from '../../services/feed.service';
import { DirectionsBottomSheet } from '../feed/components/DirectionsBottomSheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SceneEngine, OpportunityFormatter, SceneRenderer } from '../opportunity';
import { FloatingActionRail } from '../feed/components/FloatingActionRail';
import { SimpleDetailsModal } from '../feed/components/SimpleDetailsModal';

const { width, height } = Dimensions.get('window');

interface ShopProfileScreenProps {
  route: any;
  navigation: any;
}

interface ShopData {
  id: string;
  name: string;
  category: string | null;
  rating: number | null;
  review_count: number | null;
  area: string | null;
  is_verified: boolean | null;
  is_open: boolean | null;
  logo_url: string | null;
  banner_url: string | null;
  cover_image?: string;
  description: string | null;
  created_at: string | null;
  phone: string | null;
  address: string | null;
  business_type: string | null;
  owner_id: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string | null;
  rating: number | null;
  catalog_id: string;
  in_stock: boolean | null;
  category: string | null;
  type: 'product';
  shopName?: string;
  shopId?: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string | null;
  category: string | null;
  type: 'service';
  shopName?: string;
  shopId?: string;
}

// ============================================================
// PRODUCT CARD COMPONENT
// ============================================================
const ProductCard = ({ item, onPress }: any) => (
  <TouchableOpacity style={styles.productCard} onPress={() => onPress(item)} activeOpacity={0.8}>
    {item.image ? (
      <Image source={{ uri: item.image }} style={styles.productImage} />
    ) : (
      <View style={[styles.productImage, styles.productImagePlaceholder]}>
        <Text style={styles.productImagePlaceholderText}>📦</Text>
      </View>
    )}
    <View style={styles.productInfo}>
      <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.productPrice}>UGX {item.price.toLocaleString()}</Text>
      {item.in_stock !== null && (
        <Text style={[styles.productStock, { color: item.in_stock ? '#2ECC71' : '#E74C3C' }]}>
          {item.in_stock ? 'In Stock' : 'Out of Stock'}
        </Text>
      )}
    </View>
  </TouchableOpacity>
);

// ============================================================
// SERVICE CARD COMPONENT
// ============================================================
const ServiceCard = ({ item, onPress }: any) => (
  <TouchableOpacity style={styles.serviceCard} onPress={() => onPress(item)} activeOpacity={0.8}>
    <View style={styles.serviceIcon}>
      <Text style={styles.serviceIconText}>🔧</Text>
    </View>
    <View style={styles.serviceInfo}>
      <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.servicePrice}>UGX {item.price.toLocaleString()}</Text>
      {item.duration && (
        <Text style={styles.serviceDuration}>⏱ {item.duration}</Text>
      )}
    </View>
    <TouchableOpacity style={styles.serviceBookButton}>
      <Text style={styles.serviceBookText}>Book</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

// ============================================================
// MAIN SHOP PROFILE CONTENT
// ============================================================
const ShopProfileContent = ({ route, navigation }: ShopProfileScreenProps) => {
  const { shopId, shopName: routeShopName } = route.params || {};
  const { user } = useAuth();
  const { isDesktop } = useBreakpoint();
  
  const [activeTab, setActiveTab] = useState('products');
  const [showReviews, setShowReviews] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shop, setShop] = useState<ShopData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');
  const [savedItemsMap, setSavedItemsMap] = useState<Record<string, boolean>>({});

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<string>('');

  // Fetch shop data
  const fetchShopData = useCallback(async () => {
    if (!shopId) return;

    setLoading(true);
    try {
      // 1. Fetch shop details
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (shopError) {
        console.error('Shop error:', shopError);
        // Try to find shop by owner_id if the shop doesn't exist
        if (shopError.code === 'PGRST116') {
          // Shop not found, try to get from provider_services
          const { data: serviceData, error: serviceError } = await supabase
            .from('provider_services')
            .select('user_id, service_id, price')
            .eq('id', shopId)
            .single();
          
          if (!serviceError && serviceData) {
            // Get service catalog
            const { data: catalogData } = await supabase
              .from('service_catalog')
              .select('*')
              .eq('id', serviceData.service_id)
              .single();
            
            if (catalogData) {
              setShop({
                id: shopId,
                name: catalogData.name || 'Service',
                category: catalogData.category || 'Service',
                rating: null,
                review_count: null,
                area: null,
                is_verified: false,
                is_open: true,
                logo_url: null,
                banner_url: null,
                description: catalogData.description || null,
                created_at: catalogData.created_at || null,
                phone: null,
                address: null,
                business_type: 'service',
                owner_id: serviceData.user_id,
              });
              // Don't return, continue to load services
            }
          }
        }
        throw shopError;
      }
      
      setShop(shopData);

      // 2. Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('shop_products')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Products error:', productsError);
      } else if (productsData) {
        const catalogIds = productsData.map(p => p.catalog_id).filter(Boolean);
        let catalogMap: Record<string, any> = {};
        
        if (catalogIds.length > 0) {
          const { data: catalogData, error: catalogError } = await supabase
            .from('catalog')
            .select('id, name, images, specifications, category')
            .in('id', catalogIds);
          
          if (!catalogError && catalogData) {
            catalogMap = catalogData.reduce((acc: any, item: any) => {
              acc[item.id] = item;
              return acc;
            }, {});
          }
        }

        const formattedProducts = productsData.map((item: any) => {
          const catalog = catalogMap[item.catalog_id] || {};
          return {
            id: item.id,
            name: catalog.name || 'Product',
            price: item.regular_price || 0,
            image: catalog.images?.[0] || null,
            rating: null,
            catalog_id: item.catalog_id,
            in_stock: item.in_stock,
            category: catalog.category || null,
            type: 'product' as const,
            shopName: shopData?.name || 'Shop',
            shopId: shopId,
          };
        });
        setProducts(formattedProducts);
      }

      // 3. Fetch services
      const ownerId = shopData?.owner_id;
      if (ownerId) {
        const { data: servicesData, error: servicesError } = await supabase
          .from('provider_services')
          .select('*')
          .eq('user_id', ownerId)
          .order('created_at', { ascending: false });

        if (servicesError) {
          console.error('Services error:', servicesError);
        } else if (servicesData) {
          const serviceIds = servicesData.map(s => s.service_id).filter(Boolean);
          let serviceCatalogMap: Record<string, any> = {};
          
          if (serviceIds.length > 0) {
            const { data: serviceCatalogData, error: serviceCatalogError } = await supabase
              .from('service_catalog')
              .select('id, name, duration, category, images')
              .in('id', serviceIds);
            
            if (!serviceCatalogError && serviceCatalogData) {
              serviceCatalogMap = serviceCatalogData.reduce((acc: any, item: any) => {
                acc[item.id] = item;
                return acc;
              }, {});
            }
          }

          const formattedServices = servicesData.map((item: any) => {
            const catalog = serviceCatalogMap[item.service_id] || {};
            return {
              id: item.id,
              name: catalog.name || 'Service',
              price: item.price || 0,
              duration: catalog.duration || null,
              category: catalog.category || null,
              type: 'service' as const,
              shopName: shopData?.name || 'Service Provider',
              shopId: shopId,
            };
          });
          setServices(formattedServices);
        }
      }

      // 4. Generate AI summary
      const summary = generateAISummary(shopData);
      setAiSummary(summary);

    } catch (error) {
      console.error('Error fetching shop data:', error);
      // Don't show alert for 406 errors (no rows found)
      if (error instanceof Error && !error.message?.includes('406')) {
        Alert.alert('Error', 'Failed to load shop profile');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchShopData();
  };

  const generateAISummary = (shopData: ShopData): string => {
    const name = shopData?.name || 'This shop';
    const category = shopData?.category || 'business';
    const rating = shopData?.rating || 0;
    const reviewCount = shopData?.review_count || 0;
    const description = shopData?.description || '';
    const since = shopData?.created_at ? new Date(shopData.created_at).getFullYear() : 'recently';

    if (rating > 4.0) {
      return `${name} is a highly-rated ${category} with a ${rating.toFixed(1)}★ rating from ${reviewCount} reviews. ${description || `Customers consistently praise their quality service and products.`} They've been serving customers since ${since}.`;
    } else if (rating > 3.0) {
      return `${name} is a ${category} with a ${rating.toFixed(1)}★ rating from ${reviewCount} reviews. ${description || `They offer quality products and services to the community.`} They've been in business since ${since}.`;
    } else {
      return `${name} is a ${category} serving the community since ${since}. ${description || `They offer a variety of products and services.`} ${reviewCount > 0 ? `Currently rated ${rating.toFixed(1)}★ by ${reviewCount} customers.` : 'Be the first to leave a review!'}`;
    }
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(Math.round(rating));
  };

  // ============================================================
  // TIKTOK-STYLE FULLSCREEN VIEW HANDLERS
  // ============================================================

  const handleItemPress = useCallback((item: any) => {
    // Convert product/service to Opportunity format
    const opportunity: Opportunity = {
      id: item.id,
      title: item.name,
      shopName: item.shopName || shop?.name || 'Shop',
      shopId: item.shopId || shopId || '',
      price: item.price || 0,
      currency: 'UGX',
      imageUrl: item.image || '',
      catalogImages: item.image ? [item.image] : [],
      description: item.description || '',
      specifications: {},
      rating: item.rating || shop?.rating || null,
      reviewCount: item.reviewCount || shop?.review_count || 0,
      area: shop?.area || null,
      inStock: item.in_stock !== undefined ? item.in_stock : true,
      category: item.category || shop?.category || null,
      type: item.type || 'product',
      shopLogo: shop?.logo_url || null,
    };

    setSelectedOpportunity(opportunity);
    setViewMode('fullscreen');
  }, [shop, shopId]);

  const handleBackToGrid = useCallback(() => {
    setViewMode('grid');
    setSelectedOpportunity(null);
  }, []);

  // ============================================================
  // FULLSCREEN RENDER ITEM
  // ============================================================

  const renderFullScreenItem = useCallback(() => {
    if (!selectedOpportunity) return null;

    const isSaved = savedItemsMap[selectedOpportunity.id] || false;

    const normalizedOpportunity = OpportunityFormatter.format(selectedOpportunity);
    const engine = new SceneEngine(normalizedOpportunity);
    const scenes = engine.compose();

    const cardWidth = isDesktop ? 420 : width;
    const cardHeight = isDesktop ? height : height;

    return (
      <View
        style={{
          height: cardHeight,
          width: cardWidth,
          paddingVertical: 0,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <SceneRenderer
          key={selectedOpportunity.id}
          scenes={scenes}
          title={selectedOpportunity.title || 'Product'}
          price={selectedOpportunity.price || 0}
          shopName={selectedOpportunity.shopName || 'Shop'}
          rating={selectedOpportunity.rating ?? undefined}
          area={selectedOpportunity.area ?? undefined}
          inStock={selectedOpportunity.inStock}
          currency={selectedOpportunity.currency || 'UGX'}
          isDesktop={isDesktop}
          onPrimaryAction={() => {
            navigation.navigate('ShopProfile', {
              shopId: selectedOpportunity.shopId,
              shopName: selectedOpportunity.shopName,
            });
          }}
          onShare={() => {
            Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
          }}
          onSave={() => {
            if (!user?.id) return;
            Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
            const currentSaved = savedItemsMap[selectedOpportunity.id] || false;
            const newSaved = !currentSaved;
            setSavedItemsMap(prev => ({ ...prev, [selectedOpportunity.id]: newSaved }));
          }}
          onShowMore={() => {
            Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
            setShowDetailsModal(true);
          }}
          onSceneChange={(index) => {
            if (__DEV__) {
              console.log('Scene changed to:', index);
            }
          }}
          width={cardWidth}
          height={cardHeight}
          autoPlay={false}
          autoPlayInterval={9000}
          resetKey={selectedOpportunity.id}
        />

        <View style={styles.actionRailWrapper}>
          <FloatingActionRail
            key={`rail-${selectedOpportunity.id}`}
            opportunity={selectedOpportunity}
            onShopPress={(shopId) => {
              navigation.navigate('ShopProfile', {
                shopId,
                shopName: selectedOpportunity.shopName,
              });
            }}
            onReviewsPress={(productId) => {
              Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
              setShowReviews(true);
            }}
            onDirectionsPress={() => {
              Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
              setShowDirections(true);
            }}
            onSharePress={() => {
              Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
            }}
            onAIPress={() => {
              Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Heavy);
              setShowAI(true);
            }}
            onSavePress={() => {
              if (!user?.id) return;
              Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
              const currentSaved = savedItemsMap[selectedOpportunity.id] || false;
              const newSaved = !currentSaved;
              setSavedItemsMap(prev => ({ ...prev, [selectedOpportunity.id]: newSaved }));
            }}
            isSaved={isSaved}
            savedCount={selectedOpportunity.savedCount || 0}
            shareCount={selectedOpportunity.shareCount || 0}
            reviewCount={selectedOpportunity.reviewCount || 0}
            distance={selectedOpportunity.distance || 0}
            shopLogo={shop?.logo_url || null}
          />
        </View>
      </View>
    );
  }, [selectedOpportunity, isDesktop, width, height, navigation, user?.id, savedItemsMap, shop]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleDirectionsPress = () => {
    setShowDirections(true);
  };

// In ShopProfileScreen.tsx, update the handleChatPress function:

const handleChatPress = () => {
  if (!user) {
    Alert.alert('Sign in required', 'Please sign in to chat with this seller.');
    return;
  }
  
  if (!shop?.owner_id) {
    Alert.alert('Error', 'This shop does not have a contact available.');
    return;
  }
  // If the shop owner is the current user, show a message
  if (shop.owner_id === user.id) {
    Alert.alert('Info', 'You cannot chat with yourself.');
    return;
  }
  // Navigate to Inbox with the shop owner's ID
  navigation.navigate('Inbox', {
    userId: shop.owner_id,
    userName: shop.name || 'Shop Owner',
    shopId: shop.id,
  });
};
  const handleCallPress = () => {
    if (shop?.phone) {
      Linking.openURL(`tel:${shop.phone}`);
    } else {
      Alert.alert('No phone number', 'This business has not provided a phone number.');
    }
  };

  const handleFollowPress = () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to follow this shop.');
      return;
    }
    setIsFollowing(!isFollowing);
    Alert.alert(isFollowing ? 'Unfollowed' : 'Following', isFollowing ? 'You unfollowed this shop.' : 'You are now following this shop.');
  };

  // ============================================================
  // RENDER TABS
  // ============================================================

  const renderProducts = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabSubtitle}>Products</Text>
        <Text style={styles.tabCount}>{products.length}</Text>
      </View>
      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No products available</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => <ProductCard item={item} onPress={handleItemPress} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.productsGrid}
        />
      )}
    </View>
  );

  const renderServices = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabSubtitle}>Services</Text>
        <Text style={styles.tabCount}>{services.length}</Text>
      </View>
      {services.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No services available</Text>
        </View>
      ) : (
        services.map((service, index) => (
          <ServiceCard key={index} item={service} onPress={handleItemPress} />
        ))
      )}
    </View>
  );

  const renderReviews = () => (
    <TouchableOpacity style={styles.reviewsButton} onPress={() => setShowReviews(true)}>
      <View style={styles.reviewsSummary}>
        <Text style={styles.reviewsAvg}>{shop?.rating?.toFixed(1) || 'N/A'}</Text>
        <Text style={styles.reviewsStars}>{renderStars(shop?.rating || 0)}</Text>
        <Text style={styles.reviewsCount}>{shop?.review_count || 0} reviews</Text>
        <Ionicons name="chevron-forward" size={20} color="#4A7DFF" />
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return renderProducts();
      case 'services':
        return renderServices();
      case 'reviews':
        return renderReviews();
      default:
        return renderProducts();
    }
  };

  const getTabs = () => {
    if (!shop) return ['products', 'reviews'];
    const isShop = shop.business_type === 'shop';
    const isService = shop.business_type === 'service' || shop.business_type === 'institution';
    
    if (isShop) return ['products', 'reviews'];
    if (isService) return ['services', 'reviews'];
    return ['products', 'services', 'reviews'];
  };

  const tabs = getTabs();
  const tabLabels: Record<string, string> = {
    products: 'Products',
    services: 'Services',
    reviews: 'Reviews',
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Shop not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const trustItems = [
    { icon: '✅', label: shop.is_verified ? 'Verified Business' : 'Unverified' },
    { icon: '📅', label: shop.created_at ? `Since ${new Date(shop.created_at).getFullYear()}` : 'New' },
    { icon: '📦', label: `${products.length + services.length} Offerings` },
    { icon: '⭐', label: shop.rating ? `${shop.rating.toFixed(1)} Rating` : 'No Rating' },
    { icon: '🔄', label: shop.is_open ? '🟢 Open Now' : '🔴 Closed' },
  ];

// ============================================================
// FULLSCREEN VIEW
// ============================================================

if (viewMode === 'fullscreen' && selectedOpportunity) {
  // Get all items for the fullscreen view (products + services)
  const allItems = [...products, ...services];
  const currentIndex = allItems.findIndex(item => item.id === selectedOpportunity.id);
  const initialIndex = currentIndex !== -1 ? currentIndex : 0;

  // Type guard function
  const isProductItem = (item: Product | Service): item is Product => {
    return item.type === 'product';
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheetModalProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

          <TouchableOpacity style={styles.backButton} onPress={handleBackToGrid}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Back to shop</Text>
          </TouchableOpacity>

          <FlatList
            data={allItems}
            renderItem={({ item }) => {
              // Convert product/service to Opportunity using type guard
              const opportunity: Opportunity = {
                id: item.id,
                title: item.name,
                shopName: item.shopName || shop?.name || 'Shop',
                shopId: item.shopId || shopId || '',
                price: item.price || 0,
                currency: 'UGX',
                imageUrl: isProductItem(item) ? (item.image || '') : '',
                catalogImages: isProductItem(item) ? (item.image ? [item.image] : []) : [],
                description: (item as any).description || '',
                specifications: {},
                rating: isProductItem(item) ? (item.rating || shop?.rating || null) : (shop?.rating || null),
                reviewCount: (item as any).reviewCount || shop?.review_count || 0,
                area: shop?.area || null,
inStock: isProductItem(item) ? (item.in_stock !== null ? item.in_stock : true) : true,                category: item.category || shop?.category || null,
                type: item.type || 'product',
                shopLogo: shop?.logo_url || null,
              };

              const isSaved = savedItemsMap[opportunity.id] || false;

              const normalizedOpportunity = OpportunityFormatter.format(opportunity);
              const engine = new SceneEngine(normalizedOpportunity);
              const scenes = engine.compose();

              const cardWidth = isDesktop ? 420 : width;
              const cardHeight = isDesktop ? height : height;

              return (
                <View
                  style={{
                    height: cardHeight,
                    width: cardWidth,
                    paddingVertical: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <SceneRenderer
                    key={opportunity.id}
                    scenes={scenes}
                    title={opportunity.title || 'Product'}
                    price={opportunity.price || 0}
                    shopName={opportunity.shopName || 'Shop'}
                    rating={opportunity.rating ?? undefined}
                    area={opportunity.area ?? undefined}
                    inStock={opportunity.inStock}
                    currency={opportunity.currency || 'UGX'}
                    isDesktop={isDesktop}
                    onPrimaryAction={() => {
                      navigation.navigate('ShopProfile', {
                        shopId: opportunity.shopId,
                        shopName: opportunity.shopName,
                      });
                    }}
                    onShare={() => {
                      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    onSave={() => {
                      if (!user?.id) return;
                      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
                      const currentSaved = savedItemsMap[opportunity.id] || false;
                      const newSaved = !currentSaved;
                      setSavedItemsMap(prev => ({ ...prev, [opportunity.id]: newSaved }));
                    }}
                    onShowMore={() => {
                      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedOpportunity(opportunity);
                      setShowDetailsModal(true);
                    }}
                    onSceneChange={(index) => {
                      if (__DEV__) {
                        console.log('Scene changed to:', index);
                      }
                    }}
                    width={cardWidth}
                    height={cardHeight}
                    autoPlay={false}
                    autoPlayInterval={9000}
                    resetKey={opportunity.id}
                  />

                  <View style={styles.actionRailWrapper}>
                    <FloatingActionRail
                      key={`rail-${opportunity.id}`}
                      opportunity={opportunity}
                      onShopPress={(shopId) => {
                        navigation.navigate('ShopProfile', {
                          shopId,
                          shopName: opportunity.shopName,
                        });
                      }}
                      onReviewsPress={(productId) => {
                        Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
                        setShowReviews(true);
                      }}
                      onDirectionsPress={() => {
                        Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
                        setShowDirections(true);
                      }}
                      onSharePress={() => {
                        Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      onAIPress={() => {
                        Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Heavy);
                        setSelectedOpportunity(opportunity);
                        setShowAI(true);
                      }}
                      onSavePress={() => {
                        if (!user?.id) return;
                        Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
                        const currentSaved = savedItemsMap[opportunity.id] || false;
                        const newSaved = !currentSaved;
                        setSavedItemsMap(prev => ({ ...prev, [opportunity.id]: newSaved }));
                      }}
                      isSaved={isSaved}
                      savedCount={opportunity.savedCount || 0}
                      shareCount={opportunity.shareCount || 0}
                      reviewCount={opportunity.reviewCount || 0}
                      distance={opportunity.distance || 0}
                      shopLogo={shop?.logo_url || null}
                    />
                  </View>
                </View>
              );
            }}
            keyExtractor={(item) => item.id}
            pagingEnabled={!isDesktop}
            showsVerticalScrollIndicator={false}
            snapToInterval={isDesktop ? undefined : height}
            snapToAlignment="start"
            decelerationRate="fast"
            initialScrollIndex={initialIndex}
            getItemLayout={(data, index) => ({
              length: isDesktop ? height : height,
              offset: (isDesktop ? height : height) * index,
              index,
            })}
            removeClippedSubviews={true}
            maxToRenderPerBatch={isDesktop ? 3 : 1}
            windowSize={isDesktop ? 5 : 2}
            scrollEventThrottle={32}
            style={styles.fullscreenList}
          />

          <SimpleDetailsModal
            visible={showDetailsModal}
            opportunity={selectedOpportunity}
            onClose={() => setShowDetailsModal(false)}
          />

          <ReviewsBottomSheet
            visible={showReviews}
            productId={selectedOpportunity?.id || ''}
            productTitle={selectedOpportunity?.title || ''}
            onClose={() => setShowReviews(false)}
          />

          <AIBottomSheet
            visible={showAI}
            opportunity={selectedOpportunity}
            contextHint={`About ${selectedOpportunity?.shopName || shop?.name}`}
            onClose={() => setShowAI(false)}
            isDesktopView={isDesktop}
          />

          <DirectionsBottomSheet
            visible={showDirections}
            opportunity={selectedOpportunity}
            onClose={() => setShowDirections(false)}
            isDesktopView={isDesktop}
          />
        </SafeAreaView>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

  // ============================================================
  // GRID VIEW
  // ============================================================

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheetModalProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Follow Button */}
          <TouchableOpacity 
            style={[styles.followButton, isFollowing && styles.followingButton]} 
            onPress={handleFollowPress}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>

          {/* Main Scroll View */}
          <ScrollView
            style={styles.mainScroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A7DFF" />
            }
            contentContainerStyle={styles.scrollContent}
          >
            {/* Cover Image */}
            <View style={styles.coverContainer}>
              {shop.banner_url ? (
                <Image source={{ uri: shop.banner_url }} style={styles.coverImage} />
              ) : (
                <View style={[styles.coverImage, styles.coverImagePlaceholder]}>
                  <Text style={styles.coverImagePlaceholderText}>🏪</Text>
                </View>
              )}
              <LinearGradient
                colors={['rgba(13, 13, 26, 0)', 'rgba(13, 13, 26, 0.8)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 0, y: 1 }}
                style={styles.coverGradient}
              />
            </View>

            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.profileImageContainer}>
                {shop.logo_url ? (
                  <Image source={{ uri: shop.logo_url }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                    <Text style={styles.profileImagePlaceholderText}>
                      {shop.name?.charAt(0)?.toUpperCase() || 'B'}
                    </Text>
                  </View>
                )}
                {shop.is_verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>✓</Text>
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.profileNameRow}>
                  <Text style={styles.profileName}>{shop.name}</Text>
                  {shop.is_verified && (
                    <Ionicons name="checkmark-circle" size={18} color="#4A7DFF" />
                  )}
                </View>
                <Text style={styles.profileCategory}>{shop.category || 'Business'}</Text>
                <View style={styles.profileStats}>
                  {shop.rating && (
                    <>
                      <Text style={styles.profileRating}>⭐ {shop.rating.toFixed(1)}</Text>
                      <Text style={styles.profileDivider}>•</Text>
                    </>
                  )}
                  <Text style={styles.profileReviews}>{shop.review_count || 0} Reviews</Text>
                  {shop.area && (
                    <>
                      <Text style={styles.profileDivider}>•</Text>
                      <Text style={styles.profileDistance}>{shop.area}</Text>
                    </>
                  )}
                </View>
                <View style={styles.profileStatus}>
                  <View style={[styles.statusDot, { backgroundColor: shop.is_open ? '#2ECC71' : '#E74C3C' }]} />
                  <Text style={[styles.statusText, { color: shop.is_open ? '#2ECC71' : '#E74C3C' }]}>
                    {shop.is_open ? 'Open Now' : 'Closed'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleChatPress}>
                <Ionicons name="chatbubble-outline" size={22} color="#4A7DFF" />
                <Text style={styles.actionButtonText}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleCallPress}>
                <Ionicons name="call-outline" size={22} color="#4A7DFF" />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleDirectionsPress}>
                <Ionicons name="location-outline" size={22} color="#4A7DFF" />
                <Text style={styles.actionButtonText}>Directions</Text>
              </TouchableOpacity>
            </View>

            {/* AI Summary */}
            <TouchableOpacity style={styles.aiSummaryCard} onPress={() => setShowAI(true)}>
              <View style={styles.aiSummaryHeader}>
                <Ionicons name="sparkles" size={18} color="#4A7DFF" />
                <Text style={styles.aiSummaryTitle}>AI Summary</Text>
              </View>
              <Text style={styles.aiSummaryText} numberOfLines={3}>{aiSummary}</Text>
              <Text style={styles.aiSummaryTap}>Tap to ask AI about this shop ›</Text>
            </TouchableOpacity>

            {/* Trust Cards */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.trustContainer}
              contentContainerStyle={styles.trustContent}
            >
              {trustItems.map((item, i) => (
                <View key={i} style={styles.trustCard}>
                  <Text style={styles.trustIcon}>{item.icon}</Text>
                  <Text style={styles.trustLabel}>{item.label}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={styles.tab}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                    {tabLabels[tab] || tab}
                  </Text>
                  {activeTab === tab && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Content */}
            {renderTabContent()}

            {/* Bottom spacer */}
            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Modals */}
          <SimpleDetailsModal
            visible={showDetailsModal}
            opportunity={selectedOpportunity}
            onClose={() => setShowDetailsModal(false)}
          />

          <ReviewsBottomSheet
            visible={showReviews}
            productId={shop.id}
            productTitle={shop.name}
            onClose={() => setShowReviews(false)}
          />

          <AIBottomSheet
            visible={showAI}
            opportunity={null}
            contextHint={`About ${shop.name}`}
            onClose={() => setShowAI(false)}
            isDesktopView={isDesktop}
          />

          <DirectionsBottomSheet
            visible={showDirections}
            opportunity={null}
            onClose={() => setShowDirections(false)}
            isDesktopView={isDesktop}
          />
        </SafeAreaView>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export const ShopProfileScreen = ({ route, navigation }: ShopProfileScreenProps) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout 
      currentRoute="ShopProfile" 
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      <ShopProfileContent route={route} navigation={navigation} />
    </ResponsiveLayout>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D1A',
  },
  loadingText: {
    color: '#8A8AAE',
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 18,
    fontWeight: 'bold',
  },
  goBackText: {
    color: '#4A7DFF',
    fontSize: 16,
    marginTop: 12,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  followButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4A7DFF',
  },
  followingButton: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderColor: '#2ECC71',
  },
  followButtonText: {
    color: '#4A7DFF',
    fontSize: 13,
    fontWeight: '500',
  },
  followingButtonText: {
    color: '#2ECC71',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  coverContainer: {
    height: height * 0.2,
    position: 'relative',
    backgroundColor: '#1A1A2E',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverImagePlaceholder: {
    backgroundColor: 'rgba(74, 125, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImagePlaceholderText: {
    fontSize: 48,
    opacity: 0.3,
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  profileHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
    marginTop: -20,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 14,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#4A7DFF',
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
  },
  profileImagePlaceholder: {
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    color: '#4A7DFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A7DFF',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 2,
    borderColor: '#0D0D1A',
  },
  verifiedBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileCategory: {
    color: '#8A8AAE',
    fontSize: 13,
    marginTop: 1,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
    flexWrap: 'wrap',
  },
  profileRating: {
    color: '#F1C40F',
    fontSize: 12,
  },
  profileDivider: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  profileReviews: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  profileDistance: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  profileStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  actionButtonText: {
    color: '#4A7DFF',
    fontSize: 12,
    fontWeight: '500',
  },
  aiSummaryCard: {
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: 'rgba(74, 125, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 125, 255, 0.1)',
    marginBottom: 12,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiSummaryTitle: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: '600',
  },
  aiSummaryText: {
    color: '#8A8AAE',
    fontSize: 13,
    lineHeight: 18,
  },
  aiSummaryTap: {
    color: '#4A7DFF',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  trustContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  trustContent: {
    gap: 8,
    paddingRight: 16,
  },
  trustCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  trustIcon: {
    fontSize: 14,
  },
  trustLabel: {
    color: '#8A8AAE',
    fontSize: 10,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'relative',
  },
  tabText: {
    color: '#8A8AAE',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: '#4A7DFF',
    borderRadius: 1,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tabSubtitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  tabCount: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#8A8AAE',
    fontSize: 14,
  },
  productsGrid: {
    gap: 8,
  },
  productCard: {
    flex: 1,
    margin: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 6,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImagePlaceholderText: {
    fontSize: 30,
    opacity: 0.3,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  productPrice: {
    color: '#4A7DFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  productStock: {
    fontSize: 10,
    marginTop: 1,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  serviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  serviceIconText: {
    fontSize: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  servicePrice: {
    color: '#4A7DFF',
    fontSize: 12,
  },
  serviceDuration: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  serviceBookButton: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  serviceBookText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  reviewsButton: {
    paddingHorizontal: 16,
  },
  reviewsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  reviewsAvg: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  reviewsStars: {
    fontSize: 18,
  },
  reviewsCount: {
    color: '#8A8AAE',
    fontSize: 13,
    flex: 1,
  },
  actionRailWrapper: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -150 }],
    zIndex: 50,
  },
  bottomSpacer: {
    height: 20,
  },
  fullscreenList: {
  flex: 1,
  backgroundColor: '#0D0D1A',
},
});