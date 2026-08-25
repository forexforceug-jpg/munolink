// src/features/pay/PayScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
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
}

// ============================================================
// LOADING SKELETON
// ============================================================

const PayScreenSkeleton = () => (
  <View style={styles.skeletonContainer}>
    {/* Balance Card Skeleton */}
    <View style={styles.skeletonBalanceCard}>
      <View style={styles.skeletonBalanceLabel} />
      <View style={styles.skeletonBalanceAmount} />
      <View style={styles.skeletonBalanceActions}>
        <View style={styles.skeletonBalanceAction} />
        <View style={styles.skeletonBalanceAction} />
        <View style={styles.skeletonBalanceAction} />
        <View style={styles.skeletonBalanceAction} />
      </View>
    </View>

    {/* Payment Methods Skeleton */}
    <View style={styles.skeletonSection}>
      <View style={styles.skeletonSectionHeader}>
        <View style={styles.skeletonSectionTitle} />
        <View style={styles.skeletonSectionAction} />
      </View>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonPaymentMethod} />
      ))}
    </View>

    {/* Quick Actions Skeleton */}
    <View style={styles.skeletonSection}>
      <View style={styles.skeletonSectionTitle} />
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.skeletonOptionCard} />
      ))}
    </View>
  </View>
);

// ============================================================
// SUB-COMPONENTS
// ============================================================

// Pay Option Card
const PayOptionCard = ({ icon, title, description, onPress, badge }: any) => (
  <TouchableOpacity style={styles.optionCard} onPress={onPress}>
    <View style={styles.optionIconContainer}>
      <Text style={styles.optionIcon}>{icon}</Text>
    </View>
    <View style={styles.optionContent}>
      <Text style={styles.optionTitle}>{title}</Text>
      <Text style={styles.optionDescription}>{description}</Text>
    </View>
    {badge && (
      <View style={styles.optionBadge}>
        <Text style={styles.optionBadgeText}>{badge}</Text>
      </View>
    )}
    <Ionicons name="chevron-forward" size={20} color="#8A8AAE" />
  </TouchableOpacity>
);

// Transaction Item
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

// Payment Method Item
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

// --- Guest Mode Component ---
const GuestPayView = ({ navigation }: any) => (
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
    <TouchableOpacity onPress={() => navigation?.navigate('Discover')}>
      <Text style={styles.guestContinueText}>Continue as Guest</Text>
    </TouchableOpacity>
  </View>
);

// ============================================================
// MAIN PAY SCREEN COMPONENT
// ============================================================

const PayContent = ({ navigation }: any) => {
  const { isAuthenticated, user } = useAuth();
  const { isDesktop } = useBreakpoint();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  
  // Cart items for checkout
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Transaction filters
  const transactionFilters = ['All', 'Payments', 'Top Ups', 'Refunds', 'Withdrawals'];

  // ============================================================
  // FETCH FUNCTIONS
  // ============================================================

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    if (!user?.id) return 0;

    try {
      const { data, error } = await supabaseAny
        .from('users')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching wallet balance:', error);
        return 0;
      }

      return data?.wallet_balance || 0;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return 0;
    }
  }, [user?.id]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabaseAny
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform to Transaction type
      return data.map((t: any) => ({
        id: t.id,
        type: t.type as Transaction['type'],
        merchant: t.shop_id || 'Munolink',
        amount: t.amount,
        date: t.created_at || new Date().toISOString(),
        status: (t.status as Transaction['status']) || 'completed',
        method: t.payment_code || 'Wallet',
        reference: t.reference,
        shop_id: t.shop_id,
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }, [user?.id]);

  // Fetch payment methods
  const fetchPaymentMethods = useCallback(async () => {
    if (!user?.id) return [];

    try {
      // Get user's phone for mobile money
      const { data: userData, error: userError } = await supabaseAny
        .from('users')
        .select('phone_number')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return [];
      }

      const methods: PaymentMethod[] = [];
      const phone = userData?.phone_number || '';

      // Add mobile money if phone exists
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

      // Check if user has wallet balance for wallet payment
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

  // Fetch cart items for checkout
  const fetchCartItems = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data: interactions, error: interactionsError } = await supabaseAny
        .from('user_interactions')
        .select('id, item_id, metadata, created_at')
        .eq('user_id', user.id)
        .eq('action', 'purchase')
        .order('created_at', { ascending: false })
        .limit(10);

      if (interactionsError || !interactions || interactions.length === 0) {
        return [];
      }

      const itemIds = interactions.map((i: any) => i.item_id);
      
      const { data: catalogItems, error: catalogError } = await supabaseAny
        .from('catalog')
        .select('*')
        .in('id', itemIds);

      if (catalogError || !catalogItems) {
        return [];
      }

      const items: CartItem[] = [];
      
      for (const interaction of interactions) {
        const item = catalogItems.find((i: any) => i.id === interaction.item_id);
        if (!item) continue;

        // Get shop info
        const { data: shopProduct } = await supabaseAny
          .from('shop_products')
          .select('shop_id, regular_price')
          .eq('catalog_id', item.id)
          .single();

        let shopName = 'Shop';
        if (shopProduct?.shop_id) {
          const { data: shop } = await supabaseAny
            .from('shops')
            .select('name')
            .eq('id', shopProduct.shop_id)
            .single();
          if (shop) shopName = shop.name;
        }

        items.push({
          id: interaction.id,
          title: item.name || 'Product',
          price: shopProduct?.regular_price || 0,
          quantity: interaction.metadata?.quantity || 1,
          image: item.images?.[0],
          shop_id: shopProduct?.shop_id || '',
          shop_name: shopName,
        });
      }

      return items;
    } catch (error) {
      console.error('Error fetching cart items:', error);
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
      const [balance, transactionsData, methods, cartData] = await Promise.all([
        fetchWalletBalance(),
        fetchTransactions(),
        fetchPaymentMethods(),
        fetchCartItems(),
      ]);

      setWalletBalance(balance);
      setTransactions(transactionsData);
      setPaymentMethods(methods);
      setCartItems(cartData);

      // Set default selected method
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
  }, [user?.id, fetchWalletBalance, fetchTransactions, fetchPaymentMethods, fetchCartItems]);

  // Auto-refresh when screen comes into focus
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

  // Initial load
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
  // CALCULATIONS
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

  // Handle Add Money
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
              // Call the process_payment function
              const { data, error } = await supabaseAny
                .rpc('process_payment', {
                  p_amount: amountNum,
                  p_pin: '1234', // In production, this should come from a PIN input
                  p_shop_id: '',
                  p_user_id: user.id,
                });

              if (error) {
                console.error('Error processing payment:', error);
                Alert.alert('Error', 'Failed to add money. Please try again.');
                return;
              }

              // Update wallet balance
              const newBalance = walletBalance + amountNum;
              setWalletBalance(newBalance);
              
              // Add to transactions
              const newTransaction: Transaction = {
                id: Date.now().toString(),
                type: 'topup',
                merchant: 'MTN Mobile Money',
                amount: amountNum,
                date: new Date().toISOString(),
                status: 'completed',
                method: 'MTN',
                reference: `TOP-${Date.now()}`,
              };
              setTransactions(prev => [newTransaction, ...prev]);

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

  // Handle Withdraw
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
              // Update wallet balance
              const newBalance = walletBalance - amountNum;
              setWalletBalance(newBalance);
              
              // Add to transactions
              const newTransaction: Transaction = {
                id: Date.now().toString(),
                type: 'withdrawal',
                merchant: paymentMethods.find(m => m.id === selectedMethod)?.name || 'Withdrawal',
                amount: -amountNum,
                date: new Date().toISOString(),
                status: 'pending',
                method: paymentMethods.find(m => m.id === selectedMethod)?.name || 'Unknown',
                reference: `WTH-${Date.now()}`,
              };
              setTransactions(prev => [newTransaction, ...prev]);

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

  // Handle Checkout
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
              // Process payment
              const { data, error } = await supabaseAny
                .rpc('process_payment', {
                  p_amount: total,
                  p_pin: '1234', // In production, this should come from a PIN input
                  p_shop_id: cartItems[0]?.shop_id || '',
                  p_user_id: user.id,
                });

              if (error) {
                console.error('Error processing payment:', error);
                Alert.alert('Error', 'Payment failed. Please try again.');
                return;
              }

              // Clear cart
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

  // Render Modal - Checkout
  const renderCheckoutModal = useCallback(() => (
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
  ), [showCheckout, cartItems, subtotal, deliveryFee, walletSavings, total, paymentMethods, selectedMethod, handleCheckout]);

  // Render Modal - Transactions
  const renderTransactionsModal = useCallback(() => (
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
  ), [showTransactions, filteredTransactions, selectedFilter, transactionFilters]);

  // Render Modal - Add Money
  const renderAddMoneyModal = useCallback(() => (
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
  ), [showAddMoney, amount, paymentMethods, selectedMethod, handleAddMoney]);

  // Render Modal - Withdraw
  const renderWithdrawModal = useCallback(() => (
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
  ), [showWithdraw, amount, walletBalance, paymentMethods, selectedMethod, handleWithdraw]);

  // ============================================================
  // MAIN RENDER
  // ============================================================

  if (!isAuthenticated) {
    return <GuestPayView navigation={navigation} />;
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDesktop && styles.desktopContainer]}>
        <PayScreenSkeleton />
      </View>
    );
  }

  // --- Desktop View ---
  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1A2A4F" />
        
        <View style={styles.desktopHeader}>
          <Text style={styles.desktopHeaderTitle}>Pay</Text>
          <Text style={styles.desktopHeaderSubtitle}>Manage your payments and wallet</Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.desktopScrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A7DFF" />
          }
        >
          <View style={styles.desktopGrid}>
            {/* Left Column */}
            <View style={styles.desktopLeftColumn}>
              {/* Balance Card */}
              <View style={styles.desktopBalanceCard}>
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
                      <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.balanceActionText}>Add Money</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.balanceAction} onPress={() => setShowWithdraw(true)}>
                      <Ionicons name="arrow-up-circle-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.balanceActionText}>Withdraw</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.balanceAction} onPress={() => setShowCheckout(true)}>
                      <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.balanceActionText}>Checkout</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.balanceAction} onPress={() => setShowTransactions(true)}>
                      <Ionicons name="list-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.balanceActionText}>History</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>

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
            </View>

            {/* Right Column */}
            <View style={styles.desktopRightColumn}>
              {/* Quick Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <PayOptionCard
                  icon="🛒"
                  title="Checkout"
                  description={`Pay for ${cartItems.length} items`}
                  onPress={() => setShowCheckout(true)}
                  badge={cartItems.length > 0 ? cartItems.length.toString() : undefined}
                />
                <PayOptionCard
                  icon="📊"
                  title="Transactions"
                  description={`${transactions.length} transactions`}
                  onPress={() => setShowTransactions(true)}
                />
                <PayOptionCard
                  icon="💳"
                  title="Payment Methods"
                  description={`${paymentMethods.length} methods available`}
                  onPress={() => Alert.alert('Payment Methods', 'Manage your payment methods')}
                />
                <PayOptionCard
                  icon="📱"
                  title="Mobile Money"
                  description="MTN, Airtel & more"
                  onPress={() => Alert.alert('Mobile Money', 'Manage mobile money accounts')}
                />
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
            </View>
          </View>
        </ScrollView>

        {/* Modals */}
        {renderCheckoutModal()}
        {renderTransactionsModal()}
        {renderAddMoneyModal()}
        {renderWithdrawModal()}
      </View>
    );
  }

  // --- Mobile View ---
  return (
    <SafeAreaView style={styles.mobileContainer}>
      <StatusBar barStyle="light-content" />

      <View style={styles.mobileHeader}>
        <Text style={styles.mobileHeaderTitle}>Pay</Text>
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
        style={styles.hubContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.hubContent}
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
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.balanceActionText}>Add Money</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.balanceAction} onPress={() => setShowWithdraw(true)}>
                <Ionicons name="arrow-up-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.balanceActionText}>Withdraw</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.balanceAction} onPress={() => setShowCheckout(true)}>
                <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
                <Text style={styles.balanceActionText}>Checkout</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.balanceAction} onPress={() => setShowTransactions(true)}>
                <Ionicons name="list-outline" size={20} color="#FFFFFF" />
                <Text style={styles.balanceActionText}>History</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

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

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <PayOptionCard
            icon="🛒"
            title="Checkout"
            description={`Pay for ${cartItems.length} items`}
            onPress={() => setShowCheckout(true)}
            badge={cartItems.length > 0 ? cartItems.length.toString() : undefined}
          />
          <PayOptionCard
            icon="📊"
            title="Transactions"
            description={`${transactions.length} transactions`}
            onPress={() => setShowTransactions(true)}
          />
          <PayOptionCard
            icon="💳"
            title="Payment Methods"
            description={`${paymentMethods.length} methods available`}
            onPress={() => Alert.alert('Payment Methods', 'Manage your payment methods')}
          />
          <PayOptionCard
            icon="📱"
            title="Mobile Money"
            description="MTN, Airtel & more"
            onPress={() => Alert.alert('Mobile Money', 'Manage mobile money accounts')}
          />
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
  // ============================================================
  // SKELETON STYLES
  // ============================================================
  skeletonContainer: {
    flex: 1,
    padding: 16,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  skeletonBalanceCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    height: 160,
  },
  skeletonBalanceLabel: {
    width: 120,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonBalanceAmount: {
    width: 200,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    marginBottom: 16,
  },
  skeletonBalanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonBalanceAction: {
    width: 80,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  skeletonSection: {
    marginBottom: 20,
  },
  skeletonSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  skeletonSectionTitle: {
    width: 120,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonSectionAction: {
    width: 60,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonPaymentMethod: {
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    marginBottom: 6,
  },
  skeletonOptionCard: {
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    marginBottom: 8,
  },

  // ============================================================
  // DESKTOP STYLES
  // ============================================================
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
  desktopScrollContent: {
    paddingBottom: 40,
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: 24,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  desktopLeftColumn: {
    flex: 1,
    minWidth: 300,
    maxWidth: 450,
  },
  desktopRightColumn: {
    flex: 2,
    minWidth: 400,
  },
  desktopBalanceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },

  // ============================================================
  // MOBILE STYLES
  // ============================================================
  mobileContainer: {
    flex: 1,
    backgroundColor: '#1F2F5F',
  },
  mobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(31, 47, 95, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  mobileHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 28,
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

  // ============================================================
  // SHARED STYLES
  // ============================================================
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2F5F',
  },

  // Guest Mode
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

  // Hub
  hubContainer: {
    flex: 1,
  },
  hubContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Balance Card
  balanceCard: {
    marginBottom: 20,
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  balanceActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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

  // Option Card
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionIcon: {
    fontSize: 22,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  optionDescription: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  optionBadge: {
    backgroundColor: '#4A7DFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  optionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Transaction Item
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

  // Payment Method
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

  // Modal
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
    height: 80,
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
  addMoneyModal: {
    height: height * 0.75,
  },
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
});