// src/features/hub/HubScreen.tsx

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
  StatusBar,
  FlatList,
  Animated,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { supabase } from '../../lib/supabase';

const supabaseAny = supabase as any;

const { width, height } = Dimensions.get('window');

// --- Types ---
interface CartItem {
  id: string;
  title: string;
  provider: string;
  price: number;
  quantity: number;
  image: string;
  variation: string;
  delivery: string;
  providerAvatar: string;
  isVerified: boolean;
  rating: number;
  distance: string;
  shop_id: string;
  catalog_id: string;
  interaction_id: string;
  item_type: 'product' | 'service';
}

interface Booking {
  id: string;
  service: string;
  provider: string;
  provider_id: string;
  date: string;
  time: string;
  status: string;
  location: string;
  image: string;
  providerAvatar: string;
  price: number;
  item_id: string;
  interaction_id: string;
  metadata?: any;
}

interface WishlistItem {
  id: string;
  title: string;
  provider: string;
  price: number;
  image: string;
  rating: number;
  priceDrop: boolean;
  stockAlert: boolean;
}

interface Collection {
  id: string;
  name: string;
  count: number;
  cover: string;
  lastActivity: string;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

// --- AI Suggestion Banner ---
const AISuggestionBanner = () => {
  const suggestions = [
    "🛒 You have items in your cart ready for checkout.",
    "📅 Don't forget your upcoming bookings.",
    "💰 Items in your wishlist may have price drops.",
    "📦 Would you like to group these purchases into one payment?",
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % suggestions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

// --- Cart Item Card ---
const CartItemCard = ({ item, onRemove, onUpdateQuantity, onChangeProvider }: any) => (
  <View style={styles.cartCard}>
    <Image source={{ uri: item.image }} style={styles.cartImage} />
    <View style={styles.cartContent}>
      <View style={styles.cartHeader}>
        <Text style={styles.cartTitle} numberOfLines={1}>{item.title}</Text>
        <TouchableOpacity onPress={() => onRemove(item.id)}>
          <Ionicons name="close" size={18} color="#8A8AAE" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => onChangeProvider(item)}>
        <Text style={styles.cartProvider}>
          {item.provider} <Ionicons name="chevron-down" size={14} color="#4A7DFF" />
        </Text>
      </TouchableOpacity>
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

// --- Booking Card ---
const BookingCard = ({ item, onCancel, onChangeProvider }: any) => {
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
            <TouchableOpacity onPress={() => onChangeProvider(item)}>
              <Text style={styles.bookingProviderName}>
                {item.provider} <Ionicons name="chevron-down" size={14} color="#4A7DFF" />
              </Text>
            </TouchableOpacity>
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
        <View style={styles.bookingDetail}>
          <Ionicons name="cash-outline" size={14} color="#8A8AAE" />
          <Text style={styles.bookingDetailText}>UGX {item.price.toLocaleString()}</Text>
        </View>
      </View>
      <View style={styles.bookingActions}>
        <TouchableOpacity style={styles.bookingActionButton}>
          <Text style={styles.bookingActionText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookingActionButton}>
          <Text style={styles.bookingActionText}>Reschedule</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.bookingActionButton, styles.bookingActionDanger]} 
          onPress={() => onCancel(item.id)}
        >
          <Text style={[styles.bookingActionText, styles.bookingActionDangerText]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Wishlist Item Card ---
const WishlistItemCard = ({ item }: any) => (
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

// --- Collection Card ---
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

// --- Provider Selection Modal ---
const ProviderSelectionModal = ({ 
  visible, 
  onClose, 
  onSelect, 
  currentItem,
  providers 
}: any) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Provider</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#8A8AAE" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={providers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.providerOption,
                  currentItem?.provider === item.name && styles.providerOptionSelected,
                ]}
                onPress={() => onSelect(item)}
              >
                <View style={styles.providerOptionLeft}>
                  <View style={styles.providerAvatar}>
                    <Text style={styles.providerAvatarText}>
                      {item.name?.charAt(0).toUpperCase() || 'P'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.providerOptionName}>{item.name}</Text>
                    <Text style={styles.providerOptionLocation}>{item.area || 'Location TBD'}</Text>
                  </View>
                </View>
                {currentItem?.provider === item.name && (
                  <Ionicons name="checkmark-circle" size={24} color="#4A7DFF" />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.providerList}
          />
        </View>
      </View>
    </Modal>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const HubContent = ({ navigation }: any) => {
  const { isAuthenticated, user } = useAuth();
  const { isDesktop } = useBreakpoint();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cart');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  
  // Provider selection state
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);

  // ============================================================
  // FETCH CART ITEMS (Products with 'purchase' action)
  // ============================================================
  const fetchCartItems = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data: interactions, error: interactionsError } = await supabaseAny
        .from('user_interactions')
        .select('id, item_id, metadata, created_at')
        .eq('user_id', user.id)
        .eq('action', 'purchase')
        .order('created_at', { ascending: false });

      if (interactionsError) {
        console.error('Error fetching cart:', interactionsError);
        return [];
      }

      if (!interactions || interactions.length === 0) {
        return [];
      }

      const itemIds = interactions.map((i: any) => i.item_id);
      
      const { data: catalogItems, error: catalogError } = await supabaseAny
        .from('catalog')
        .select('*')
        .in('id', itemIds);

      if (catalogError) {
        console.error('Error fetching catalog items:', catalogError);
        return [];
      }

      const productIds = catalogItems?.map((item: any) => item.id) || [];
      let shopProducts: any[] = [];
      if (productIds.length > 0) {
        const { data, error } = await supabaseAny
          .from('shop_products')
          .select('*')
          .in('catalog_id', productIds);
        if (!error) shopProducts = data || [];
      }

      const shopIds = shopProducts.map((sp: any) => sp.shop_id).filter(Boolean);
      let shops: any[] = [];
      if (shopIds.length > 0) {
        const { data, error } = await supabaseAny
          .from('shops')
          .select('*')
          .in('id', shopIds);
        if (!error) shops = data || [];
      }

      const cartItems: CartItem[] = [];

      for (const interaction of interactions) {
        const item = catalogItems?.find((i: any) => i.id === interaction.item_id);
        if (!item) continue;

        const shopProduct = shopProducts.find((sp: any) => sp.catalog_id === item.id);
        const shop = shops.find((s: any) => s.id === shopProduct?.shop_id);
        const images = item.images || [];

        cartItems.push({
          id: interaction.id,
          title: item.name || 'Product',
          provider: shop?.name || 'Shop',
          price: shopProduct?.regular_price || 0,
          quantity: interaction.metadata?.quantity || 1,
          image: images[0] || 'https://via.placeholder.com/80/4A7DFF/FFFFFF?text=Product',
          variation: item.brand || item.category || 'Standard',
          delivery: '2-3 business days',
          providerAvatar: shop?.name?.charAt(0).toUpperCase() || 'S',
          isVerified: shop?.is_verified || false,
          rating: shop?.rating || 0,
          distance: shop?.area || '0 km',
          shop_id: shop?.id || '',
          catalog_id: item.id,
          interaction_id: interaction.id,
          item_type: 'product',
        });
      }

      return cartItems;
    } catch (error) {
      console.error('Error fetching cart items:', error);
      return [];
    }
  }, [user?.id]);

  // ============================================================
  // FETCH BOOKINGS (Services with 'booking' action)
  // ============================================================
  const fetchBookings = useCallback(async () => {
    if (!user?.id) return [];

    try {
      // ✅ Get bookings with 'booking' action
      const { data: interactions, error: interactionsError } = await supabaseAny
        .from('user_interactions')
        .select('id, item_id, metadata, created_at')
        .eq('user_id', user.id)
        .eq('action', 'booking')
        .order('created_at', { ascending: false });

      if (interactionsError) {
        console.error('Error fetching bookings:', interactionsError);
        return [];
      }

      if (!interactions || interactions.length === 0) {
        return [];
      }

      const itemIds = interactions.map((i: any) => i.item_id);
      
      const { data: serviceItems, error: serviceError } = await supabaseAny
        .from('service_catalog')
        .select('*')
        .in('id', itemIds);

      if (serviceError) {
        console.error('Error fetching service items:', serviceError);
        return [];
      }

      const serviceCatalogIds = serviceItems?.map((item: any) => item.id) || [];
      let providerServices: any[] = [];
      if (serviceCatalogIds.length > 0) {
        const { data, error } = await supabaseAny
          .from('provider_services')
          .select('*')
          .in('service_id', serviceCatalogIds);
        if (!error) providerServices = data || [];
      }

      const userIds = providerServices.map((ps: any) => ps.user_id).filter(Boolean);
      let users: any[] = [];
      if (userIds.length > 0) {
        const { data, error } = await supabaseAny
          .from('users')
          .select('id, full_name, phone_number')
          .in('id', userIds);
        if (!error) users = data || [];
      }

      const bookingItems: Booking[] = [];

      for (const interaction of interactions) {
        const item = serviceItems?.find((i: any) => i.id === interaction.item_id);
        if (!item) continue;

        const providerService = providerServices.find((ps: any) => ps.service_id === item.id);
        const user = users.find((u: any) => u.id === providerService?.user_id);
        const images = item.images || [];

        bookingItems.push({
          id: interaction.id,
          service: item.name || 'Service',
          provider: user?.full_name || 'Provider',
          provider_id: providerService?.user_id || '',
          date: interaction.metadata?.date || new Date().toLocaleDateString(),
          time: interaction.metadata?.time || '2:00 PM',
          status: interaction.metadata?.status || 'Pending',
          location: interaction.metadata?.location || 'Location TBD',
          image: images[0] || 'https://via.placeholder.com/80/6B94FF/FFFFFF?text=Service',
          providerAvatar: user?.full_name?.charAt(0).toUpperCase() || 'P',
          price: providerService?.price || 0,
          item_id: item.id,
          interaction_id: interaction.id,
        });
      }

      return bookingItems;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  }, [user?.id]);

  // ============================================================
  // FETCH WISHLIST ITEMS
  // ============================================================
  const fetchWishlist = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data: interactions, error: interactionsError } = await supabaseAny
        .from('user_interactions')
        .select('item_id, created_at')
        .eq('user_id', user.id)
        .eq('action', 'save')
        .order('created_at', { ascending: false })
        .limit(20);

      if (interactionsError) {
        console.error('Error fetching wishlist:', interactionsError);
        return [];
      }

      if (!interactions || interactions.length === 0) {
        return [];
      }

      const itemIds = interactions.map((i: any) => i.item_id);
      
      const { data: catalogItems, error: catalogError } = await supabaseAny
        .from('catalog')
        .select('*')
        .in('id', itemIds)
        .limit(20);

      if (catalogError) {
        console.error('Error fetching wishlist items:', catalogError);
        return [];
      }

      const productIds = catalogItems?.map((item: any) => item.id) || [];
      let shopProducts: any[] = [];
      if (productIds.length > 0) {
        const { data, error } = await supabaseAny
          .from('shop_products')
          .select('regular_price, shop_id')
          .in('catalog_id', productIds);
        if (!error) shopProducts = data || [];
      }

      const shopIds = shopProducts.map((sp: any) => sp.shop_id).filter(Boolean);
      let shops: any[] = [];
      if (shopIds.length > 0) {
        const { data, error } = await supabaseAny
          .from('shops')
          .select('id, name, rating')
          .in('id', shopIds);
        if (!error) shops = data || [];
      }

      const wishlistData: WishlistItem[] = catalogItems.map((item: any) => {
        const shopProduct = shopProducts.find((sp: any) => sp.catalog_id === item.id);
        const shop = shops.find((s: any) => s.id === shopProduct?.shop_id);
        return {
          id: item.id,
          title: item.name,
          provider: shop?.name || 'Unknown Shop',
          price: shopProduct?.regular_price || 0,
          image: item.images?.[0] || 'https://via.placeholder.com/150/4A7DFF/FFFFFF?text=Product',
          rating: shop?.rating || 4.0,
          priceDrop: Math.random() > 0.7,
          stockAlert: Math.random() > 0.8,
        };
      });

      return wishlistData;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  }, [user?.id]);

  // --- Fetch Wallet Balance ---
  const fetchWalletBalance = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabaseAny
        .from('users')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching wallet balance:', error);
        return;
      }

      setWalletBalance(data?.wallet_balance || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  }, [user?.id]);

  // --- Load All Data ---
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [cartData, bookingData, wishlistData] = await Promise.all([
        fetchCartItems(),
        fetchBookings(),
        fetchWishlist(),
      ]);

      setCartItems(cartData);
      setBookings(bookingData);
      setWishlistItems(wishlistData);
      await fetchWalletBalance();

      if (wishlistData.length > 0) {
        const categories = [...new Set(wishlistData.map(item => item.provider))];
        const collectionData: Collection[] = categories.slice(0, 4).map((cat, index) => ({
          id: `col-${index}`,
          name: cat || 'My Collection',
          count: wishlistData.filter(item => item.provider === cat).length,
          cover: wishlistData.find(item => item.provider === cat)?.image || 'https://via.placeholder.com/150/4A7DFF/FFFFFF?text=Collection',
          lastActivity: 'Recently',
        }));
        setCollections(collectionData);
      }
    } catch (error) {
      console.error('Error loading hub data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchCartItems, fetchBookings, fetchWishlist, fetchWalletBalance]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadAllData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, loadAllData]);

  // --- Calculate Cart Total ---
  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = cartItems.length > 0 ? 15000 : 0;
    const walletSavings = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee - walletSavings;
    return { subtotal, deliveryFee, walletSavings, total };
  };

  const { subtotal, deliveryFee, walletSavings, total } = calculateTotal();

  // --- Handle Remove Item from Cart ---
  const handleRemoveItem = async (id: string) => {
    try {
      const { error } = await supabaseAny
        .from('user_interactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing item:', error);
        Alert.alert('Error', 'Failed to remove item from cart');
        return;
      }

      setCartItems(cartItems.filter(item => item.id !== id));
      Alert.alert('Removed', 'Item removed from your cart');
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  // --- Handle Cancel Booking ---
  const handleCancelBooking = async (id: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabaseAny
                .from('user_interactions')
                .update({
                  metadata: {
                    ...bookings.find(b => b.id === id)?.metadata,
                    status: 'Cancelled',
                    cancelled_at: new Date().toISOString()
                  },
                  updated_at: new Date().toISOString()
                })
                .eq('id', id);

              if (error) {
                console.error('Error cancelling booking:', error);
                Alert.alert('Error', 'Failed to cancel booking');
                return;
              }

              setBookings(bookings.filter(item => item.id !== id));
              Alert.alert('Cancelled', 'Booking has been cancelled');
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          }
        }
      ]
    );
  };

  // --- Handle Update Quantity in Cart ---
  const handleUpdateQuantity = useCallback(async (id: string, quantity: number) => {
    try {
      const item = cartItems.find(i => i.id === id);
      if (!item) return;

      const { error } = await supabaseAny
        .from('user_interactions')
        .update({
          metadata: {
            ...item,
            quantity: quantity,
            updated_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating quantity:', error);
        Alert.alert('Error', 'Failed to update quantity');
        return;
      }

      setCartItems(
        cartItems.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  }, [cartItems]);

  // --- Handle Change Provider ---
  const handleChangeProvider = async (item: any, newProvider: any) => {
    try {
      const { error } = await supabaseAny
        .from('user_interactions')
        .update({
          metadata: {
            ...item,
            provider: newProvider.name,
            provider_id: newProvider.id,
            updated_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) {
        console.error('Error updating provider:', error);
        Alert.alert('Error', 'Failed to change provider');
        return;
      }

      await loadAllData();
      setShowProviderModal(false);
      Alert.alert('Success', 'Provider changed successfully');
    } catch (error) {
      console.error('Error changing provider:', error);
      Alert.alert('Error', 'Failed to change provider');
    }
  };

  // --- Open Provider Selection ---
  const openProviderSelection = async (item: any) => {
    setSelectedItem(item);
    
    try {
      let providers: any[] = [];
      
      if (item.item_type === 'product') {
        const { data: shopProducts } = await supabaseAny
          .from('shop_products')
          .select('shop_id, shops(id, name, area, rating)')
          .eq('catalog_id', item.catalog_id);
          
        if (shopProducts) {
          providers = shopProducts.map((sp: any) => ({
            id: sp.shops.id,
            name: sp.shops.name,
            area: sp.shops.area,
            rating: sp.shops.rating,
          }));
        }
      } else {
        const { data: providerServices } = await supabaseAny
          .from('provider_services')
          .select('user_id, users(id, full_name, phone_number)')
          .eq('service_id', item.item_id);
          
        if (providerServices) {
          providers = providerServices.map((ps: any) => ({
            id: ps.users.id,
            name: ps.users.full_name,
            area: 'Available',
            rating: 0,
          }));
        }
      }
      
      setAvailableProviders(providers);
      setShowProviderModal(true);
    } catch (error) {
      console.error('Error fetching providers:', error);
      Alert.alert('Error', 'Failed to load providers');
    }
  };

  // --- Tabs Configuration ---
  const tabs = [
    { key: 'cart', label: 'Cart', count: cartItems.length },
    { key: 'bookings', label: 'Bookings', count: bookings.length },
    { key: 'wishlist', label: 'Wishlist', count: wishlistItems.length },
    { key: 'collections', label: 'Collections', count: collections.length },
  ];

  // --- Render Functions ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'cart':
        return (
          <View style={styles.tabContent}>
            {cartItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptySubtext}>Start shopping to add items</Text>
              </View>
            ) : (
              <>
                {cartItems.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onRemove={handleRemoveItem}
                    onUpdateQuantity={handleUpdateQuantity}
                    onChangeProvider={openProviderSelection}
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
                <BookingCard
                  key={item.id}
                  item={item}
                  onCancel={handleCancelBooking}
                  onChangeProvider={openProviderSelection}
                />
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
                renderItem={({ item }) => <WishlistItemCard item={item} />}
                keyExtractor={(item) => item.id}
                numColumns={isDesktop ? 3 : 2}
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
                numColumns={isDesktop ? 3 : 2}
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

  // --- Loading State ---
  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDesktop && styles.desktopContainer]}>
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading your hub...</Text>
      </View>
    );
  }

  // --- Guest View ---
  if (!isAuthenticated) {
    return <GuestHubView navigation={navigation} />;
  }

  // --- Desktop View ---
  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1A2A4F" />

        <View style={styles.desktopHeader}>
          <Text style={styles.desktopHeaderTitle}>Hub</Text>
          <Text style={styles.desktopHeaderSubtitle}>Manage your shopping</Text>
        </View>

        <View style={styles.desktopGrid}>
          <View style={styles.desktopLeftColumn}>
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

            <AISuggestionBanner />

            <ScrollView showsVerticalScrollIndicator={false}>
              {renderTabContent()}
              <View style={styles.bottomSpacer} />
            </ScrollView>
          </View>

          {activeTab === 'cart' && cartItems.length > 0 && (
            <View style={styles.desktopRightColumn}>
              <View style={styles.summaryPanel}>
                <Text style={styles.summaryPanelTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Items</Text>
                  <Text style={styles.summaryValue}>{cartItems.length}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>UGX {subtotal.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery</Text>
                  <Text style={styles.summaryValue}>UGX {deliveryFee.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, styles.summarySavingsLabel]}>Savings</Text>
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
            </View>
          )}
        </View>

        <ProviderSelectionModal
          visible={showProviderModal}
          onClose={() => setShowProviderModal(false)}
          onSelect={(provider: any) => handleChangeProvider(selectedItem, provider)}
          currentItem={selectedItem}
          providers={availableProviders}
        />
      </View>
    );
  }

  // --- Mobile View ---
  return (
    <SafeAreaView style={styles.mobileContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2A4F" />

      <View style={styles.mobileHeader}>
        <Text style={styles.mobileHeaderTitle}>Hub</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="search-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="options-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <AISuggestionBanner />

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

        {renderTabContent()}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <ProviderSelectionModal
        visible={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        onSelect={(provider: any) => handleChangeProvider(selectedItem, provider)}
        currentItem={selectedItem}
        providers={availableProviders}
      />
    </SafeAreaView>
  );
};

// ============================================================
// EXPORT
// ============================================================

export const HubScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout 
      currentRoute="Hub" 
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      <HubContent navigation={navigation} />
    </ResponsiveLayout>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    backgroundColor: '#1A2A4F',
    padding: 24,
  },
  desktopHeader: {
    marginBottom: 24,
  },
  desktopHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  desktopHeaderSubtitle: {
    color: '#8A8AAE',
    fontSize: 16,
    marginTop: 4,
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: 24,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  desktopLeftColumn: {
    flex: 2,
    minWidth: 400,
  },
  desktopRightColumn: {
    flex: 1,
    minWidth: 300,
    maxWidth: 400,
  },
  summaryPanel: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  summaryPanelTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: '#1F2F5F',
  },
  mobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(31, 47, 95, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  mobileHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIcon: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2F5F',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
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
    color: '#FFFFFF',
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
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
  cartCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartQtyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cartQtyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    minWidth: 20,
    textAlign: 'center',
  },
  cartDelivery: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  cartSummary: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    color: '#FFFFFF',
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
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 8,
    marginTop: 4,
  },
  summaryTotalLabel: {
    color: '#FFFFFF',
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
  bookingCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingAvatarText: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bookingProviderName: {
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  wishlistGrid: {
    gap: 8,
  },
  wishlistCard: {
    flex: 1,
    margin: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    color: '#FFFFFF',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 4,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1F2F5F',
  },
  guestIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  guestTitle: {
    color: '#FFFFFF',
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
    maxWidth: 300,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A2A4F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  providerList: {
    paddingBottom: 20,
  },
  providerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  providerOptionSelected: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  providerOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerAvatarText: {
    color: '#4A7DFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  providerOptionName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  providerOptionLocation: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 20,
  },
});