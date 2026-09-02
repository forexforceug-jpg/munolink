// src/features/pay/PayScreen.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  FlatList,
  Dimensions,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

const supabaseAny = supabase as any;
const { width, height } = Dimensions.get('window');

// --- Types ---
interface Transaction {
  id: string;
  type: 'payment' | 'topup' | 'refund' | 'withdrawal' | 'transfer';
  merchant: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  method: string;
  reference?: string;
  shop_id?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type: 'mobile_money' | 'card' | 'bank';
  default: boolean;
  details?: {
    phone?: string;
    last4?: string;
    bankName?: string;
    accountNumber?: string;
  };
}

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  shop_id: string;
  shop_name: string;
  provider?: string;
  variation?: string;
  delivery?: string;
  catalog_id?: string;
  interaction_id?: string;
  item_type?: 'product' | 'service';
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

// ============================================================
// SUB-COMPONENTS
// ============================================================

// --- AI Suggestion Banner ---
const AISuggestionBanner = () => {
  const suggestions = [
    "🛒 You have items in your cart ready for checkout.",
    "📅 Don't forget your upcoming bookings.",
    "💰 Items in your wishlist may have price drops.",
    "📦 Group purchases into one payment to save on delivery.",
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % suggestions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.aiBanner}>
      <View style={styles.aiBannerIcon}>
        <Ionicons name="sparkles" size={18} color="#4A7DFF" />
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
    </View>
  );
};

// --- Cart Item Card ---
const CartItemCard = ({ item, onRemove, onUpdateQuantity }: any) => (
  <View style={styles.cartCard}>
    <Image source={{ uri: item.image || 'https://via.placeholder.com/80/4A7DFF/FFFFFF?text=Product' }} style={styles.cartImage} />
    <View style={styles.cartContent}>
      <View style={styles.cartHeader}>
        <Text style={styles.cartTitle} numberOfLines={1}>{item.title}</Text>
        <TouchableOpacity onPress={() => onRemove(item.id)}>
          <Ionicons name="close" size={18} color="#8A8AAE" />
        </TouchableOpacity>
      </View>
      <Text style={styles.cartProvider}>{item.provider || item.shop_name || 'Shop'}</Text>
      {item.variation && <Text style={styles.cartVariation}>{item.variation}</Text>}
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
        <Text style={styles.cartDelivery}>{item.delivery || '2-3 days'}</Text>
      </View>
    </View>
  </View>
);

// --- Booking Card ---
const BookingCard = ({ item, onCancel }: any) => {
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
            <Text style={styles.bookingAvatarText}>{item.providerAvatar || item.provider?.charAt(0).toUpperCase() || 'P'}</Text>
          </View>
          <View>
            <Text style={styles.bookingProviderName}>{item.provider || 'Provider'}</Text>
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
          <Text style={styles.bookingDetailText}>{item.location || 'Location TBD'}</Text>
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
const WishlistItemCard = ({ item, onRemove }: any) => (
  <TouchableOpacity style={styles.wishlistCard}>
    <Image source={{ uri: item.image || 'https://via.placeholder.com/150/4A7DFF/FFFFFF?text=Product' }} style={styles.wishlistImage} />
    <TouchableOpacity 
      style={styles.wishlistRemoveButton}
      onPress={() => onRemove(item.id)}
    >
      <Ionicons name="close" size={16} color="#8A8AAE" />
    </TouchableOpacity>
    <View style={styles.wishlistInfo}>
      <Text style={styles.wishlistTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.wishlistProvider}>{item.provider}</Text>
      <Text style={styles.wishlistPrice}>UGX {item.price.toLocaleString()}</Text>
      <Text style={styles.wishlistRating}>⭐ {item.rating || 4.0}</Text>
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

// --- Payment Method Item ---
const PaymentMethodItem = ({ method, onSelect, isSelected }: any) => (
  <TouchableOpacity 
    style={[styles.paymentMethodItem, isSelected && styles.paymentMethodItemSelected]} 
    onPress={() => onSelect(method.id)}
  >
    <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
    <View style={styles.paymentMethodContent}>
      <Text style={styles.paymentMethodName}>{method.name}</Text>
      {method.default && (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultBadgeText}>Default</Text>
        </View>
      )}
      {method.details?.phone && (
        <Text style={styles.paymentMethodDetail}>{method.details.phone}</Text>
      )}
    </View>
    <View style={[styles.paymentMethodRadio, isSelected && styles.paymentMethodRadioSelected]} />
  </TouchableOpacity>
);

// --- Transaction Item ---
const TransactionItem = ({ item }: { item: Transaction }) => {
  const isIncoming = item.amount > 0;
  const statusColors = {
    completed: '#2ECC71',
    pending: '#F1C40F',
    failed: '#E74C3C',
  };

  const statusLabels = {
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',
  };

  return (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIconContainer, { 
        backgroundColor: isIncoming ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)' 
      }]}>
        <Text style={styles.transactionIcon}>
          {isIncoming ? '📥' : '📤'}
        </Text>
      </View>
      <View style={styles.transactionContent}>
        <Text style={styles.transactionMerchant}>{item.merchant}</Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionDate}>
            {new Date(item.date).toLocaleDateString('en-UG', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          <View style={[styles.transactionStatus, { backgroundColor: statusColors[item.status] + '20' }]}>
            <Text style={[styles.transactionStatusText, { color: statusColors[item.status] }]}>
              {statusLabels[item.status]}
            </Text>
          </View>
        </View>
        {item.reference && (
          <Text style={styles.transactionReference}>Ref: {item.reference}</Text>
        )}
      </View>
      <Text style={[styles.transactionAmount, { color: isIncoming ? '#2ECC71' : '#E74C3C' }]}>
        {isIncoming ? '+' : ''}{item.amount.toLocaleString()} UGX
      </Text>
    </View>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const PayContent = ({ navigation }: any) => {
  const { isAuthenticated, user } = useAuth();
  const { isDesktop } = useBreakpoint();
  
  // --- State ---
  // Payment states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  
  // Hub states
  const [activeTab, setActiveTab] = useState('cart');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  // Transaction filters
  const transactionFilters = ['All', 'Payments', 'Top Ups', 'Refunds', 'Withdrawals'];
  
  // Hub tabs
  const hubTabs = [
    { key: 'cart', label: 'Cart', count: cartItems.length },
    { key: 'bookings', label: 'Bookings', count: bookings.length },
    { key: 'wishlist', label: 'Wishlist', count: wishlistItems.length },
  ];

  // ============================================================
  // FETCH FUNCTIONS
  // ============================================================

  const fetchWalletBalance = useCallback(async () => {
    if (!user?.id) return 0;

    try {
      const { data, error } = await supabaseAny
        .from('users')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      if (error) return 0;
      return data?.wallet_balance || 0;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return 0;
    }
  }, [user?.id]);

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabaseAny
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) return [];

      return data.map((t: any) => ({
        id: t.id,
        type: t.type,
        merchant: t.shop_id || 'Munolink',
        amount: t.amount,
        date: t.created_at || new Date().toISOString(),
        status: t.status || 'completed',
        method: t.payment_code || 'Wallet',
        reference: t.reference,
        shop_id: t.shop_id,
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }, [user?.id]);

  const fetchPaymentMethods = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data: userData, error: userError } = await supabaseAny
        .from('users')
        .select('phone_number')
        .eq('id', user.id)
        .single();

      if (userError) return [];

      const methods: PaymentMethod[] = [];
      const phone = userData?.phone_number || '';

      if (phone) {
        methods.push({
          id: 'mtn',
          name: 'MTN Mobile Money',
          icon: '📱',
          type: 'mobile_money',
          default: true,
          details: { phone: phone },
        });
        methods.push({
          id: 'airtel',
          name: 'Airtel Money',
          icon: '📱',
          type: 'mobile_money',
          default: false,
          details: { phone: phone },
        });
      }

      methods.push({
        id: 'wallet',
        name: 'Munolink Wallet',
        icon: '💰',
        type: 'mobile_money',
        default: phone ? false : true,
      });

      return methods;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }, [user?.id]);

  const fetchCartItems = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data: interactions, error: interactionsError } = await supabaseAny
        .from('user_interactions')
        .select('id, item_id, metadata, created_at')
        .eq('user_id', user.id)
        .eq('action', 'purchase')
        .order('created_at', { ascending: false });

      if (interactionsError || !interactions || interactions.length === 0) {
        return [];
      }

      const itemIds = interactions.map((i: any) => i.item_id);
      
      const { data: catalogItems, error: catalogError } = await supabaseAny
        .from('catalog')
        .select('*')
        .in('id', itemIds);

      if (catalogError) return [];

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
          .select('id, name, area')
          .in('id', shopIds);
        if (!error) shops = data || [];
      }

      const cartItems: CartItem[] = [];

      for (const interaction of interactions) {
        const item = catalogItems?.find((i: any) => i.id === interaction.item_id);
        if (!item) continue;

        const shopProduct = shopProducts.find((sp: any) => sp.catalog_id === item.id);
        const shop = shops.find((s: any) => s.id === shopProduct?.shop_id);

        cartItems.push({
          id: interaction.id,
          title: item.name || 'Product',
          price: shopProduct?.regular_price || 0,
          quantity: interaction.metadata?.quantity || 1,
          image: item.images?.[0],
          shop_id: shop?.id || '',
          shop_name: shop?.name || 'Shop',
          provider: shop?.name || 'Shop',
          variation: item.brand || item.category || 'Standard',
          delivery: '2-3 business days',
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

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data: interactions, error: interactionsError } = await supabaseAny
        .from('user_interactions')
        .select('id, item_id, metadata, created_at')
        .eq('user_id', user.id)
        .eq('action', 'booking')
        .order('created_at', { ascending: false });

      if (interactionsError || !interactions || interactions.length === 0) {
        return [];
      }

      const itemIds = interactions.map((i: any) => i.item_id);
      
      const { data: serviceItems, error: serviceError } = await supabaseAny
        .from('service_catalog')
        .select('*')
        .in('id', itemIds);

      if (serviceError) return [];

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
          .select('id, full_name')
          .in('id', userIds);
        if (!error) users = data || [];
      }

      const bookingItems: Booking[] = [];

      for (const interaction of interactions) {
        const item = serviceItems?.find((i: any) => i.id === interaction.item_id);
        if (!item) continue;

        const providerService = providerServices.find((ps: any) => ps.service_id === item.id);
        const user = users.find((u: any) => u.id === providerService?.user_id);

        bookingItems.push({
          id: interaction.id,
          service: item.name || 'Service',
          provider: user?.full_name || 'Provider',
          provider_id: providerService?.user_id || '',
          date: interaction.metadata?.date || new Date().toLocaleDateString(),
          time: interaction.metadata?.time || '2:00 PM',
          status: interaction.metadata?.status || 'Pending',
          location: interaction.metadata?.location || 'Location TBD',
          image: item.images?.[0] || 'https://via.placeholder.com/80/6B94FF/FFFFFF?text=Service',
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

      if (interactionsError || !interactions || interactions.length === 0) {
        return [];
      }

      const itemIds = interactions.map((i: any) => i.item_id);
      
      const { data: catalogItems, error: catalogError } = await supabaseAny
        .from('catalog')
        .select('*')
        .in('id', itemIds)
        .limit(20);

      if (catalogError) return [];

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

      return catalogItems.map((item: any) => {
        const shopProduct = shopProducts.find((sp: any) => sp.catalog_id === item.id);
        const shop = shops.find((s: any) => s.id === shopProduct?.shop_id);
        return {
          id: item.id,
          title: item.name || 'Product',
          provider: shop?.name || 'Unknown Shop',
          price: shopProduct?.regular_price || 0,
          image: item.images?.[0] || 'https://via.placeholder.com/150/4A7DFF/FFFFFF?text=Product',
          rating: shop?.rating || 4.0,
          priceDrop: Math.random() > 0.7,
          stockAlert: Math.random() > 0.8,
        };
      });
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  }, [user?.id]);

  // --- Load All Data ---
  const loadAllData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [balance, transactionsData, methods, cartData, bookingData, wishlistData] = await Promise.all([
        fetchWalletBalance(),
        fetchTransactions(),
        fetchPaymentMethods(),
        fetchCartItems(),
        fetchBookings(),
        fetchWishlist(),
      ]);

      setWalletBalance(balance);
      setTransactions(transactionsData);
      setPaymentMethods(methods);
      setCartItems(cartData);
      setBookings(bookingData);
      setWishlistItems(wishlistData);

      const defaultMethod = methods.find(m => m.default);
      if (defaultMethod) {
        setSelectedMethod(defaultMethod.id);
      } else if (methods.length > 0) {
        setSelectedMethod(methods[0].id);
      }
    } catch (error) {
      console.error('Error loading pay data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchWalletBalance, fetchTransactions, fetchPaymentMethods, fetchCartItems, fetchBookings, fetchWishlist]);

  // --- Auto-refresh when screen comes into focus ---
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?.id) {
        loadAllData();
      } else {
        setLoading(false);
      }
      return () => {};
    }, [isAuthenticated, user?.id, loadAllData])
  );

  // --- Initial load ---
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadAllData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, loadAllData]);

  // --- Pull to Refresh ---
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [loadAllData]);

  // ============================================================
  // CART CALCULATIONS
  // ============================================================

  const cartTotals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = cartItems.length > 0 ? 15000 : 0;
    const walletSavings = Math.round(subtotal * 0.05);
    return { subtotal, deliveryFee, walletSavings, total: subtotal + deliveryFee - walletSavings };
  }, [cartItems]);

  const { subtotal, deliveryFee, walletSavings, total } = cartTotals;

  // ============================================================
  // ACTION HANDLERS
  // ============================================================

  const handleAddMoney = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please login to add money');
      return;
    }

    const amountNum = parseInt(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    Alert.alert(
      'Confirm Add Money',
      `Add UGX ${amountNum.toLocaleString()} to your wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const { data, error } = await supabaseAny
                .rpc('process_payment', {
                  p_amount: amountNum,
                  p_pin: '1234',
                  p_shop_id: '',
                  p_user_id: user.id,
                });

              if (error) {
                Alert.alert('Error', 'Failed to add money. Please try again.');
                return;
              }

              setWalletBalance(walletBalance + amountNum);
              setTransactions(prev => [{
                id: Date.now().toString(),
                type: 'topup',
                merchant: 'MTN Mobile Money',
                amount: amountNum,
                date: new Date().toISOString(),
                status: 'completed',
                method: 'MTN',
                reference: `TOP-${Date.now()}`,
              }, ...prev]);

              setAmount('');
              setShowAddMoney(false);
              Alert.alert('Success', `UGX ${amountNum.toLocaleString()} added successfully!`);
            } catch (error) {
              console.error('Error adding money:', error);
              Alert.alert('Error', 'Failed to add money. Please try again.');
            }
          }
        }
      ]
    );
  }, [amount, selectedMethod, user?.id, walletBalance]);

  const handleWithdraw = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please login to withdraw');
      return;
    }

    const amountNum = parseInt(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amountNum > walletBalance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a withdrawal method');
      return;
    }

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw UGX ${amountNum.toLocaleString()} to ${paymentMethods.find(m => m.id === selectedMethod)?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setWalletBalance(walletBalance - amountNum);
              setTransactions(prev => [{
                id: Date.now().toString(),
                type: 'withdrawal',
                merchant: paymentMethods.find(m => m.id === selectedMethod)?.name || 'Withdrawal',
                amount: -amountNum,
                date: new Date().toISOString(),
                status: 'pending',
                method: paymentMethods.find(m => m.id === selectedMethod)?.name || 'Unknown',
                reference: `WTH-${Date.now()}`,
              }, ...prev]);

              setAmount('');
              setShowWithdraw(false);
              Alert.alert('Success', `UGX ${amountNum.toLocaleString()} withdrawal initiated!`);
            } catch (error) {
              console.error('Error withdrawing:', error);
              Alert.alert('Error', 'Failed to withdraw. Please try again.');
            }
          }
        }
      ]
    );
  }, [amount, selectedMethod, walletBalance, paymentMethods, user?.id]);

  const handleCheckout = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please login to checkout');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Pay UGX ${total.toLocaleString()} for ${cartItems.length} item(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            try {
              const { data, error } = await supabaseAny
                .rpc('process_payment', {
                  p_amount: total,
                  p_pin: '1234',
                  p_shop_id: cartItems[0]?.shop_id || '',
                  p_user_id: user.id,
                });

              if (error) {
                Alert.alert('Error', 'Payment failed. Please try again.');
                return;
              }

              setCartItems([]);
              setShowCheckout(false);
              Alert.alert('Success', 'Payment completed successfully!');
            } catch (error) {
              console.error('Error processing payment:', error);
              Alert.alert('Error', 'Payment failed. Please try again.');
            }
          }
        }
      ]
    );
  }, [cartItems, total, selectedMethod, user?.id]);

  // --- Cart Actions ---
  const handleRemoveItem = async (id: string) => {
    const removedItem = cartItems.find(item => item.id === id);
    setCartItems(prev => prev.filter(item => item.id !== id));

    try {
      const { error } = await supabaseAny
        .from('user_interactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing item:', error);
        if (removedItem) setCartItems(prev => [...prev, removedItem]);
        Alert.alert('Error', 'Failed to remove item from cart');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      if (removedItem) setCartItems(prev => [...prev, removedItem]);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  const handleUpdateQuantity = useCallback(async (id: string, quantity: number) => {
    const originalItem = cartItems.find(i => i.id === id);
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );

    try {
      const item = cartItems.find(i => i.id === id);
      if (!item) return;

      const { error } = await supabaseAny
        .from('user_interactions')
        .update({
          metadata: { ...item, quantity, updated_at: new Date().toISOString() },
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating quantity:', error);
        if (originalItem) {
          setCartItems(prev =>
            prev.map(item => item.id === id ? originalItem : item)
          );
        }
        Alert.alert('Error', 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      if (originalItem) {
        setCartItems(prev =>
          prev.map(item => item.id === id ? originalItem : item)
        );
      }
      Alert.alert('Error', 'Failed to update quantity');
    }
  }, [cartItems]);

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
            const cancelledBooking = bookings.find(b => b.id === id);
            setBookings(prev => prev.filter(item => item.id !== id));

            try {
              const { error } = await supabaseAny
                .from('user_interactions')
                .update({
                  metadata: { ...cancelledBooking?.metadata, status: 'Cancelled', cancelled_at: new Date().toISOString() },
                  updated_at: new Date().toISOString()
                })
                .eq('id', id);

              if (error) {
                if (cancelledBooking) setBookings(prev => [...prev, cancelledBooking]);
                Alert.alert('Error', 'Failed to cancel booking');
              }
            } catch (error) {
              if (cancelledBooking) setBookings(prev => [...prev, cancelledBooking]);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          }
        }
      ]
    );
  };

  const handleRemoveFromWishlist = useCallback(async (itemId: string) => {
    const removedItem = wishlistItems.find(item => item.id === itemId);
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));

    try {
      const { data: interactions } = await supabaseAny
        .from('user_interactions')
        .select('id')
        .eq('user_id', user?.id)
        .eq('item_id', itemId)
        .eq('action', 'save')
        .single();

      if (interactions) {
        const { error } = await supabaseAny
          .from('user_interactions')
          .delete()
          .eq('id', interactions.id);

        if (error) {
          if (removedItem) setWishlistItems(prev => [...prev, removedItem]);
          Alert.alert('Error', 'Failed to remove from wishlist');
        }
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      if (removedItem) setWishlistItems(prev => [...prev, removedItem]);
    }
  }, [wishlistItems, user?.id]);

  // --- Filtered Transactions ---
  const filteredTransactions = useMemo(() => {
    if (selectedFilter === 'All') return transactions;
    return transactions.filter(t => {
      switch (selectedFilter) {
        case 'Payments': return t.type === 'payment';
        case 'Top Ups': return t.type === 'topup';
        case 'Refunds': return t.type === 'refund';
        case 'Withdrawals': return t.type === 'withdrawal';
        default: return true;
      }
    });
  }, [transactions, selectedFilter]);

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================

  // Render Hub Tabs Content
  const renderHubTabContent = () => {
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
                  />
                ))}
                <TouchableOpacity 
                  style={styles.viewCheckoutButton}
                  onPress={() => setShowCheckout(true)}
                >
                  <LinearGradient
                    colors={['#4A7DFF', '#6B94FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.viewCheckoutGradient}
                  >
                    <Text style={styles.viewCheckoutText}>
                      View Checkout ({cartItems.length} items)
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
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
                renderItem={({ item }) => (
                  <WishlistItemCard 
                    item={item} 
                    onRemove={handleRemoveFromWishlist} 
                  />
                )}
                keyExtractor={(item) => item.id}
                numColumns={isDesktop ? 3 : 2}
                scrollEnabled={false}
                contentContainerStyle={styles.wishlistGrid}
              />
            )}
          </View>
        );

      default:
        return null;
    }
  };

  // Render Checkout Modal
  const renderCheckoutModal = () => (
    <Modal
      visible={showCheckout}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCheckout(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCheckout(false)}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Checkout</Text>
            <TouchableOpacity onPress={() => setShowCheckout(false)}>
              <Ionicons name="close" size={24} color="#8A8AAE" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.checkoutContent}>
            <View style={styles.checkoutSection}>
              <Text style={styles.checkoutSectionTitle}>Order Items ({cartItems.length})</Text>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  <View style={styles.orderItemImage}>
                    {item.image && (
                      <Image source={{ uri: item.image }} style={styles.orderItemImageActual} />
                    )}
                  </View>
                  <View style={styles.orderItemInfo}>
                    <Text style={styles.orderItemName}>{item.title}</Text>
                    <Text style={styles.orderItemShop}>{item.shop_name}</Text>
                    <Text style={styles.orderItemPrice}>UGX {item.price.toLocaleString()}</Text>
                  </View>
                  <Text style={styles.orderItemQty}>x{item.quantity}</Text>
                </View>
              ))}
            </View>

            <View style={styles.checkoutSection}>
              <Text style={styles.checkoutSectionTitle}>Price Summary</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal</Text>
                <Text style={styles.priceValue}>UGX {subtotal.toLocaleString()}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery Fee</Text>
                <Text style={styles.priceValue}>UGX {deliveryFee.toLocaleString()}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Wallet Savings</Text>
                <Text style={[styles.priceValue, { color: '#2ECC71' }]}>- UGX {walletSavings.toLocaleString()}</Text>
              </View>
              <View style={[styles.priceRow, styles.priceTotal]}>
                <Text style={styles.priceTotalLabel}>Total</Text>
                <Text style={styles.priceTotalValue}>UGX {total.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.checkoutSection}>
              <Text style={styles.checkoutSectionTitle}>Payment Method</Text>
              {paymentMethods.map((method) => (
                <PaymentMethodItem 
                  key={method.id} 
                  method={method} 
                  isSelected={selectedMethod === method.id}
                  onSelect={setSelectedMethod}
                />
              ))}
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>

          <View style={styles.stickyCheckoutBar}>
            <View style={styles.checkoutTotalPreview}>
              <Text style={styles.checkoutTotalLabel}>Total</Text>
              <Text style={styles.checkoutTotalAmount}>UGX {total.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.payNowButton} onPress={handleCheckout}>
              <LinearGradient
                colors={['#4A7DFF', '#6B94FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.payNowGradient}
              >
                <Text style={styles.payNowText}>Pay Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render Transactions Modal
  const renderTransactionsModal = () => (
    <Modal
      visible={showTransactions}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowTransactions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.transactionsModal]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTransactions(false)}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Transactions</Text>
            <TouchableOpacity onPress={() => setShowTransactions(false)}>
              <Ionicons name="close" size={24} color="#8A8AAE" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            {transactionFilters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  selectedFilter === filter && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === filter && styles.filterChipTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredTransactions}
            renderItem={({ item }) => <TransactionItem item={item} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.transactionsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>Your transactions will appear here</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );

  // Render Add Money Modal
  const renderAddMoneyModal = () => (
    <Modal
      visible={showAddMoney}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAddMoney(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.addMoneyModal]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Money</Text>
            <TouchableOpacity onPress={() => setShowAddMoney(false)}>
              <Ionicons name="close" size={24} color="#8A8AAE" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.addMoneyContent}>
              <Text style={styles.addMoneyLabel}>Select Amount</Text>
              <View style={styles.amountOptions}>
                {[50000, 100000, 250000, 500000, 1000000].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.amountOption, parseInt(amount) === amt && styles.amountOptionSelected]}
                    onPress={() => setAmount(amt.toString())}
                  >
                    <Text style={[styles.amountOptionText, parseInt(amount) === amt && styles.amountOptionTextSelected]}>
                      UGX {amt.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.addMoneyLabel}>Or Enter Amount</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter amount"
                placeholderTextColor="#8A8AAE"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.addMoneyLabel}>Payment Method</Text>
              {paymentMethods.slice(0, 2).map((method) => (
                <PaymentMethodItem 
                  key={method.id} 
                  method={method} 
                  isSelected={selectedMethod === method.id}
                  onSelect={setSelectedMethod}
                />
              ))}

              <TouchableOpacity style={styles.fundButton} onPress={handleAddMoney}>
                <LinearGradient
                  colors={['#4A7DFF', '#6B94FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.fundGradient}
                >
                  <Text style={styles.fundButtonText}>Add Money</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render Withdraw Modal
  const renderWithdrawModal = () => (
    <Modal
      visible={showWithdraw}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowWithdraw(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.addMoneyModal]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Withdraw</Text>
            <TouchableOpacity onPress={() => setShowWithdraw(false)}>
              <Ionicons name="close" size={24} color="#8A8AAE" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.addMoneyContent}>
              <View style={styles.withdrawBalanceInfo}>
                <Text style={styles.withdrawBalanceLabel}>Available Balance</Text>
                <Text style={styles.withdrawBalanceAmount}>UGX {walletBalance.toLocaleString()}</Text>
              </View>

              <Text style={styles.addMoneyLabel}>Amount to Withdraw</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter amount"
                placeholderTextColor="#8A8AAE"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.addMoneyLabel}>Withdraw To</Text>
              {paymentMethods.map((method) => (
                <PaymentMethodItem 
                  key={method.id} 
                  method={method} 
                  isSelected={selectedMethod === method.id}
                  onSelect={setSelectedMethod}
                />
              ))}

              <TouchableOpacity style={styles.fundButton} onPress={handleWithdraw}>
                <LinearGradient
                  colors={['#4A7DFF', '#6B94FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.fundGradient}
                >
                  <Text style={styles.fundButtonText}>Withdraw</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ============================================================
  // GUEST VIEW
  // ============================================================
  if (!isAuthenticated) {
    return (
      <View style={styles.guestContainer}>
        <Text style={styles.guestIcon}>💳</Text>
        <Text style={styles.guestTitle}>Pay securely with your Munolink Wallet</Text>
        <Text style={styles.guestSubtext}>
          Create an account to:{'\n'}
          • Checkout{'\n'}
          • Add money{'\n'}
          • View receipts{'\n'}
          • Track payments
        </Text>
        <TouchableOpacity 
          style={styles.guestButton} 
          onPress={() => navigation?.navigate('Join')}
        >
          <Text style={styles.guestButtonText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation?.navigate('Explore')}>
          <Text style={styles.guestContinueText}>Continue Browsing</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // ============================================================
  // MAIN RENDER - Unified Pay & Hub
  // ============================================================
  return (
  <SafeAreaView style={styles.container} edges={['top']}>   
     <StatusBar barStyle="light-content" backgroundColor="#1F2F5F" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pay</Text>
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A7DFF" />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['#4A7DFF', '#6B94FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>UGX {walletBalance.toLocaleString()}</Text>
            <View style={styles.balanceActions}>
              <TouchableOpacity style={styles.balanceAction} onPress={() => setShowAddMoney(true)}>
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.balanceActionText}>Add Money</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.balanceAction} onPress={() => setShowWithdraw(true)}>
                <Ionicons name="arrow-up-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.balanceActionText}>Withdraw</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.balanceAction} onPress={() => setShowTransactions(true)}>
                <Ionicons name="list-outline" size={18} color="#FFFFFF" />
                <Text style={styles.balanceActionText}>History</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* AI Suggestion Banner */}
        <AISuggestionBanner />

        {/* Payment Methods */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>Manage</Text>
            </TouchableOpacity>
          </View>
          {paymentMethods.map((method) => (
            <PaymentMethodItem 
              key={method.id} 
              method={method} 
              isSelected={selectedMethod === method.id}
              onSelect={setSelectedMethod}
            />
          ))}
        </View>

        {/* Hub Tabs */}
        <View style={styles.section}>
          <View style={styles.tabsContainer}>
            {hubTabs.map((tab) => (
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

          {renderHubTabContent()}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => setShowTransactions(true)}>
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>
          {transactions.slice(0, 3).map((item) => (
            <TransactionItem key={item.id} item={item} />
          ))}
          {transactions.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No transactions</Text>
              <Text style={styles.emptySubtext}>Your transactions will appear here</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modals */}
      {renderCheckoutModal()}
      {renderTransactionsModal()}
      {renderAddMoneyModal()}
      {renderWithdrawModal()}
    </SafeAreaView>
  );
};

// ============================================================
// EXPORT
// ============================================================

export const PayScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout 
      currentRoute="Pay" 
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      <PayContent navigation={navigation} />
    </ResponsiveLayout>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2F5F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2F5F',
  },
  loadingText: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 12,
  },
  header: {
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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
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
    padding: 16,
    paddingBottom: 40,
  },


  // Balance Card
  balanceCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  balanceGradient: {
    padding: 20,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  balanceActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  balanceAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  balanceActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },

  // AI Banner
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
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

  // Section
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionAction: {
    color: '#4A7DFF',
    fontSize: 13,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
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

  // Cart
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
  viewCheckoutButton: {
    marginTop: 8,
  },
  viewCheckoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  viewCheckoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Bookings
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

  // Wishlist
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
    position: 'relative',
  },
  wishlistRemoveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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

  // Payment Methods
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  paymentMethodItemSelected: {
    borderColor: '#4A7DFF',
    backgroundColor: 'rgba(74, 125, 255, 0.05)',
  },
  paymentMethodIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  paymentMethodContent: {
    flex: 1,
  },
  paymentMethodName: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  paymentMethodDetail: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  defaultBadgeText: {
    color: '#4A7DFF',
    fontSize: 10,
    fontWeight: '500',
  },
  paymentMethodRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8A8AAE',
  },
  paymentMethodRadioSelected: {
    borderColor: '#4A7DFF',
    backgroundColor: '#4A7DFF',
  },

  // Transactions
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIcon: {
    fontSize: 18,
  },
  transactionContent: {
    flex: 1,
  },
  transactionMerchant: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  transactionDate: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  transactionStatus: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  transactionStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  transactionReference: {
    color: '#8A8AAE',
    fontSize: 11,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A2A4F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.85,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  transactionsModal: {
    height: height * 0.9,
  },
  addMoneyModal: {
    height: height * 0.75,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Checkout
  checkoutContent: {
    paddingBottom: 100,
  },
  checkoutSection: {
    marginBottom: 16,
  },
  checkoutSectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItemImageActual: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  orderItemShop: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  orderItemPrice: {
    color: '#4A7DFF',
    fontSize: 13,
    fontWeight: '500',
  },
  orderItemQty: {
    color: '#8A8AAE',
    fontSize: 14,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  priceLabel: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  priceValue: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  priceTotal: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 8,
    marginTop: 4,
  },
  priceTotalLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  priceTotalValue: {
    color: '#4A7DFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 20,
  },
  stickyCheckoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(26, 42, 79, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  checkoutTotalPreview: {
    flex: 1,
  },
  checkoutTotalLabel: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  checkoutTotalAmount: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  payNowButton: {
    flex: 1,
  },
  payNowGradient: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  payNowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Filter Chips
  filterContainer: {
    marginBottom: 12,
  },
  filterContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.2)',
    borderColor: '#4A7DFF',
  },
  filterChipText: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: '#4A7DFF',
  },
  transactionsList: {
    paddingBottom: 20,
  },

  // Add Money / Withdraw
  addMoneyContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  addMoneyLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  amountOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  amountOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  amountOptionSelected: {
    borderColor: '#4A7DFF',
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
  },
  amountOptionText: {
    color: '#8A8AAE',
    fontSize: 14,
  },
  amountOptionTextSelected: {
    color: '#4A7DFF',
  },
  amountInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
  },
  fundButton: {
    width: '100%',
    marginTop: 8,
  },
  fundGradient: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  fundButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Withdraw
  withdrawBalanceInfo: {
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 125, 255, 0.2)',
  },
  withdrawBalanceLabel: {
    color: '#8A8AAE',
    fontSize: 12,
    marginBottom: 4,
  },
  withdrawBalanceAmount: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#8A8AAE',
    fontSize: 13,
    marginTop: 4,
  },

  // Guest
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
    marginBottom: 24,
    lineHeight: 22,
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
});