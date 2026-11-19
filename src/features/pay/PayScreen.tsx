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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { randomUUID } from 'expo-crypto';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useSidebarSearch } from '../search/useSidebarSearch';
import { backendData } from '../../lib/backendData';
import { paymentsApi } from '../../lib/payments';
import { StyledAlert } from '../feed/components/StyledAlert';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// ============================================================
// TYPES
// ============================================================

interface PaymentRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  reason: string | null;
  status: 'pending' | 'accepted' | 'locked' | 'completed' | 'cancelled' | 'disputed';
  is_request: boolean;
  transaction_id: string | null;
  message_id: string | null;
  created_at: string;
  accepted_at: string | null;
  locked_at: string | null;
  completed_at: string | null;
  from_user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  to_user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface Transaction {
  id: string;
  type: 'payment' | 'topup' | 'refund' | 'withdrawal' | 'transfer';
  merchant: string;
  amount: number;
  date: string;
  status: 'pending' | 'locked' | 'completed' | 'disputed' | 'cancelled' | 'refunded';
  method: string;
  reference?: string;
  user_id?: string;
  buyer_id?: string;
  seller_id?: string;
  locked_amount?: number;
  confirmed_at?: string;
  disputed_at?: string;
  dispute_reason?: string;
  released_at?: string;
  admin_confirmed_at?: string;
  payment_request_id?: string;
  is_request?: boolean;
  reason?: string;
  locked_at?: string | null;
  is_me_seller?: boolean;
  is_me_buyer?: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type: 'mobile_money' | 'card' | 'bank' | 'wallet';
  default: boolean;
  details?: {
    phone?: string;
    last4?: string;
    bankName?: string;
    accountNumber?: string;
  };
}

interface CheckoutParams {
  sellerId: string;
  sellerName: string;
  title: string;
  unitPrice: number;
  currency: string;
  priceType: string;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

const TransactionItem = ({ item }: { item: Transaction }) => {
  const isIncoming = item.amount > 0;
  const statusColors: Record<string, string> = {
    completed: '#2ECC71',
    pending: '#F1C40F',
    locked: '#4A7DFF',
    failed: '#E74C3C',
    disputed: '#E74C3C',
    cancelled: '#95A5A6',
    refunded: '#3498DB',
  };

  const statusLabels: Record<string, string> = {
    completed: 'Completed',
    pending: 'Pending',
    locked: 'In progress',
    failed: 'Failed',
    disputed: 'Disputed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };

  return (
    <View style={styles.transactionItem}>
      <View
        style={[
          styles.transactionIconContainer,
          {
            backgroundColor: isIncoming
              ? 'rgba(46, 204, 113, 0.1)'
              : 'rgba(231, 76, 60, 0.1)',
          },
        ]}
      >
        <Ionicons
          name={isIncoming ? 'arrow-down-outline' : 'arrow-up-outline'}
          size={18}
          color={isIncoming ? '#79B895' : '#C97A7A'}
        />
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
              minute: '2-digit',
            })}
          </Text>
          <View
            style={[
              styles.transactionStatus,
              { backgroundColor: (statusColors[item.status] || '#8A8AAE') + '20' },
            ]}
          >
            <Text
              style={[
                styles.transactionStatusText,
                { color: statusColors[item.status] || '#8A8AAE' },
              ]}
            >
              {statusLabels[item.status] || item.status}
            </Text>
          </View>
        </View>
        {item.reference && (
          <Text style={styles.transactionReference}>Ref: {item.reference}</Text>
        )}
      </View>
      <Text style={[styles.transactionAmount, { color: isIncoming ? '#2ECC71' : '#E74C3C' }]}>
        {isIncoming ? '+' : ''}
        {item.amount.toLocaleString()} UGX
      </Text>
    </View>
  );
};

// ============================================================
// PENDING TRANSACTION CARD
// ============================================================

const PendingTransactionCard = ({
  transaction,
  onConfirm,
  onDispute,
  onActivate,
  isSeller,
  isBuyer,
  timeRemaining,
}: any) => {
  const isLocked = transaction.status === 'locked';
  const isPending = transaction.status === 'pending';
  const isDisputed = transaction.status === 'disputed';
  const isCompleted = transaction.status === 'completed';

  const canConfirm = isLocked && isBuyer;
  const canActivate = isLocked && isSeller && timeRemaining <= 0;
  const canDispute = isLocked && isBuyer && !isDisputed;

  const showSellerWaiting = isLocked && isSeller && timeRemaining > 0;
  const showBuyerPendingConfirm = isLocked && isBuyer;

  return (
    <View style={[styles.pendingCard, isDisputed && styles.pendingCardDisputed]}>
      <View style={styles.pendingCardHeader}>
        <View style={styles.pendingCardIcon}>
          <Ionicons
            name={
              isDisputed
                ? 'alert-circle-outline'
                : isCompleted
                ? 'checkmark-circle-outline'
                : isLocked
                ? 'time-outline'
                : 'hourglass-outline'
            }
            size={18}
            color={isCompleted ? '#79B895' : isDisputed ? '#C97A7A' : '#AAB4C0'}
          />
        </View>
        <View style={styles.pendingCardInfo}>
          <Text style={styles.pendingCardTitle}>
            {transaction.merchant || 'Payment'}
          </Text>
          <Text style={styles.pendingCardAmount}>
            UGX {Math.abs(transaction.amount).toLocaleString()}
          </Text>
        </View>
        <View
          style={[
            styles.pendingCardStatus,
            isDisputed && styles.pendingCardStatusDisputed,
            isLocked && styles.pendingCardStatusLocked,
          ]}
        >
          <Text style={styles.pendingCardStatusText}>
            {isDisputed
              ? 'Disputed'
              : isCompleted
              ? 'Completed'
              : isLocked
              ? 'In progress'
              : isPending
              ? 'Pending'
              : transaction.status}
          </Text>
        </View>
      </View>

      <View style={styles.pendingCardBody}>
        {transaction.reference && (
          <Text style={styles.pendingCardReference}>Ref: {transaction.reference}</Text>
        )}
        <Text style={styles.pendingCardDate}>
          {new Date(transaction.date).toLocaleDateString('en-UG', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        {transaction.reason && (
          <Text style={styles.pendingCardReason}>Reason: {transaction.reason}</Text>
        )}
        {showBuyerPendingConfirm && timeRemaining > 0 && (
          <Text style={styles.pendingCardTimer}>
            Auto-confirm in {Math.floor(timeRemaining)}h{' '}
            {Math.floor((timeRemaining % 1) * 60)}m
          </Text>
        )}
        {showSellerWaiting && (
          <Text style={styles.pendingCardTimer}>
            Buyer has {Math.floor(timeRemaining)}h{' '}
            {Math.floor((timeRemaining % 1) * 60)}m to confirm
          </Text>
        )}
        {transaction.dispute_reason && (
          <Text style={styles.pendingCardDisputeReason}>
            Dispute: {transaction.dispute_reason}
          </Text>
        )}
      </View>

      <View style={styles.pendingCardActions}>
        {canConfirm && (
          <TouchableOpacity
            style={[styles.pendingCardButton, styles.pendingCardConfirm]}
            onPress={() => onConfirm(transaction)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2ECC71', '#27AE60']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pendingCardButtonGradient}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.pendingCardButtonText}>Confirm Payment</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {canActivate && (
          <TouchableOpacity
            style={[styles.pendingCardButton, styles.pendingCardActivate]}
            onPress={() => onActivate(transaction)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F39C12', '#E67E22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pendingCardButtonGradient}
            >
              <Ionicons name="rocket-outline" size={18} color="#FFFFFF" />
              <Text style={styles.pendingCardButtonText}>Activate Payment</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {canDispute && (
          <TouchableOpacity
            style={[styles.pendingCardButton, styles.pendingCardDispute]}
            onPress={() => onDispute(transaction)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#E74C3C', '#C0392B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pendingCardButtonGradient}
            >
              <Ionicons name="alert-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.pendingCardButtonText}>Raise Dispute</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ============================================================
// PAYMENT METHOD ITEM
// ============================================================

const PaymentMethodItem = ({ method, onSelect, isSelected }: any) => (
  <TouchableOpacity
    style={[styles.paymentMethodItem, isSelected && styles.paymentMethodItemSelected]}
    onPress={() => onSelect(method.id)}
  >
    <Ionicons
      name={method.type === 'wallet' ? 'wallet-outline' : 'phone-portrait-outline'}
      size={21}
      color="#AAB4C0"
      style={styles.paymentMethodIcon}
    />
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
    <View
      style={[styles.paymentMethodRadio, isSelected && styles.paymentMethodRadioSelected]}
    />
  </TouchableOpacity>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

const PayContent = ({ navigation, route }: any) => {
  const { isAuthenticated, user } = useAuth();
  const { isDesktop } = useBreakpoint();

  // --- State ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [lockedTransactions, setLockedTransactions] = useState<Transaction[]>([]);
  const [completedTransactions, setCompletedTransactions] = useState<Transaction[]>([]);
  const [disputedTransactions, setDisputedTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutParams | null>(null);
  const [checkoutUnitPrice, setCheckoutUnitPrice] = useState('');
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'pending' | 'locked' | 'completed' | 'disputed'>(
    'pending'
  );
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [timeRemainingMap, setTimeRemainingMap] = useState<Record<string, number>>({});
  const checkoutIdempotencyKeyRef = useRef(randomUUID());
  const consumedCheckoutRef = useRef<CheckoutParams | null>(null);

  // ✅ StyledAlert state
  const [styledAlertConfig, setStyledAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: string;
    iconColor?: string;
    buttons: {
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive' | 'primary';
    }[];
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showStyledAlert = useCallback(
    (config: {
      title: string;
      message: string;
      icon?: string;
      iconColor?: string;
      buttons: {
        text: string;
        onPress: () => void;
        style?: 'default' | 'cancel' | 'destructive' | 'primary';
      }[];
    }) => {
      setStyledAlertConfig({
        visible: true,
        ...config,
      });
    },
    []
  );

  const hideStyledAlert = useCallback(() => {
    setStyledAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    const params = route?.params?.checkout as CheckoutParams | undefined;
    if (!params || consumedCheckoutRef.current === params) return;
    if (!isAuthenticated || !user?.id) return;
    consumedCheckoutRef.current = params;

    if (
      typeof params.sellerId !== 'string' ||
      typeof params.title !== 'string' ||
      !Number.isFinite(params.unitPrice) ||
      params.unitPrice <= 0
    ) {
      showStyledAlert({
        title: 'Unable to open checkout',
        message: 'This listing does not have valid purchase details.',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      navigation.setParams?.({ checkout: undefined });
      return;
    }

    setCheckout(params);
    setCheckoutUnitPrice(String(params.unitPrice));
    setCheckoutQuantity(1);
    checkoutIdempotencyKeyRef.current = randomUUID();
    setShowCheckout(true);
    navigation.setParams?.({ checkout: undefined });
  }, [
    route?.params?.checkout,
    navigation,
    isAuthenticated,
    user?.id,
    showStyledAlert,
    hideStyledAlert,
  ]);

  const transactionFilters = ['All', 'Payments', 'Top Ups', 'Refunds', 'Withdrawals'];

  // ============================================================
  // FETCH FUNCTIONS
  // ============================================================

  const fetchWalletBalance = useCallback(async () => {
    if (!user?.id) return 0;
    try {
      const { balance } = await paymentsApi.walletBalance();
      return balance;
    } catch {
      return 0;
    }
  }, [user?.id]);

  const fetchNonPaymentTransactions = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data, error } = await backendData
        .from('transactions')
        .select('*')
        .or(`user_id.eq.${user.id},buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .neq('type', 'payment')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      if (!data) return [];

      return data.map((t: any) => ({
        id: t.id,
        type: t.type || 'topup',
        merchant: t.merchant || 'Munolink',
        amount: t.amount || 0,
        date: t.created_at || new Date().toISOString(),
        status: t.status || 'pending',
        method: t.method || 'Wallet',
        reference: t.reference,
        user_id: t.user_id,
        buyer_id: t.buyer_id,
        seller_id: t.seller_id,
        locked_amount: t.locked_amount,
        confirmed_at: t.confirmed_at,
        disputed_at: t.disputed_at,
        dispute_reason: t.dispute_reason,
        released_at: t.released_at,
        admin_confirmed_at: t.admin_confirmed_at,
      })) as Transaction[];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }, [user?.id]);

  const fetchPaymentRequests = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data: requests, error: requestsError } = await backendData
        .from('payment_requests')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching payment requests:', requestsError);
        return [];
      }

      if (!requests || requests.length === 0) return [];

      const userIds = new Set<string>();
      requests.forEach((r: any) => {
        if (r.from_user_id) userIds.add(r.from_user_id);
        if (r.to_user_id) userIds.add(r.to_user_id);
      });

      let userMap: Record<
        string,
        { id: string; full_name: string; avatar_url: string | null }
      > = {};

      if (userIds.size > 0) {
        const { data: users, error: usersError } = await backendData
          .from('users')
          .select('id, full_name, avatar_url')
          .in('id', Array.from(userIds));

        if (!usersError && users) {
          users.forEach((u: any) => {
            userMap[u.id] = {
              id: u.id,
              full_name: u.full_name || 'User',
              avatar_url: u.avatar_url || null,
            };
          });
        }
      }

      return requests.map((r: any) => ({
        ...r,
        from_user: userMap[r.from_user_id] || {
          id: r.from_user_id,
          full_name: 'User',
          avatar_url: null,
        },
        to_user: userMap[r.to_user_id] || {
          id: r.to_user_id,
          full_name: 'User',
          avatar_url: null,
        },
      }));
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      return [];
    }
  }, [user?.id]);

  const fetchPaymentMethods = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data: userData, error: userError } = await backendData
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
          icon: 'phone-portrait-outline',
          type: 'mobile_money',
          default: true,
          details: { phone },
        });
        methods.push({
          id: 'airtel',
          name: 'Airtel Money',
          icon: 'phone-portrait-outline',
          type: 'mobile_money',
          default: false,
          details: { phone },
        });
      }

      methods.push({
        id: 'wallet',
        name: 'Munolink Wallet',
        icon: 'wallet-outline',
        type: 'wallet',
        default: phone ? false : true,
      });

      return methods;
    } catch {
      return [];
    }
  }, [user?.id]);

  // ============================================================
  // LOAD ALL DATA
  // ============================================================

  const loadAllData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [balance, nonPaymentTxs, paymentRequestsData, methods] = await Promise.all([
        fetchWalletBalance(),
        fetchNonPaymentTransactions(),
        fetchPaymentRequests(),
        fetchPaymentMethods(),
      ]);

      setWalletBalance(balance);
      setPaymentMethods(methods);

      const defaultMethod = methods.find((m) => m.default);
      if (defaultMethod) {
        setSelectedMethod(defaultMethod.id);
      } else if (methods.length > 0) {
        setSelectedMethod(methods[0].id);
      }

      const pending: Transaction[] = [];
      const locked: Transaction[] = [];
      const completed: Transaction[] = [];
      const disputed: Transaction[] = [];

      paymentRequestsData.forEach((pr: PaymentRequest) => {
        const isFromMe = pr.from_user_id === user.id;
        const isToMe = pr.to_user_id === user.id;

        const merchant = isFromMe
          ? pr.to_user?.full_name || 'User'
          : pr.from_user?.full_name || 'User';

        let buyerId: string;
        let sellerId: string;
        if (pr.is_request) {
          buyerId = pr.to_user_id;
          sellerId = pr.from_user_id;
        } else {
          buyerId = pr.from_user_id;
          sellerId = pr.to_user_id;
        }

        const isMeBuyer = buyerId === user.id;
        const isMeSeller = sellerId === user.id;

        const tx: Transaction = {
          id: pr.id,
          type: 'payment',
          merchant,
          amount: isMeBuyer ? -pr.amount : pr.amount,
          date: pr.created_at,
          status: pr.status as any,
          method: 'Wallet',
          reference: `PAY-${pr.id.slice(0, 8)}`,
          user_id: user.id,
          buyer_id: buyerId,
          seller_id: sellerId,
          locked_amount:
            pr.status === 'locked' || pr.status === 'accepted' ? pr.amount : 0,
          confirmed_at: pr.completed_at || undefined,
          dispute_reason: pr.status === 'disputed' ? 'Disputed' : undefined,
          payment_request_id: pr.id,
          is_request: pr.is_request,
          reason: pr.reason || undefined,
          locked_at: pr.locked_at || pr.accepted_at || null,
          is_me_buyer: isMeBuyer,
          is_me_seller: isMeSeller,
        };

        switch (pr.status) {
          case 'pending':
            pending.push(tx);
            break;
          case 'accepted':
          case 'locked':
            locked.push(tx);
            break;
          case 'completed':
            completed.push(tx);
            break;
          case 'disputed':
            disputed.push(tx);
            break;
          default:
            break;
        }
      });

      nonPaymentTxs.forEach((t) => {
        switch (t.status) {
          case 'pending':
            pending.push(t);
            break;
          case 'locked':
            locked.push(t);
            break;
          case 'completed':
            completed.push(t);
            break;
          case 'disputed':
            disputed.push(t);
            break;
          default:
            break;
        }
      });

      setPendingTransactions(pending);
      setLockedTransactions(locked);
      setCompletedTransactions(completed);
      setDisputedTransactions(disputed);
      setTransactions([...pending, ...locked, ...completed, ...disputed]);
    } catch (error) {
      console.error('Error loading pay data:', error);
    } finally {
      setLoading(false);
    }
  }, [
    user?.id,
    fetchWalletBalance,
    fetchNonPaymentTransactions,
    fetchPaymentRequests,
    fetchPaymentMethods,
  ]);

  // --- Auto-refresh on focus ---
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

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadAllData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, loadAllData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [loadAllData]);

  useEffect(() => {
    const computeRemaining = () => {
      const newMap: Record<string, number> = {};
      lockedTransactions.forEach((t) => {
        const basis = t.locked_at || t.date;
        const lockedAt = new Date(basis).getTime();
        const now = Date.now();
        const msRemaining = 24 * 60 * 60 * 1000 - (now - lockedAt);
        newMap[t.id] = Math.max(0, msRemaining / (60 * 60 * 1000));
      });
      setTimeRemainingMap(newMap);
    };

    computeRemaining();
    const interval = setInterval(computeRemaining, 60 * 1000);
    return () => clearInterval(interval);
  }, [lockedTransactions]);

  // ============================================================
  // ACTION HANDLERS
  // ============================================================

  const handleConfirmPayment = useCallback(
    async (transaction: Transaction) => {
      showStyledAlert({
        title: 'Confirm Payment',
        message:
          `You are about to confirm payment of UGX ${Math.abs(transaction.amount).toLocaleString()}\n\n` +
          `To: ${transaction.merchant || 'Seller'}\n\n` +
          `This action is irreversible. Only confirm if you have received the product/service.`,
        icon: 'checkmark-circle-outline',
        iconColor: '#2ECC71',
        buttons: [
          { text: 'Cancel', style: 'cancel', onPress: hideStyledAlert },
          {
            text: 'Confirm',
            style: 'primary',
            onPress: async () => {
              hideStyledAlert();
              try {
                await paymentsApi.complete(transaction.id);

                showStyledAlert({
                  title: 'Success',
                  message: 'Payment confirmed successfully!',
                  icon: 'checkmark-circle-outline',
                  iconColor: '#2ECC71',
                  buttons: [
                    { text: 'OK', style: 'primary', onPress: hideStyledAlert },
                  ],
                });
                loadAllData();
              } catch (error) {
                console.error('Error confirming payment:', error);
                showStyledAlert({
                  title: 'Error',
                  message: 'Failed to confirm payment. Please try again.',
                  icon: 'alert-circle-outline',
                  iconColor: '#E74C3C',
                  buttons: [
                    { text: 'OK', style: 'primary', onPress: hideStyledAlert },
                  ],
                });
              }
            },
          },
        ],
      });
    },
    [loadAllData, showStyledAlert, hideStyledAlert]
  );

  const handleActivatePayment = useCallback(
    async (transaction: Transaction) => {
      showStyledAlert({
        title: 'Activate Payment',
        message:
          `You are about to activate payment of UGX ${Math.abs(transaction.amount).toLocaleString()}\n\n` +
          `From: ${transaction.merchant || 'Buyer'}\n\n` +
          `This action will release the locked funds to your wallet. Only do this if the buyer has not confirmed within 24 hours.`,
        icon: 'rocket-outline',
        iconColor: '#F39C12',
        buttons: [
          { text: 'Cancel', style: 'cancel', onPress: hideStyledAlert },
          {
            text: 'Activate',
            style: 'primary',
            onPress: async () => {
              hideStyledAlert();
              try {
                await paymentsApi.release(transaction.id);

                showStyledAlert({
                  title: 'Success',
                  message: 'Payment activated and funds released to your wallet!',
                  icon: 'checkmark-circle-outline',
                  iconColor: '#2ECC71',
                  buttons: [
                    { text: 'OK', style: 'primary', onPress: hideStyledAlert },
                  ],
                });
                loadAllData();
              } catch (error) {
                console.error('Error activating payment:', error);
                showStyledAlert({
                  title: 'Error',
                  message: 'Failed to activate payment. Please try again.',
                  icon: 'alert-circle-outline',
                  iconColor: '#E74C3C',
                  buttons: [
                    { text: 'OK', style: 'primary', onPress: hideStyledAlert },
                  ],
                });
              }
            },
          },
        ],
      });
    },
    [loadAllData, showStyledAlert, hideStyledAlert]
  );

  const handleRaiseDispute = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDisputeReason('');
    setShowDisputeModal(true);
  }, []);

  const submitDispute = useCallback(async () => {
    if (!selectedTransaction || !disputeReason.trim()) {
      showStyledAlert({
        title: 'Error',
        message: 'Please provide a reason for the dispute',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }

    try {
      await paymentsApi.dispute(selectedTransaction.id, disputeReason.trim());

      showStyledAlert({
        title: 'Dispute Raised',
        message: 'Your dispute has been submitted. An admin will review it shortly.',
        icon: 'alert-circle-outline',
        iconColor: '#F39C12',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      setShowDisputeModal(false);
      setSelectedTransaction(null);
      setDisputeReason('');
      loadAllData();
    } catch (error) {
      console.error('Error raising dispute:', error);
      showStyledAlert({
        title: 'Error',
        message: 'Failed to raise dispute. Please try again.',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
    }
  }, [
    selectedTransaction,
    disputeReason,
    loadAllData,
    showStyledAlert,
    hideStyledAlert,
  ]);

  const handleAddMoney = useCallback(async () => {
    if (!user?.id) {
      showStyledAlert({
        title: 'Login Required',
        message: 'Please login to add money',
        icon: 'lock-closed-outline',
        iconColor: '#4A7DFF',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }

    const amountNum = parseInt(amount);
    if (!amountNum || amountNum <= 0) {
      showStyledAlert({
        title: 'Invalid Amount',
        message: 'Please enter a valid amount',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }

    if (!selectedMethod) {
      showStyledAlert({
        title: 'Payment Method',
        message: 'Please select a payment method',
        icon: 'card-outline',
        iconColor: '#4A7DFF',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }

    showStyledAlert({
      title: 'Confirm Add Money',
      message:
        `Add UGX ${amountNum.toLocaleString()} to your wallet?\n\n` +
        `From: ${paymentMethods.find((m) => m.id === selectedMethod)?.name || 'Unknown'}\n` +
        `New Balance: UGX ${(walletBalance + amountNum).toLocaleString()}`,
      icon: 'wallet-outline',
      iconColor: '#2ECC71',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: hideStyledAlert },
        {
          text: 'Confirm',
          style: 'primary',
          onPress: async () => {
            hideStyledAlert();
            try {
              const method =
                paymentMethods.find((m) => m.id === selectedMethod)?.name ||
                'Unknown';
              const result = await paymentsApi.topUp(amountNum, method);
              if (typeof result.balance !== 'number') {
                throw new Error('Backend did not return the updated wallet balance.');
              }

              setWalletBalance(result.balance);
              setAmount('');
              setShowAddMoney(false);
              showStyledAlert({
                title: 'Success',
                message: `UGX ${amountNum.toLocaleString()} added successfully!`,
                icon: 'checkmark-circle-outline',
                iconColor: '#2ECC71',
                buttons: [
                  { text: 'OK', style: 'primary', onPress: hideStyledAlert },
                ],
              });
              loadAllData();
            } catch (error) {
              console.error('Error adding money:', error);
              showStyledAlert({
                title: 'Error',
                message:
                  error instanceof Error
                    ? error.message
                    : 'Failed to add money. Please try again.',
                icon: 'alert-circle-outline',
                iconColor: '#E74C3C',
                buttons: [
                  { text: 'OK', style: 'primary', onPress: hideStyledAlert },
                ],
              });
            }
          },
        },
      ],
    });
  }, [
    amount,
    selectedMethod,
    user?.id,
    walletBalance,
    paymentMethods,
    loadAllData,
    showStyledAlert,
    hideStyledAlert,
  ]);

  const handleWithdraw = useCallback(async () => {
    if (!user?.id) {
      showStyledAlert({
        title: 'Login Required',
        message: 'Please login to withdraw',
        icon: 'lock-closed-outline',
        iconColor: '#4A7DFF',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }

    const amountNum = parseInt(amount);
    if (!amountNum || amountNum <= 0) {
      showStyledAlert({
        title: 'Invalid Amount',
        message: 'Please enter a valid amount',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }
    if (amountNum > walletBalance) {
      showStyledAlert({
        title: 'Insufficient Balance',
        message: `Your balance is UGX ${walletBalance.toLocaleString()}`,
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }
    if (!selectedMethod) {
      showStyledAlert({
        title: 'Withdrawal Method',
        message: 'Please select a withdrawal method',
        icon: 'card-outline',
        iconColor: '#4A7DFF',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }

    showStyledAlert({
      title: 'Confirm Withdrawal',
      message:
        `Withdraw UGX ${amountNum.toLocaleString()} to ${
          paymentMethods.find((m) => m.id === selectedMethod)?.name
        }?\n\n` +
        `New Balance: UGX ${(walletBalance - amountNum).toLocaleString()}`,
      icon: 'arrow-up-circle-outline',
      iconColor: '#4A7DFF',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: hideStyledAlert },
        {
          text: 'Confirm',
          style: 'primary',
          onPress: async () => {
            hideStyledAlert();
            try {
              const method =
                paymentMethods.find((m) => m.id === selectedMethod)?.name ||
                'Unknown';
              const result = await paymentsApi.withdraw(amountNum, method);
              if (typeof result.balance !== 'number') {
                throw new Error('Backend did not return the updated wallet balance.');
              }

              setWalletBalance(result.balance);
              setAmount('');
              setShowWithdraw(false);
              showStyledAlert({
                title: 'Success',
                message: `UGX ${amountNum.toLocaleString()} withdrawal initiated!`,
                icon: 'checkmark-circle-outline',
                iconColor: '#2ECC71',
                buttons: [
                  { text: 'OK', style: 'primary', onPress: hideStyledAlert },
                ],
              });
              loadAllData();
            } catch (error) {
              console.error('Error withdrawing:', error);
              showStyledAlert({
                title: 'Error',
                message:
                  error instanceof Error
                    ? error.message
                    : 'Failed to withdraw. Please try again.',
                icon: 'alert-circle-outline',
                iconColor: '#E74C3C',
                buttons: [
                  { text: 'OK', style: 'primary', onPress: hideStyledAlert },
                ],
              });
            }
          },
        },
      ],
    });
  }, [
    amount,
    selectedMethod,
    walletBalance,
    paymentMethods,
    user?.id,
    loadAllData,
    showStyledAlert,
    hideStyledAlert,
  ]);

  const handleCheckout = useCallback(() => {
    if (checkoutSubmitting || !checkout || !user?.id) return;
    if (checkout.sellerId === user.id) {
      showStyledAlert({
        title: 'This is your listing',
        message: 'You cannot purchase your own listing.',
        icon: 'information-circle-outline',
        iconColor: '#AAB4C0',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }
    const unitPrice = Number(checkoutUnitPrice);
    const quantity = checkoutQuantity;
    const canChangePrice = checkout.priceType === 'negotiable';
    const payableUnitPrice = canChangePrice
      ? unitPrice
      : checkout.unitPrice;

    if (
      !Number.isFinite(payableUnitPrice) ||
      payableUnitPrice <= 0 ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      showStyledAlert({
        title: 'Check the order details',
        message: 'Enter a valid unit price and quantity before continuing.',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }

    const total = payableUnitPrice * quantity;
    if (!Number.isFinite(total) || total > Number.MAX_SAFE_INTEGER) {
      showStyledAlert({
        title: 'Invalid total',
        message: 'Reduce the quantity or unit price and try again.',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }
    if (total > walletBalance) {
      showStyledAlert({
        title: 'Insufficient wallet balance',
        message: `Your wallet has UGX ${walletBalance.toLocaleString()}. Add funds or adjust the order to continue.`,
        icon: 'wallet-outline',
        iconColor: '#E74C3C',
        buttons: [
          { text: 'Cancel', style: 'cancel', onPress: hideStyledAlert },
          {
            text: 'Add money',
            style: 'primary',
            onPress: () => {
              hideStyledAlert();
              setShowCheckout(false);
              setShowAddMoney(true);
            },
          },
        ],
      });
      return;
    }

    showStyledAlert({
      title: 'Confirm checkout',
      message:
        `Pay UGX ${total.toLocaleString()} directly to ${checkout.sellerName || 'the seller'}?\n\n` +
        `${checkout.title} · ${quantity} × UGX ${payableUnitPrice.toLocaleString()}`,
      icon: 'wallet-outline',
      iconColor: '#4A7DFF',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: hideStyledAlert },
        {
          text: 'Pay now',
          style: 'primary',
          onPress: async () => {
            hideStyledAlert();
            setCheckoutSubmitting(true);
            try {
              const result = await paymentsApi.transfer({
                toUserId: checkout.sellerId,
                amount: total,
                reason: checkout.title,
                idempotencyKey: checkoutIdempotencyKeyRef.current,
              });
              if (!result.payment || !result.transaction || typeof result.balance !== 'number') {
                throw new Error('The payment service did not return a completed transfer.');
              }
              if (
                typeof result.payment.id !== 'string' ||
                typeof result.transaction.id !== 'string'
              ) {
                throw new Error('The payment service returned an invalid transaction record.');
              }

              setWalletBalance(result.balance);
              const paymentId = result.payment.id;
              const completedTransaction: Transaction = {
                id: paymentId,
                type: 'payment',
                merchant: checkout.sellerName || 'Seller',
                amount: -total,
                date: new Date().toISOString(),
                status: 'completed',
                method: 'Wallet',
                reference: `PAY-${paymentId.slice(0, 8)}`,
                user_id: user.id,
                buyer_id: user.id,
                seller_id: checkout.sellerId,
                payment_request_id: paymentId,
                is_me_buyer: true,
              };
              setCompletedTransactions((current) => [completedTransaction, ...current]);
              setTransactions((current) => [completedTransaction, ...current]);
              setShowCheckout(false);
              setCheckoutQuantity(1);
              checkoutIdempotencyKeyRef.current = randomUUID();
              showStyledAlert({
                title: 'Payment sent',
                message: `UGX ${total.toLocaleString()} was transferred to ${checkout.sellerName || 'the seller'}.`,
                icon: 'checkmark-circle-outline',
                iconColor: '#2ECC71',
                buttons: [{ text: 'Done', style: 'primary', onPress: hideStyledAlert }],
              });
            } catch (error) {
              console.error('Error completing checkout:', error);
              showStyledAlert({
                title: 'Payment failed',
                message: error instanceof Error ? error.message : 'Please try again.',
                icon: 'alert-circle-outline',
                iconColor: '#E74C3C',
                buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
              });
            } finally {
              setCheckoutSubmitting(false);
            }
          },
        },
      ],
    });
  }, [
    checkoutSubmitting,
    checkout,
    user?.id,
    checkoutUnitPrice,
    checkoutQuantity,
    walletBalance,
    showStyledAlert,
    hideStyledAlert,
  ]);

  const filteredTransactions = useMemo(() => {
    if (selectedFilter === 'All') return transactions;
    return transactions.filter((t) => {
      switch (selectedFilter) {
        case 'Payments':
          return t.type === 'payment';
        case 'Top Ups':
          return t.type === 'topup';
        case 'Refunds':
          return t.type === 'refund';
        case 'Withdrawals':
          return t.type === 'withdrawal';
        default:
          return true;
      }
    });
  }, [transactions, selectedFilter]);

  const getTabData = useCallback(() => {
    switch (activeTab) {
      case 'pending':
        return pendingTransactions;
      case 'locked':
        return lockedTransactions;
      case 'completed':
        return completedTransactions;
      case 'disputed':
        return disputedTransactions;
      default:
        return [];
    }
  }, [
    activeTab,
    pendingTransactions,
    lockedTransactions,
    completedTransactions,
    disputedTransactions,
  ]);

  const currentTabData = getTabData();

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================

  const renderCheckoutModal = () => {
    const unitPrice = Number(checkoutUnitPrice) || 0;
    const total = unitPrice * checkoutQuantity;
    const canChangePrice = checkout?.priceType === 'negotiable';

    return (
      <Modal
        visible={showCheckout}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!checkoutSubmitting) setShowCheckout(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.checkoutModal]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Checkout</Text>
                <Text style={styles.checkoutSubtitle}>Pay directly from your Munolink Wallet</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCheckout(false)}
                disabled={checkoutSubmitting}
                accessibilityLabel="Close checkout"
              >
                <Ionicons name="close" size={24} color="#AAB4C0" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.checkoutContent}
            >
              <View style={styles.checkoutListing}>
                <View style={styles.checkoutListingIcon}>
                  <Ionicons name="bag-handle-outline" size={21} color="#D6DCE3" />
                </View>
                <View style={styles.checkoutListingDetails}>
                  <Text style={styles.checkoutListingTitle} numberOfLines={2}>
                    {checkout?.title || 'Listing'}
                  </Text>
                  <Text style={styles.checkoutSeller}>
                    Sold by {checkout?.sellerName || 'Seller'}
                  </Text>
                </View>
              </View>

              <Text style={styles.checkoutLabel}>Unit price</Text>
              <View style={styles.checkoutInputWrap}>
                <Text style={styles.checkoutCurrency}>UGX</Text>
                <TextInput
                  style={[
                    styles.checkoutInput,
                    !canChangePrice && styles.checkoutInputReadOnly,
                  ]}
                  value={checkoutUnitPrice}
                  onChangeText={setCheckoutUnitPrice}
                  editable={canChangePrice}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#8F98A3"
                />
              </View>
              {canChangePrice && (
                <Text style={styles.checkoutHint}>
                  This seller accepts offers. You can adjust the unit price.
                </Text>
              )}

              <Text style={[styles.checkoutLabel, styles.checkoutQuantityLabel]}>
                Quantity
              </Text>
              <View style={styles.checkoutQuantityRow}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setCheckoutQuantity((value) => Math.max(1, value - 1))}
                  accessibilityLabel="Decrease quantity"
                >
                  <Ionicons name="remove" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  value={String(checkoutQuantity)}
                  onChangeText={(value) => {
                    if (!/^\d*$/.test(value)) return;
                    setCheckoutQuantity(value === '' ? 1 : Math.max(1, Number(value)));
                  }}
                  keyboardType="number-pad"
                  accessibilityLabel="Quantity"
                />
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setCheckoutQuantity((value) => value + 1)}
                  accessibilityLabel="Increase quantity"
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.checkoutSummary}>
                <View style={styles.checkoutSummaryRow}>
                  <Text style={styles.checkoutSummaryLabel}>Available balance</Text>
                  <Text style={styles.checkoutSummaryValue}>
                    UGX {walletBalance.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.checkoutDivider} />
                <View style={styles.checkoutSummaryRow}>
                  <Text style={styles.checkoutTotalLabel}>Total</Text>
                  <Text style={styles.checkoutTotalValue}>
                    UGX {total.toLocaleString()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.fundButton,
                  checkoutSubmitting && styles.checkoutButtonDisabled,
                ]}
                onPress={handleCheckout}
                disabled={checkoutSubmitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#536B88', '#647D9E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.fundGradient}
                >
                  {checkoutSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
                  )}
                  <Text style={styles.fundButtonText}>
                    {checkoutSubmitting ? 'Processing...' : 'Pay from wallet'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAddMoneyModal = () => (
    <Modal
      visible={showAddMoney}
      transparent
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
                    style={[
                      styles.amountOption,
                      parseInt(amount) === amt && styles.amountOptionSelected,
                    ]}
                    onPress={() => setAmount(amt.toString())}
                  >
                    <Text
                      style={[
                        styles.amountOptionText,
                        parseInt(amount) === amt && styles.amountOptionTextSelected,
                      ]}
                    >
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
                  colors={['#27313D', '#394858']}
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

  const renderWithdrawModal = () => (
    <Modal
      visible={showWithdraw}
      transparent
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
                <Text style={styles.withdrawBalanceAmount}>
                  UGX {walletBalance.toLocaleString()}
                </Text>
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

  const renderTransactionsModal = () => (
    <Modal
      visible={showTransactions}
      transparent
      animationType="slide"
      onRequestClose={() => setShowTransactions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.transactionsModal]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTransactions(false)}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>All Transactions</Text>
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
                <Ionicons
                  name="receipt-outline"
                  size={34}
                  color="#8F98A3"
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>
                  Your transactions will appear here
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );

  const renderDisputeModal = () => (
    <Modal
      visible={showDisputeModal}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowDisputeModal(false);
        setSelectedTransaction(null);
        setDisputeReason('');
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.addMoneyModal]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Raise Dispute</Text>
            <TouchableOpacity
              onPress={() => {
                setShowDisputeModal(false);
                setSelectedTransaction(null);
                setDisputeReason('');
              }}
            >
              <Ionicons name="close" size={24} color="#8A8AAE" />
            </TouchableOpacity>
          </View>

          <View style={styles.addMoneyContent}>
            <Text style={styles.disputeInfo}>
              You are raising a dispute for payment of UGX{' '}
              {selectedTransaction?.amount?.toLocaleString() || 0}
            </Text>
            <Text style={styles.disputeInfo}>
              To: {selectedTransaction?.merchant || 'Seller'}
            </Text>

            <Text style={styles.addMoneyLabel}>Reason for Dispute *</Text>
            <TextInput
              style={[styles.amountInput, styles.disputeTextArea]}
              placeholder="Describe why you're raising this dispute..."
              placeholderTextColor="#8A8AAE"
              multiline
              numberOfLines={4}
              value={disputeReason}
              onChangeText={setDisputeReason}
            />

            <TouchableOpacity style={styles.fundButton} onPress={submitDispute}>
              <LinearGradient
                colors={['#E74C3C', '#C0392B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fundGradient}
              >
                <Text style={styles.fundButtonText}>Submit Dispute</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
        <Ionicons name="wallet-outline" size={42} color="#AAB4C0" style={styles.guestIcon} />
        <Text style={styles.guestTitle}>Pay securely with your Munolink Wallet</Text>
        <Text style={styles.guestSubtext}>
          Create an account to:{'\n'}• Checkout{'\n'}• Add money{'\n'}• View receipts{'\n'}• Track
          payments
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
  // LOADING
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
  // MAIN RENDER
  // ============================================================
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pay</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => setShowTransactions(true)}
          >
            <Ionicons name="list-outline" size={22} color="#FFFFFF" />
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
              <TouchableOpacity
                style={styles.balanceAction}
                onPress={() => setShowAddMoney(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.balanceActionText}>Add Money</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.balanceAction}
                onPress={() => setShowWithdraw(true)}
              >
                <Ionicons name="arrow-up-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.balanceActionText}>Withdraw</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.balanceAction}
                onPress={() => setShowTransactions(true)}
              >
                <Ionicons name="list-outline" size={18} color="#FFFFFF" />
                <Text style={styles.balanceActionText}>History</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions</Text>
          </View>

          <View style={styles.tabContainer}>
            {[
              { key: 'pending', label: `Pending (${pendingTransactions.length})` },
              { key: 'locked', label: `In progress (${lockedTransactions.length})` },
              { key: 'completed', label: `Completed (${completedTransactions.length})` },
              { key: 'disputed', label: `Disputed (${disputedTransactions.length})` },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {currentTabData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="receipt-outline"
                size={34}
                color="#8F98A3"
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>No {activeTab} transactions</Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'pending' && 'Your pending transactions will appear here'}
                {activeTab === 'locked' && 'Your in-progress transactions will appear here'}
                {activeTab === 'completed' && 'Your completed transactions will appear here'}
                {activeTab === 'disputed' && 'Your disputed transactions will appear here'}
              </Text>
            </View>
          ) : (
            currentTabData.map((item) => {
              const timeRemaining = timeRemainingMap[item.id] || 0;
              const isSeller = item.is_me_seller ?? item.seller_id === user?.id;
              const isBuyer = item.is_me_buyer ?? item.buyer_id === user?.id;

              return (
                <PendingTransactionCard
                  key={item.id}
                  transaction={item}
                  onConfirm={handleConfirmPayment}
                  onDispute={handleRaiseDispute}
                  onActivate={handleActivatePayment}
                  isSeller={isSeller}
                  isBuyer={isBuyer}
                  timeRemaining={timeRemaining}
                />
              );
            })
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {renderTransactionsModal()}
      {renderCheckoutModal()}
      {renderAddMoneyModal()}
      {renderWithdrawModal()}
      {renderDisputeModal()}

      {/* ✅ StyledAlert */}
      <StyledAlert
        visible={styledAlertConfig.visible}
        title={styledAlertConfig.title}
        message={styledAlertConfig.message}
        icon={styledAlertConfig.icon}
        iconColor={styledAlertConfig.iconColor}
        buttons={styledAlertConfig.buttons}
        onClose={hideStyledAlert}
      />
    </SafeAreaView>
  );
};

// ============================================================
// EXPORT
// ============================================================

export const PayScreen = ({ navigation, route }: any) => {
  const { isDesktop } = useBreakpoint();
  const {
    searchPanelOpen,
    searchPanelContent,
    onNavigate,
  } = useSidebarSearch(navigation, isDesktop);

  return (
    <ResponsiveLayout
      currentRoute={searchPanelOpen ? 'Search' : 'Pay'}
      onNavigate={onNavigate}
      searchPanelOpen={searchPanelOpen}
      searchPanelContent={searchPanelContent}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      <PayContent navigation={navigation} route={route} />
    </ResponsiveLayout>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0D',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B0D',
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
    backgroundColor: 'rgba(18,21,26,0.92)',
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
  bottomSpacer: {
    height: 20,
  },
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
  tabContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tabActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    borderColor: '#4A7DFF',
  },
  tabText: {
    color: '#8A8AAE',
    fontSize: 11,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#4A7DFF',
  },
  pendingCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pendingCardDisputed: {
    borderColor: '#E74C3C',
    backgroundColor: 'rgba(231, 76, 60, 0.05)',
  },
  pendingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pendingCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  pendingCardIconText: {
    fontSize: 16,
  },
  pendingCardInfo: {
    flex: 1,
  },
  pendingCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  pendingCardAmount: {
    color: '#4A7DFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pendingCardStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(241, 196, 15, 0.2)',
  },
  pendingCardStatusDisputed: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
  },
  pendingCardStatusLocked: {
    backgroundColor: 'rgba(74, 125, 255, 0.2)',
  },
  pendingCardStatusText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8A8AAE',
  },
  pendingCardBody: {
    marginBottom: 8,
  },
  pendingCardReference: {
    color: '#6A7A9E',
    fontSize: 11,
  },
  pendingCardDate: {
    color: '#6A7A9E',
    fontSize: 11,
    marginTop: 2,
  },
  pendingCardReason: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  pendingCardTimer: {
    color: '#F1C40F',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  pendingCardDisputeReason: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: 4,
  },
  pendingCardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pendingCardButton: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
    minWidth: '45%',
  },
  pendingCardButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  pendingCardButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  pendingCardConfirm: { flex: 2 },
  pendingCardActivate: { flex: 2 },
  pendingCardDispute: { flex: 1 },
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
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#15191F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  transactionsModal: { height: height * 0.9 },
  addMoneyModal: { height: height * 0.75 },
  checkoutModal: {
    maxHeight: height * 0.88,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
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
  checkoutSubtitle: {
    color: '#AAB4C0',
    fontSize: 12,
    marginTop: 4,
  },
  checkoutContent: {
    paddingBottom: 20,
  },
  checkoutListing: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  checkoutListingIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkoutListingDetails: {
    flex: 1,
  },
  checkoutListingTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  checkoutSeller: {
    color: '#AAB4C0',
    fontSize: 12,
    marginTop: 4,
  },
  checkoutLabel: {
    color: '#D6DCE3',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  checkoutInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    paddingHorizontal: 14,
    marginBottom: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  checkoutCurrency: {
    color: '#AAB4C0',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 10,
  },
  checkoutInput: {
    flex: 1,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  checkoutInputReadOnly: {
    color: '#C3CAD2',
  },
  checkoutHint: {
    color: '#8F98A3',
    fontSize: 11,
    marginBottom: 14,
  },
  checkoutQuantityLabel: {
    marginTop: 14,
  },
  checkoutQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 12,
  },
  quantityButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  quantityInput: {
    minWidth: 48,
    paddingVertical: 7,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkoutSummary: {
    padding: 14,
    marginTop: 20,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  checkoutSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkoutSummaryLabel: {
    color: '#AAB4C0',
    fontSize: 12,
  },
  checkoutSummaryValue: {
    color: '#D6DCE3',
    fontSize: 13,
    fontWeight: '500',
  },
  checkoutDivider: {
    height: 1,
    marginVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  checkoutTotalLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  checkoutTotalValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  checkoutButtonDisabled: {
    opacity: 0.65,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
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
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fundButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
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
  disputeInfo: {
    color: '#8A8AAE',
    fontSize: 14,
    marginBottom: 8,
  },
  disputeTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#0B0B0D',
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
});