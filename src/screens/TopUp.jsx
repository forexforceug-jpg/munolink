import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function TopUp({ navigation }) {
  const { user, login } = useAuth();
  const [amount, setAmount] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(false);

  const quickAmounts = [5000, 10000, 20000, 50000, 100000];

  const handleTopUp = async () => {
    if (amount < 5000) {
      Alert.alert('Invalid Amount', 'Minimum top-up is UGX 5,000.');
      return;
    }

    if (!selectedMethod) {
      Alert.alert('Select Method', 'Please select a payment method.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.functions.invoke('topup-wallet', {
      body: {
        user_id: user.id,
        amount: amount,
        method: selectedMethod,
      },
    });

    setLoading(false);

    if (error || !data?.success) {
      Alert.alert('Top-Up Failed', data?.error || 'Something went wrong.');
      return;
    }

    // Update context with new balance
    login({
      ...user,
      walletBalance: data.new_balance,
    });

    Alert.alert(
      'Top-Up Successful',
      `UGX ${amount.toLocaleString()} has been added to your wallet.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Up Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            UGX {(user?.walletBalance || 0).toLocaleString()}
          </Text>
        </View>

        {/* Amount Input */}
        <Text style={styles.sectionTitle}>Enter Amount</Text>
        <View style={styles.amountDisplay}>
          <Text style={styles.currencySymbol}>UGX</Text>
          <Text style={styles.amountText}>{amount.toLocaleString()}</Text>
        </View>

        {/* Quick Amounts */}
        <View style={styles.quickAmounts}>
          {quickAmounts.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[styles.quickAmtBtn, amount === amt && styles.quickAmtBtnActive]}
              onPress={() => setAmount(amt)}
            >
              <Text style={[styles.quickAmtText, amount === amt && styles.quickAmtTextActive]}>
                UGX {amt.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Amount */}
        <View style={styles.customAmount}>
          {[1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000].map((val) => (
            <TouchableOpacity
              key={val}
              style={styles.customAmtBtn}
              onPress={() => setAmount((prev) => prev + val)}
            >
              <Text style={styles.customAmtText}>+{val.toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Method */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <TouchableOpacity
          style={[styles.methodCard, selectedMethod === 'mtn' && styles.methodCardActive]}
          onPress={() => setSelectedMethod('mtn')}
        >
          <View style={styles.methodLeft}>
            <View style={[styles.methodIcon, { backgroundColor: '#FFC107' }]}>
              <Text style={styles.methodIconText}>MTN</Text>
            </View>
            <View>
              <Text style={styles.methodName}>MTN Mobile Money</Text>
              <Text style={styles.methodDesc}>Pay using MTN MoMo</Text>
            </View>
          </View>
          <View style={[styles.radio, selectedMethod === 'mtn' && styles.radioActive]}>
            {selectedMethod === 'mtn' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodCard, selectedMethod === 'airtel' && styles.methodCardActive]}
          onPress={() => setSelectedMethod('airtel')}
        >
          <View style={styles.methodLeft}>
            <View style={[styles.methodIcon, { backgroundColor: '#D32F2F' }]}>
              <Text style={[styles.methodIconText, { color: '#FFFFFF' }]}>A</Text>
            </View>
            <View>
              <Text style={styles.methodName}>Airtel Money</Text>
              <Text style={styles.methodDesc}>Pay using Airtel Money</Text>
            </View>
          </View>
          <View style={[styles.radio, selectedMethod === 'airtel' && styles.radioActive]}>
            {selectedMethod === 'airtel' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        {/* Top Up Button */}
        <TouchableOpacity
          style={[styles.topUpBtn, loading && styles.buttonDisabled]}
          onPress={handleTopUp}
          disabled={loading}
        >
          <Text style={styles.topUpBtnText}>
            {loading ? 'Processing...' : `Top Up UGX ${amount.toLocaleString()}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#212121' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  balanceCard: {
    backgroundColor: '#006B3F', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 24,
  },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  balanceAmount: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#555', marginBottom: 10 },
  amountDisplay: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 16, padding: 20, marginBottom: 16, gap: 4,
  },
  currencySymbol: { fontSize: 20, color: '#888', fontWeight: '600' },
  amountText: { fontSize: 40, fontWeight: '800', color: '#006B3F' },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  quickAmtBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#ECECEC',
  },
  quickAmtBtnActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  quickAmtText: { fontSize: 13, fontWeight: '600', color: '#555' },
  quickAmtTextActive: { color: '#FFFFFF' },
  customAmount: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 24 },
  customAmtBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
    backgroundColor: '#F5F5F5',
  },
  customAmtText: { fontSize: 11, fontWeight: '600', color: '#006B3F' },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8F8F8', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 2, borderColor: '#ECECEC',
  },
  methodCardActive: { borderColor: '#006B3F', backgroundColor: '#FAFFFA' },
  methodLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  methodIcon: {
    width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  methodIconText: { fontSize: 18, fontWeight: '800', color: '#212121' },
  methodName: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 2 },
  methodDesc: { fontSize: 11, color: '#888' },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: '#006B3F' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#006B3F' },
  topUpBtn: {
    backgroundColor: '#006B3F', paddingVertical: 16, borderRadius: 30,
    alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  topUpBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});