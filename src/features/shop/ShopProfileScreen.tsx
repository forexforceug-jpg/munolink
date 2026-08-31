// src/features/shop/ShopProfileScreen.tsx

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
import { ReviewsBottomSheet } from '../feed/components/ReviewsBottomSheet';
import { AIBottomSheet } from '../feed/components/AIBottomSheet';
import { Opportunity } from '../../services/feed.service';
import { DirectionsBottomSheet } from '../feed/components/DirectionsBottomSheet';

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
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string | null;
  category: string | null;
}

export const ShopProfileScreen: React.FC<ShopProfileScreenProps> = ({ route, navigation }) => {
  const { shopId, shopName: routeShopName } = route.params || {};
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('products');
  const [showReviews, setShowReviews] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shop, setShop] = useState<ShopData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<string>('');

  // Refs for bottom sheets
  const reviewsSheetRef = useRef<any>(null);
  const aiSheetRef = useRef<any>(null);

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

      if (shopError) throw shopError;
      setShop(shopData);

      // 2. Fetch products - FIXED: simpler query without complex joins
      const { data: productsData, error: productsError } = await supabase
        .from('shop_products')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Products error:', productsError);
      } else if (productsData) {
        // Get catalog details for each product
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
          };
        });
        setProducts(formattedProducts);
      }

      // 3. Fetch services (if any) - FIXED: simpler query
      if (shopData?.owner_id) {
        const { data: servicesData, error: servicesError } = await supabase
          .from('provider_services')
          .select('*')
          .eq('user_id', shopData.owner_id)
          .order('created_at', { ascending: false });

        if (servicesError) {
          console.error('Services error:', servicesError);
        } else if (servicesData) {
          // Get service catalog details
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
      Alert.alert('Error', 'Failed to load shop profile');
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

  const handleDirectionsPress = () => {
    setShowDirections(true);
  };

  const handleChatPress = () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to chat with this seller.');
      return;
    }
    Alert.alert('Chat', 'Chat feature coming soon!');
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

  // --- Render Products Tab ---
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
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.productCard}>
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
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.productsGrid}
        />
      )}
    </View>
  );

  // --- Render Services Tab ---
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
          <View key={index} style={styles.serviceCard}>
            <View style={styles.serviceIcon}>
              <Text style={styles.serviceIconText}>🔧</Text>
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>UGX {service.price.toLocaleString()}</Text>
              {service.duration && (
                <Text style={styles.serviceDuration}>⏱ {service.duration}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.serviceBookButton}>
              <Text style={styles.serviceBookText}>Book</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  // --- Render Tab Content ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return renderProducts();
      case 'services':
        return renderServices();
      case 'reviews':
        return (
          <TouchableOpacity style={styles.reviewsButton} onPress={() => setShowReviews(true)}>
            <View style={styles.reviewsSummary}>
              <Text style={styles.reviewsAvg}>{shop?.rating?.toFixed(1) || 'N/A'}</Text>
              <Text style={styles.reviewsStars}>{renderStars(shop?.rating || 0)}</Text>
              <Text style={styles.reviewsCount}>{shop?.review_count || 0} reviews</Text>
              <Ionicons name="chevron-forward" size={20} color="#4A7DFF" />
            </View>
          </TouchableOpacity>
        );
      default:
        return renderProducts();
    }
  };

  // Determine which tabs to show based on business type
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

  // Create opportunity object for AI
  const getOpportunityForAI = (): Opportunity | null => {
    if (!shop) return null;
    return {
      id: shop.id,
      title: shop.name || 'Shop',
      shopName: shop.name || 'Shop',
      shopId: shop.id,
      price: 0,
      currency: 'UGX',
      imageUrl: shop.logo_url || '',
      catalogImages: [],
      description: shop.description || '',
      specifications: {},
      rating: shop.rating,
      reviewCount: shop.review_count,
      area: shop.area,
      inStock: true,
      category: shop.category,
      type: 'product',
    };
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

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
            colors={['rgba(31, 47, 95, 0)', 'rgba(31, 47, 95, 0.7)']}
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

      {/* Reviews Bottom Sheet */}
      <ReviewsBottomSheet
        visible={showReviews}
        productId={shop.id}
        productTitle={shop.name}
        onClose={() => setShowReviews(false)}
      />

      {/* AI Bottom Sheet */}
      {getOpportunityForAI() && (
        <AIBottomSheet
          bottomSheetRef={aiSheetRef}
          opportunity={getOpportunityForAI()!}
          onClose={() => setShowAI(false)}
        />
      )}

      {/* Directions Bottom Sheet - Mobile */}
      <DirectionsBottomSheet
        visible={showDirections}
        opportunity={getOpportunityForAI()}
        onClose={() => setShowDirections(false)}
        isDesktopView={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2F5F',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  followButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(74, 125, 255, 0.2)',
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
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverImagePlaceholder: {
    backgroundColor: '#1A2A4F',
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
    height: '50%',
  },
  profileHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
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
    borderColor: '#1F2F5F',
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
  },
  productImagePlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  bottomSpacer: {
    height: 20,
  },
});