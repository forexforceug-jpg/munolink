import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReviewsBottomSheet } from '../feed/components/ReviewsBottomSheet';
import { AIBottomSheet } from '../feed/components/AIBottomSheet';
import { Opportunity } from '../../services/feed.service';

const { width, height } = Dimensions.get('window');

// --- Mock Data ---
const getMockShopData = (shopId: string) => ({
  id: shopId,
  name: 'City Electronics',
  category: 'Electronics Store',
  rating: 4.8,
  reviewCount: 1258,
  distance: '0.6 km',
  location: 'Jinja, Uganda',
  status: 'Open Now',
  isVerified: true,
  coverImage: 'https://via.placeholder.com/400x200/4A7DFF/FFFFFF?text=City+Electronics',
  profileImage: 'https://via.placeholder.com/100/4A7DFF/FFFFFF?text=CE',
  description: 'City Electronics is one of the highest-rated electronics shops in Jinja with a 4.8★ rating from over 1,200 reviews.',
  since: '2017',
  orders: 6200,
  responseTime: '2 mins',
  trustBadges: ['Verified Business', 'Official Warranty', 'Fast Delivery', '6,200 Orders', 'Avg Response 2 mins'],
  products: [
    { id: '1', name: 'Samsung Galaxy S25', price: 2850000, image: 'https://via.placeholder.com/150/4A7DFF/FFFFFF?text=S25', rating: 4.9 },
    { id: '2', name: 'iPhone 16 Pro Max', price: 3200000, image: 'https://via.placeholder.com/150/6B94FF/FFFFFF?text=iPhone', rating: 4.8 },
    { id: '3', name: 'MacBook Air M3', price: 4500000, image: 'https://via.placeholder.com/150/4A7DFF/FFFFFF?text=MacBook', rating: 4.7 },
    { id: '4', name: 'Samsung 65" TV', price: 5200000, image: 'https://via.placeholder.com/150/6B94FF/FFFFFF?text=TV', rating: 4.6 },
    { id: '5', name: 'iPad Pro M4', price: 3800000, image: 'https://via.placeholder.com/150/4A7DFF/FFFFFF?text=iPad', rating: 4.8 },
    { id: '6', name: 'Sony WH-1000XM5', price: 850000, image: 'https://via.placeholder.com/150/6B94FF/FFFFFF?text=Sony', rating: 4.9 },
  ],
  services: [
    { id: '1', name: 'Phone Repair', price: 'UGX 50,000 - 200,000', duration: '1-2 hours', icon: '🔧' },
    { id: '2', name: 'Computer Setup', price: 'UGX 30,000', duration: '30 min', icon: '🖥️' },
    { id: '3', name: 'Data Recovery', price: 'UGX 100,000 - 500,000', duration: '2-4 hours', icon: '💾' },
  ],
  isShop: true,
  contact: {
    phone: '+256 700 000 000',
    email: 'info@cityelectronics.ug',
    website: 'www.cityelectronics.ug',
    address: '123 Main Street, Jinja, Uganda',
  },
  shopPhotos: [
    'https://via.placeholder.com/300/4A7DFF/FFFFFF?text=Shop+1',
    'https://via.placeholder.com/300/6B94FF/FFFFFF?text=Shop+2',
    'https://via.placeholder.com/300/4A7DFF/FFFFFF?text=Shop+3',
  ],
});

interface ShopProfileScreenProps {
  route: any;
  navigation: any;
}

export const ShopProfileScreen: React.FC<ShopProfileScreenProps> = ({ route, navigation }) => {
  const { shopId } = route.params || {};
  const [activeTab, setActiveTab] = useState('products');
  const [showReviews, setShowReviews] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shop, setShop] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const data = getMockShopData(shopId || '1');
        setShop(data);
      } catch (error) {
        console.error('Error fetching shop:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [shopId]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = getMockShopData(shopId || '1');
      setShop(data);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(Math.round(rating));
  };

  // --- AI Summary ---
  const aiSummary = "City Electronics is one of the highest-rated electronics shops in Jinja with a 4.8★ rating from over 1,200 reviews. Customers frequently praise genuine products, fast delivery, and excellent after-sales support. Most buyers recommend them for Samsung phones and laptops.";

  // --- Trust Cards ---
  const trustItems = [
    { icon: '✅', label: 'Verified Business' },
    { icon: '📅', label: `Since ${shop?.since || '2017'}` },
    { icon: '🛡️', label: 'Official Warranty' },
    { icon: '📦', label: `${shop?.orders || 6200} Orders` },
    { icon: '⚡', label: `Avg Response ${shop?.responseTime || '2 mins'}` },
    { icon: '🚚', label: 'Delivery Available' },
  ];

  // --- Render Products Tab ---
  const renderProducts = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabSubtitle}>Products</Text>
        <Text style={styles.tabCount}>{shop.products?.length || 0}</Text>
      </View>
      <FlatList
        data={shop.products}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productCard}>
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.productRating}>⭐ {item.rating}</Text>
              <Text style={styles.productPrice}>UGX {item.price.toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        contentContainerStyle={styles.productsGrid}
      />
    </View>
  );

  // --- Render Services Tab ---
  const renderServices = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabSubtitle}>Services</Text>
        <Text style={styles.tabCount}>{shop.services?.length || 0}</Text>
      </View>
      {shop.services?.map((service: any, index: number) => (
        <View key={index} style={styles.serviceCard}>
          <View style={styles.serviceIcon}>
            <Text style={styles.serviceIconText}>{service.icon || '🔧'}</Text>
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.servicePrice}>{service.price}</Text>
            <Text style={styles.serviceDuration}>⏱ {service.duration}</Text>
          </View>
          <TouchableOpacity style={styles.serviceBookButton}>
            <Text style={styles.serviceBookText}>Book</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  // --- Render Shop Photos ---
  const renderShopPhotos = () => (
    <View style={styles.photosContainer}>
      <TouchableOpacity style={styles.photosHeader} onPress={() => console.log('View all photos')}>
        <Text style={styles.photosTitle}>Shop Photos</Text>
        <View style={styles.photosCount}>
          <Text style={styles.photosCountText}>{shop.shopPhotos?.length || 0}</Text>
          <Ionicons name="chevron-forward" size={16} color="#4A7DFF" />
        </View>
      </TouchableOpacity>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
        {shop.shopPhotos?.map((photo: string, i: number) => (
          <Image key={i} source={{ uri: photo }} style={styles.photoItem} />
        ))}
      </ScrollView>
    </View>
  );

  // --- Render Contact ---
  const renderContact = () => (
    <View style={styles.contactContainer}>
      <TouchableOpacity style={styles.contactItem} onPress={() => console.log('Directions')}>
        <Ionicons name="location-outline" size={20} color="#4A7DFF" />
        <Text style={styles.contactText}>Directions</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.contactItem} onPress={() => console.log('Call')}>
        <Ionicons name="call-outline" size={20} color="#4A7DFF" />
        <Text style={styles.contactText}>Call</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.contactItem} onPress={() => console.log('Chat')}>
        <Ionicons name="chatbubble-outline" size={20} color="#4A7DFF" />
        <Text style={styles.contactText}>Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.contactItem} onPress={() => console.log('Website')}>
        <Ionicons name="globe-outline" size={20} color="#4A7DFF" />
        <Text style={styles.contactText}>Website</Text>
      </TouchableOpacity>
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
              <Text style={styles.reviewsAvg}>{shop.rating.toFixed(1)}</Text>
              <Text style={styles.reviewsStars}>{renderStars(shop.rating)}</Text>
              <Text style={styles.reviewsCount}>{shop.reviewCount} reviews</Text>
              <Ionicons name="chevron-forward" size={20} color="#4A7DFF" />
            </View>
          </TouchableOpacity>
        );
      default:
        return renderProducts();
    }
  };

  const tabs = shop?.isShop 
    ? ['products', 'reviews']
    : ['services', 'reviews'];

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
        onPress={() => setIsFollowing(!isFollowing)}
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
          <Image source={{ uri: shop.coverImage }} style={styles.coverImage} />
          <LinearGradient
            colors={['rgba(31, 47, 95, 0)', 'rgba(31, 47, 95, 0.7)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0, y: 1 }}
            style={styles.coverGradient}
          />
        </View>

        {/* Profile Header - Simple */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image source={{ uri: shop.profileImage }} style={styles.profileImage} />
            {shop.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>✓</Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>{shop.name}</Text>
              {shop.isVerified && (
                <Ionicons name="checkmark-circle" size={18} color="#4A7DFF" />
              )}
            </View>
            <Text style={styles.profileCategory}>{shop.category}</Text>
            <View style={styles.profileStats}>
              <Text style={styles.profileRating}>⭐ {shop.rating.toFixed(1)}</Text>
              <Text style={styles.profileDivider}>•</Text>
              <Text style={styles.profileReviews}>{shop.reviewCount} Reviews</Text>
              <Text style={styles.profileDivider}>•</Text>
              <Text style={styles.profileDistance}>{shop.distance}</Text>
            </View>
            <View style={styles.profileStatus}>
              <View style={[styles.statusDot, { backgroundColor: '#2ECC71' }]} />
              <Text style={styles.statusText}>{shop.status}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons - Simple Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={22} color="#4A7DFF" />
            <Text style={styles.actionButtonText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call-outline" size={22} color="#4A7DFF" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
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

        {/* Shop Photos */}
        {renderShopPhotos()}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tabLabels[tab]}
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Contact - Simple */}
        {renderContact()}

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
      <AIBottomSheet
        bottomSheetRef={null as any}
        opportunity={{
          title: shop.name,
          description: shop.description,
          shopName: shop.name,
          // ... other required fields
        } as Opportunity}
        onClose={() => setShowAI(false)}
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
    color: '#2ECC71',
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
  // AI Summary
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
  // Trust Cards
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
  // Photos
  photosContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  photosTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  photosCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photosCountText: {
    color: '#4A7DFF',
    fontSize: 12,
  },
  photosScroll: {
    flexDirection: 'row',
  },
  photoItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  // Tabs
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
  activeTab: {},
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
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  productRating: {
    color: '#8A8AAE',
    fontSize: 11,
    marginTop: 1,
  },
  productPrice: {
    color: '#4A7DFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  // Services
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
  // Reviews
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
  // Contact
  contactContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 4,
  },
  contactItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  contactText: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  bottomSpacer: {
    height: 20,
  },
});