import React, { useState, useRef } from 'react';
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
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const { width, height } = Dimensions.get('window');

// --- Mock Data ---
const cartItems = [
  {
    id: '1',
    title: 'Samsung Galaxy S25',
    provider: 'TechWorld Kampala',
    price: 2850000,
    quantity: 1,
    image: 'https://via.placeholder.com/80/4A7DFF/FFFFFF?text=S25',
    variation: '128GB • Phantom Black',
    delivery: '2-3 business days',
    providerAvatar: 'TW',
    isVerified: true,
    rating: 4.8,
    distance: '0.8 km',
  },
  {
    id: '2',
    title: 'Phone Repair Service',
    provider: 'QuickFix Mobile',
    price: 75000,
    quantity: 1,
    image: 'https://via.placeholder.com/80/6B94FF/FFFFFF?text=Repair',
    variation: 'Screen Replacement • 1 hour',
    delivery: 'Today, 2:00 PM',
    providerAvatar: 'QF',
    isVerified: true,
    rating: 4.5,
    distance: '1.2 km',
  },
  {
    id: '3',
    title: 'MacBook Air M3',
    provider: 'TechWorld Kampala',
    price: 4500000,
    quantity: 1,
    image: 'https://via.placeholder.com/80/4A7DFF/FFFFFF?text=MacBook',
    variation: '16GB • 512GB',
    delivery: '3-5 business days',
    providerAvatar: 'TW',
    isVerified: true,
    rating: 4.7,
    distance: '0.8 km',
  },
];

const bookings = [
  {
    id: '1',
    service: 'Samsung S25 Screen Repair',
    provider: 'QuickFix Mobile',
    date: '2024-01-20',
    time: '2:00 PM',
    status: 'Confirmed',
    location: 'Jinja, Uganda',
    image: 'https://via.placeholder.com/80/6B94FF/FFFFFF?text=Repair',
    providerAvatar: 'QF',
  },
  {
    id: '2',
    service: 'Hotel Room - Deluxe Suite',
    provider: 'Jinja Heights Hotel',
    date: '2024-01-25',
    time: '3:00 PM Check-in',
    status: 'Pending',
    location: 'Jinja, Uganda',
    image: 'https://via.placeholder.com/80/4A7DFF/FFFFFF?text=Hotel',
    providerAvatar: 'JH',
  },
];

const wishlistItems = [
  {
    id: '1',
    title: 'iPhone 16 Pro Max',
    provider: 'City Electronics',
    price: 3200000,
    image: 'https://via.placeholder.com/150/4A7DFF/FFFFFF?text=iPhone',
    rating: 4.8,
    priceDrop: true,
    stockAlert: false,
  },
  {
    id: '2',
    title: 'Sony WH-1000XM5',
    provider: 'AudioWorld',
    price: 850000,
    image: 'https://via.placeholder.com/150/6B94FF/FFFFFF?text=Sony',
    rating: 4.9,
    priceDrop: false,
    stockAlert: true,
  },
  {
    id: '3',
    title: 'Dell XPS 16',
    provider: 'TechWorld Kampala',
    price: 4800000,
    image: 'https://via.placeholder.com/150/4A7DFF/FFFFFF?text=Dell',
    rating: 4.6,
    priceDrop: false,
    stockAlert: false,
  },
  {
    id: '4',
    title: 'Home Cleaning Service',
    provider: 'CleanHome Ltd',
    price: 120000,
    image: 'https://via.placeholder.com/150/6B94FF/FFFFFF?text=Cleaning',
    rating: 4.3,
    priceDrop: true,
    stockAlert: false,
  },
];

const collections = [
  {
    id: '1',
    name: 'Home Renovation',
    count: 8,
    cover: 'https://via.placeholder.com/150/4A7DFF/FFFFFF?text=Home',
    lastActivity: '2 hours ago',
  },
  {
    id: '2',
    name: 'Wedding Planning',
    count: 12,
    cover: 'https://via.placeholder.com/150/6B94FF/FFFFFF?text=Wedding',
    lastActivity: '1 day ago',
  },
  {
    id: '3',
    name: 'Electronics Wishlist',
    count: 5,
    cover: 'https://via.placeholder.com/150/4A7DFF/FFFFFF?text=Electronics',
    lastActivity: '3 days ago',
  },
  {
    id: '4',
    name: 'Christmas Gifts',
    count: 6,
    cover: 'https://via.placeholder.com/150/6B94FF/FFFFFF?text=Gifts',
    lastActivity: '1 week ago',
  },
];

// --- Sub-components ---

// AI Suggestion Banner
const AISuggestionBanner = () => {
  const suggestions = [
    "🛒 You have three items ready for checkout.",
    "📅 Your hotel booking is tomorrow.",
    "💰 This phone in your wishlist has dropped in price.",
    "📦 Would you like to group these purchases into one payment?",
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <TouchableOpacity style={styles.aiBanner}>
      <View style={styles.aiBannerIcon}>
        <Ionicons name="sparkles" size={20} color="#4A7DFF" />
      </View>
      <Text style={styles.aiBannerText}>{suggestions[currentIndex]}</Text>
      <View style={styles.aiBannerDots}>
        {suggestions.map((_, i) => (
          <View
            key={i}
            style={[
              styles.aiBannerDot,
              i === currentIndex && styles.aiBannerDotActive,
            ]}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
};

// Cart Item Card
const CartItemCard = ({ item, onRemove, onUpdateQuantity }: any) => (
  <View style={styles.cartCard}>
    <Image source={{ uri: item.image }} style={styles.cartImage} />
    <View style={styles.cartContent}>
      <View style={styles.cartHeader}>
        <Text style={styles.cartTitle} numberOfLines={1}>{item.title}</Text>
        <TouchableOpacity onPress={() => onRemove(item.id)}>
          <Ionicons name="close" size={18} color="#8A8AAE" />
        </TouchableOpacity>
      </View>
      <Text style={styles.cartProvider}>{item.provider}</Text>
      <Text style={styles.cartVariation}>{item.variation}</Text>
      <View style={styles.cartFooter}>
        <View style={styles.cartPriceQuantity}>
          <Text style={styles.cartPrice}>UGX {item.price.toLocaleString()}</Text>
          <View style={styles.cartQuantity}>
            <TouchableOpacity
              style={styles.cartQtyButton}
              onPress={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
            >
              <Text style={styles.cartQtyButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.cartQtyText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.cartQtyButton}
              onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
            >
              <Text style={styles.cartQtyButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.cartDelivery}>{item.delivery}</Text>
      </View>
    </View>
  </View>
);

// Booking Card
const BookingCard = ({ item }: any) => {
  const statusColors = {
    Confirmed: '#2ECC71',
    Pending: '#F1C40F',
    Completed: '#4A7DFF',
    Cancelled: '#E74C3C',
  };

  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingProvider}>
          <View style={styles.bookingAvatar}>
            <Text style={styles.bookingAvatarText}>{item.providerAvatar}</Text>
          </View>
          <View>
            <Text style={styles.bookingProviderName}>{item.provider}</Text>
            <Text style={styles.bookingService}>{item.service}</Text>
          </View>
        </View>
        <View style={[styles.bookingStatus, { backgroundColor: statusColors[item.status as keyof typeof statusColors] + '20' }]}>
          <Text style={[styles.bookingStatusText, { color: statusColors[item.status as keyof typeof statusColors] }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.bookingDetails}>
        <View style={styles.bookingDetail}>
          <Ionicons name="calendar-outline" size={14} color="#8A8AAE" />
          <Text style={styles.bookingDetailText}>{item.date}</Text>
        </View>
        <View style={styles.bookingDetail}>
          <Ionicons name="time-outline" size={14} color="#8A8AAE" />
          <Text style={styles.bookingDetailText}>{item.time}</Text>
        </View>
        <View style={styles.bookingDetail}>
          <Ionicons name="location-outline" size={14} color="#8A8AAE" />
          <Text style={styles.bookingDetailText}>{item.location}</Text>
        </View>
      </View>
      <View style={styles.bookingActions}>
        <TouchableOpacity style={styles.bookingActionButton}>
          <Text style={styles.bookingActionText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookingActionButton}>
          <Text style={styles.bookingActionText}>Reschedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bookingActionButton, styles.bookingActionDanger]}>
          <Text style={[styles.bookingActionText, styles.bookingActionDangerText]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Wishlist Item Card
const WishlistItem = ({ item }: any) => (
  <TouchableOpacity style={styles.wishlistCard}>
    <Image source={{ uri: item.image }} style={styles.wishlistImage} />
    <View style={styles.wishlistInfo}>
      <Text style={styles.wishlistTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.wishlistProvider}>{item.provider}</Text>
      <Text style={styles.wishlistPrice}>UGX {item.price.toLocaleString()}</Text>
      <Text style={styles.wishlistRating}>⭐ {item.rating}</Text>
      {item.priceDrop && (
        <View style={styles.wishlistAlert}>
          <Ionicons name="arrow-down" size={12} color="#2ECC71" />
          <Text style={styles.wishlistAlertText}>Price reduced!</Text>
        </View>
      )}
      {item.stockAlert && (
        <View style={[styles.wishlistAlert, styles.wishlistAlertDanger]}>
          <Ionicons name="alert-circle" size={12} color="#E74C3C" />
          <Text style={[styles.wishlistAlertText, styles.wishlistAlertDangerText]}>Only 2 left!</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

// Collection Card
const CollectionCard = ({ item }: any) => (
  <TouchableOpacity style={styles.collectionCard}>
    <Image source={{ uri: item.cover }} style={styles.collectionImage} />
    <LinearGradient
      colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
      style={styles.collectionOverlay}
    />
    <View style={styles.collectionInfo}>
      <Text style={styles.collectionName}>{item.name}</Text>
      <Text style={styles.collectionMeta}>{item.count} items • {item.lastActivity}</Text>
    </View>
  </TouchableOpacity>
);

// --- Guest Mode Component ---
const GuestHubView = ({ navigation }: any) => (
  <View style={styles.guestContainer}>
    <Text style={styles.guestIcon}>🛒</Text>
    <Text style={styles.guestTitle}>Your shopping journey starts here</Text>
    <Text style={styles.guestSubtext}>
      After creating a free account you'll be able to:
    </Text>
    <View style={styles.guestFeatures}>
      <Text style={styles.guestFeature}>• Save products</Text>
      <Text style={styles.guestFeature}>• Manage bookings</Text>
      <Text style={styles.guestFeature}>• Organize purchases</Text>
    </View>
    <TouchableOpacity 
      style={styles.guestButton} 
      onPress={() => navigation?.navigate('Join')}
    >
      <Text style={styles.guestButtonText}>Create Account</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => navigation?.navigate('Discover')}>
      <Text style={styles.guestContinueText}>Continue Browsing</Text>
    </TouchableOpacity>
  </View>
);

// --- HubContent Component (Extracted for reuse) ---
const HubContent = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('cart');
  const [cartItemsState, setCartItemsState] = useState(cartItems);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const tabs = [
    { key: 'cart', label: 'Cart', count: cartItemsState.length },
    { key: 'bookings', label: 'Bookings', count: bookings.length },
    { key: 'wishlist', label: 'Wishlist', count: wishlistItems.length },
    { key: 'collections', label: 'Collections', count: collections.length },
  ];

  const handleRemoveItem = (id: string) => {
    setCartItemsState(cartItemsState.filter(item => item.id !== id));
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItemsState(
      cartItemsState.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const calculateTotal = () => {
    const subtotal = cartItemsState.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = 15000;
    const walletSavings = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee - walletSavings;
    return { subtotal, deliveryFee, walletSavings, total };
  };

  const { subtotal, deliveryFee, walletSavings, total } = calculateTotal();

  // If not authenticated, show guest view
  if (!isAuthenticated) {
    return <GuestHubView navigation={navigation} />;
  }

  // If authenticated, show full Hub
  const renderTabContent = () => {
    switch (activeTab) {
      case 'cart':
        return (
          <View style={styles.tabContent}>
            {cartItemsState.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptySubtext}>Start shopping to add items</Text>
              </View>
            ) : (
              <>
                {cartItemsState.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onRemove={handleRemoveItem}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                ))}
                <View style={styles.cartSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>UGX {subtotal.toLocaleString()}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee</Text>
                    <Text style={styles.summaryValue}>UGX {deliveryFee.toLocaleString()}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, styles.summarySavingsLabel]}>Wallet Savings</Text>
                    <Text style={[styles.summaryValue, styles.summarySavings]}>- UGX {walletSavings.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryTotal]}>
                    <Text style={styles.summaryTotalLabel}>Total</Text>
                    <Text style={styles.summaryTotalValue}>UGX {total.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity style={styles.checkoutButton}>
                    <LinearGradient
                      colors={['#4A7DFF', '#6B94FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.checkoutGradient}
                    >
                      <Text style={styles.checkoutText}>Proceed to Pay</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        );

      case 'bookings':
        return (
          <View style={styles.tabContent}>
            {bookings.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyTitle}>No bookings yet</Text>
                <Text style={styles.emptySubtext}>Your appointments will appear here</Text>
              </View>
            ) : (
              bookings.map((item) => (
                <BookingCard key={item.id} item={item} />
              ))
            )}
          </View>
        );

      case 'wishlist':
        return (
          <View style={styles.tabContent}>
            {wishlistItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>❤️</Text>
                <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
                <Text style={styles.emptySubtext}>Save items you love for later</Text>
              </View>
            ) : (
              <FlatList
                data={wishlistItems}
                renderItem={({ item }) => <WishlistItem item={item} />}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                contentContainerStyle={styles.wishlistGrid}
              />
            )}
          </View>
        );

      case 'collections':
        return (
          <View style={styles.tabContent}>
            {collections.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📁</Text>
                <Text style={styles.emptyTitle}>No collections yet</Text>
                <Text style={styles.emptySubtext}>Group your saved items</Text>
              </View>
            ) : (
              <FlatList
                data={collections}
                renderItem={({ item }) => <CollectionCard item={item} />}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                contentContainerStyle={styles.collectionsGrid}
              />
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hub</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="search-outline" size={22} color="#1F2F5F" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="options-outline" size={22} color="#1F2F5F" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* AI Suggestion Banner */}
        <AISuggestionBanner />

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Main HubScreen Component (Wrapped with ResponsiveLayout) ---
export const HubScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout 
      currentRoute="Hub" 
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true} // ✅ Hide Context Panel on Hub
      fullWidth={true}
    >
      <HubContent navigation={navigation} />
    </ResponsiveLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2F5F',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIcon: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  // AI Banner
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 125, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 125, 255, 0.1)',
  },
  aiBannerIcon: {
    marginRight: 10,
  },
  aiBannerText: {
    flex: 1,
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '500',
  },
  aiBannerDots: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  aiBannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8A8AAE',
  },
  aiBannerDotActive: {
    backgroundColor: '#4A7DFF',
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  tabText: {
    color: '#8A8AAE',
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#4A7DFF',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  tabContent: {
    paddingBottom: 8,
  },
  // Cart
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cartImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  cartContent: {
    flex: 1,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cartTitle: {
    flex: 1,
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  cartProvider: {
    color: '#4A7DFF',
    fontSize: 12,
    marginTop: 2,
  },
  cartVariation: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 1,
  },
  cartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  cartPriceQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartPrice: {
    color: '#1F2F5F',
    fontSize: 15,
    fontWeight: '600',
  },
  cartQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cartQtyButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartQtyButtonText: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: '600',
  },
  cartQtyText: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
    minWidth: 20,
    textAlign: 'center',
  },
  cartDelivery: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  // Cart Summary
  cartSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  summaryValue: {
    color: '#1F2F5F',
    fontSize: 13,
  },
  summarySavingsLabel: {
    color: '#2ECC71',
  },
  summarySavings: {
    color: '#2ECC71',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E8ECF4',
    paddingTop: 8,
    marginTop: 4,
  },
  summaryTotalLabel: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryTotalValue: {
    color: '#4A7DFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    marginTop: 12,
  },
  checkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Bookings
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookingProvider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingAvatarText: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bookingProviderName: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  bookingService: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  bookingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bookingStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  bookingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingDetailText: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  bookingActionButton: {
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bookingActionText: {
    color: '#4A7DFF',
    fontSize: 11,
    fontWeight: '500',
  },
  bookingActionDanger: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  bookingActionDangerText: {
    color: '#E74C3C',
  },
  // Wishlist
  wishlistGrid: {
    gap: 8,
  },
  wishlistCard: {
    flex: 1,
    margin: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  wishlistImage: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    marginBottom: 6,
  },
  wishlistInfo: {
    flex: 1,
  },
  wishlistTitle: {
    color: '#1F2F5F',
    fontSize: 13,
    fontWeight: '500',
  },
  wishlistProvider: {
    color: '#8A8AAE',
    fontSize: 11,
    marginTop: 1,
  },
  wishlistPrice: {
    color: '#4A7DFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  wishlistRating: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  wishlistAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  wishlistAlertDanger: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  wishlistAlertText: {
    color: '#2ECC71',
    fontSize: 10,
    fontWeight: '500',
  },
  wishlistAlertDangerText: {
    color: '#E74C3C',
  },
  // Collections
  collectionsGrid: {
    gap: 8,
  },
  collectionCard: {
    flex: 1,
    margin: 4,
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  collectionImage: {
    width: '100%',
    height: '100%',
  },
  collectionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  collectionInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  collectionName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  collectionMeta: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#1F2F5F',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 4,
  },
  // Guest Mode
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8F9FC',
  },
  guestIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  guestTitle: {
    color: '#1F2F5F',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  guestSubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  guestFeatures: {
    marginBottom: 24,
    alignItems: 'center',
  },
  guestFeature: {
    color: '#8A8AAE',
    fontSize: 14,
    marginVertical: 2,
  },
  guestButton: {
    backgroundColor: '#4A7DFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  guestContinueText: {
    color: '#8A8AAE',
    fontSize: 14,
  },
  bottomSpacer: {
    height: 20,
  },
});