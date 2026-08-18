// src/features/pay/PayScreen.tsx

import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const { width, height } = Dimensions.get('window');

// --- Mock Data ---
const recentTransactions = [
  { id: '1', type: 'payment', merchant: 'TechWorld Kampala', amount: -2850000, date: '2024-01-15 14:30', status: 'completed', method: 'Wallet' },
  { id: '2', type: 'topup', merchant: 'MTN Mobile Money', amount: 500000, date: '2024-01-14 09:15', status: 'completed', method: 'MTN' },
  { id: '3', type: 'payment', merchant: 'Jinja Medical Centre', amount: -150000, date: '2024-01-13 11:45', status: 'pending', method: 'Card' },
  { id: '4', type: 'refund', merchant: 'TechWorld Kampala', amount: 250000, date: '2024-01-12 16:20', status: 'completed', method: 'Wallet' },
];

const paymentMethods = [
  { id: '1', name: 'MTN Mobile Money', icon: '📱', type: 'mobile_money', default: true },
  { id: '2', name: 'Airtel Money', icon: '📱', type: 'mobile_money', default: false },
  { id: '3', name: 'Visa Card •••• 4242', icon: '💳', type: 'card', default: false },
  { id: '4', name: 'Bank Transfer - Stanbic', icon: '🏦', type: 'bank', default: false },
];

const transactionFilters = ['All', 'Payments', 'Top Ups', 'Refunds', 'Withdrawals', 'Transfers'];

// --- Sub-components ---

// Pay Option Card
const PayOptionCard = ({ icon, title, description, onPress }: any) => (
  <TouchableOpacity style={styles.optionCard} onPress={onPress}>
    <View style={styles.optionIconContainer}>
      <Text style={styles.optionIcon}>{icon}</Text>
    </View>
    <View style={styles.optionContent}>
      <Text style={styles.optionTitle}>{title}</Text>
      <Text style={styles.optionDescription}>{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#8A8AAE" />
  </TouchableOpacity>
);

// Transaction Item
const TransactionItem = ({ item }: any) => {
  const isIncoming = item.amount > 0;
  const statusColors = {
    completed: '#2ECC71',
    pending: '#F1C40F',
    failed: '#E74C3C',
  };

  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIconContainer}>
        <Text style={styles.transactionIcon}>
          {isIncoming ? '📥' : '📤'}
        </Text>
      </View>
      <View style={styles.transactionContent}>
        <Text style={styles.transactionMerchant}>{item.merchant}</Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionDate}>{item.date}</Text>
          <View style={[styles.transactionStatus, { backgroundColor: statusColors[item.status as keyof typeof statusColors] + '20' }]}>
            <Text style={[styles.transactionStatusText, { color: statusColors[item.status as keyof typeof statusColors] }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
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

// --- Desktop Pay Content ---
const DesktopPayContent = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();
  
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedMethod, setSelectedMethod] = useState('1');
  const [amount, setAmount] = useState('');
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  const walletBalance = 1250000;

  if (!isAuthenticated) {
    return <GuestPayView navigation={navigation} />;
  }

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
                  <TouchableOpacity style={styles.balanceAction}>
                    <Ionicons name="swap-horizontal-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.balanceActionText}>Send</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.balanceAction}>
                    <Ionicons name="business-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.balanceActionText}>Bank</Text>
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
                description="Pay for items and services"
                onPress={() => setShowCheckout(true)}
              />
              <PayOptionCard
                icon="📊"
                title="Transactions"
                description="View payment history"
                onPress={() => setShowTransactions(true)}
              />
              <PayOptionCard
                icon="💳"
                title="Payment Methods"
                description="Manage cards and accounts"
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
              {recentTransactions.slice(0, 3).map((item) => (
                <TransactionItem key={item.id} item={item} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderModals({ 
        showCheckout, setShowCheckout, 
        showTransactions, setShowTransactions,
        showAddMoney, setShowAddMoney,
        showWithdraw, setShowWithdraw,
        selectedMethod, setSelectedMethod,
        selectedFilter, setSelectedFilter,
        amount, setAmount,
        paymentMethods 
      })}
    </View>
  );
};

// --- Mobile Pay Content ---
const MobilePayContent = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();
  
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedMethod, setSelectedMethod] = useState('1');
  const [amount, setAmount] = useState('');
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  const walletBalance = 1250000;

  if (!isAuthenticated) {
    return <GuestPayView navigation={navigation} />;
  }

  return (
    <SafeAreaView style={styles.mobileContainer}>
      <StatusBar barStyle="light-content" />

      <View style={styles.mobileHeader}>
        <Text style={styles.mobileHeaderTitle}>Pay</Text>
      </View>

      <ScrollView 
        style={styles.hubContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.hubContent}
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
              <TouchableOpacity style={styles.balanceAction}>
                <Ionicons name="swap-horizontal-outline" size={20} color="#FFFFFF" />
                <Text style={styles.balanceActionText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.balanceAction}>
                <Ionicons name="business-outline" size={20} color="#FFFFFF" />
                <Text style={styles.balanceActionText}>Bank</Text>
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
            description="Pay for items and services"
            onPress={() => setShowCheckout(true)}
          />
          <PayOptionCard
            icon="📊"
            title="Transactions"
            description="View payment history"
            onPress={() => setShowTransactions(true)}
          />
          <PayOptionCard
            icon="💳"
            title="Payment Methods"
            description="Manage cards and accounts"
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
          {recentTransactions.slice(0, 3).map((item) => (
            <TransactionItem key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>

      {/* Modals */}
      {renderModals({ 
        showCheckout, setShowCheckout, 
        showTransactions, setShowTransactions,
        showAddMoney, setShowAddMoney,
        showWithdraw, setShowWithdraw,
        selectedMethod, setSelectedMethod,
        selectedFilter, setSelectedFilter,
        amount, setAmount,
        paymentMethods 
      })}
    </SafeAreaView>
  );
};

// --- Modal Renderer ---
const renderModals = ({ 
  showCheckout, setShowCheckout, 
  showTransactions, setShowTransactions,
  showAddMoney, setShowAddMoney,
  showWithdraw, setShowWithdraw,
  selectedMethod, setSelectedMethod,
  selectedFilter, setSelectedFilter,
  amount, setAmount,
  paymentMethods 
}: any) => (
  <>
    {renderCheckoutModal({ showCheckout, setShowCheckout, selectedMethod, setSelectedMethod, paymentMethods })}
    {renderTransactionsModal({ showTransactions, setShowTransactions, selectedFilter, setSelectedFilter })}
    {renderAddMoneyModal({ showAddMoney, setShowAddMoney, amount, setAmount })}
    {renderWithdrawModal({ showWithdraw, setShowWithdraw, selectedMethod, setSelectedMethod, amount, setAmount, paymentMethods })}
  </>
);

// --- Modal Components ---
const renderCheckoutModal = ({ showCheckout, setShowCheckout, selectedMethod, setSelectedMethod, paymentMethods }: any) => (
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
            <Text style={styles.checkoutSectionTitle}>Delivery Address</Text>
            <View style={styles.addressCard}>
              <Text style={styles.addressName}>John Doe</Text>
              <Text style={styles.addressLine}>123 Main Street, Jinja</Text>
              <Text style={styles.addressLine}>Central Region, Uganda</Text>
              <Text style={styles.addressPhone}>+256 700 000 000</Text>
            </View>
          </View>

          <View style={styles.checkoutSection}>
            <Text style={styles.checkoutSectionTitle}>Order Items</Text>
            <View style={styles.orderItem}>
              <View style={styles.orderItemImage} />
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemName}>Samsung Galaxy S25</Text>
                <Text style={styles.orderItemVariation}>128GB • Phantom Black</Text>
                <Text style={styles.orderItemPrice}>UGX 2,850,000</Text>
              </View>
              <Text style={styles.orderItemQty}>x1</Text>
            </View>
            <View style={styles.orderItem}>
              <View style={styles.orderItemImage} />
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemName}>Phone Charger Type-C</Text>
                <Text style={styles.orderItemVariation}>Original Samsung</Text>
                <Text style={styles.orderItemPrice}>UGX 45,000</Text>
              </View>
              <Text style={styles.orderItemQty}>x2</Text>
            </View>
          </View>

          <View style={styles.checkoutSection}>
            <Text style={styles.checkoutSectionTitle}>Price Summary</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>UGX 2,940,000</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Fee</Text>
              <Text style={styles.priceValue}>UGX 15,000</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Wallet Savings</Text>
              <Text style={[styles.priceValue, { color: '#2ECC71' }]}>- UGX 147,000</Text>
            </View>
            <View style={[styles.priceRow, styles.priceTotal]}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>UGX 2,808,000</Text>
            </View>
          </View>

          <View style={styles.checkoutSection}>
            <Text style={styles.checkoutSectionTitle}>Payment Method</Text>
            {paymentMethods.map((method: any) => (
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
            <Text style={styles.checkoutTotalAmount}>UGX 2,808,000</Text>
          </View>
          <TouchableOpacity style={styles.payNowButton}>
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

const renderTransactionsModal = ({ showTransactions, setShowTransactions, selectedFilter, setSelectedFilter }: any) => (
  <Modal
    visible={showTransactions}
    transparent={true}
    animationType="slide"
    onRequestClose={() => setShowTransactions(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
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
          data={recentTransactions}
          renderItem={({ item }) => <TransactionItem item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.transactionsList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  </Modal>
);

const renderAddMoneyModal = ({ showAddMoney, setShowAddMoney, amount, setAmount }: any) => (
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

          <TouchableOpacity style={styles.fundButton}>
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
      </View>
    </View>
  </Modal>
);

const renderWithdrawModal = ({ showWithdraw, setShowWithdraw, selectedMethod, setSelectedMethod, amount, setAmount, paymentMethods }: any) => (
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

        <View style={styles.addMoneyContent}>
          <Text style={styles.addMoneyLabel}>Select Destination</Text>
          {paymentMethods.map((method: any) => (
            <PaymentMethodItem 
              key={method.id} 
              method={method} 
              isSelected={selectedMethod === method.id}
              onSelect={setSelectedMethod}
            />
          ))}

          <Text style={[styles.addMoneyLabel, { marginTop: 16 }]}>Amount to Withdraw</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="Enter amount"
            placeholderTextColor="#8A8AAE"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <TouchableOpacity style={styles.fundButton}>
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
      </View>
    </View>
  </Modal>
);

// --- Main PayScreen Component ---
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
      {isDesktop ? (
        <DesktopPayContent navigation={navigation} />
      ) : (
        <MobilePayContent navigation={navigation} />
      )}
    </ResponsiveLayout>
  );
};

const styles = StyleSheet.create({
  // ============================================================
  // DESKTOP STYLES - DARK THEME
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

  // ============================================================
  // SHARED STYLES - DARK THEME
  // ============================================================
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
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodName: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  defaultBadge: {
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
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
  addressCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 12,
  },
  addressName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  addressLine: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  addressPhone: {
    color: '#8A8AAE',
    fontSize: 13,
    marginTop: 4,
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
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  orderItemVariation: {
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
    height: height * 0.7,
  },
  addMoneyContent: {
    paddingTop: 8,
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
});