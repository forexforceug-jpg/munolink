import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CryptoJS from 'crypto-js';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function EnterPin({ navigation, route }) {
  const { user, login } = useAuth();
  const [pin, setPin] = useState([]);
  const [error, setError] = useState(false);
  const [processing, setProcessing] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const amount = route?.params?.amount || 0;
  const savings = route?.params?.savings || 0;
  const shopName = route?.params?.shopName || 'Shop';
  const type = route?.params?.type || 'order';
  const items = route?.params?.items || [];

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const verifyPinAndPay = async (enteredPin) => {
    setProcessing(true);

    try {
      const hashedPin = CryptoJS.SHA256(enteredPin).toString();

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('pin_hash, wallet_balance')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        Alert.alert('Error', 'Could not verify your account.');
        setProcessing(false);
        return;
      }

      if (hashedPin !== userData.pin_hash) {
        setError(true);
        shake();
        setPin([]);
        setProcessing(false);
        return;
      }

      const balance = Number(userData.wallet_balance || 0);
      if (balance < amount) {
        Alert.alert(
          'Insufficient Balance',
          `You need UGX ${amount.toLocaleString()} but your wallet has UGX ${balance.toLocaleString()}.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Top Up', onPress: () => { setPin([]); navigation.navigate('MyWallet'); } },
          ]
        );
        setPin([]);
        setProcessing(false);
        return;
      }

      const newBalance = balance - amount;
      const { error: updateError } = await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id);

      if (updateError) {
        Alert.alert('Error', 'Payment failed. Please try again.');
        setPin([]);
        setProcessing(false);
        return;
      }

      const reference = 'MUNO-' + Date.now().toString().slice(-8);
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: type,
        amount: amount,
        discount_applied: savings,
        status: 'completed',
        reference: reference,
      });

      login({ ...user, walletBalance: newBalance });

      const cleanItems = items.map(item => ({
        productName: item.productName || item.name || 'Item',
        quantity: item.quantity || 1,
        price: item.munolinkPrice || item.price || 0,
      }));

      setTimeout(() => {
        navigation.reset({
          index: 1,
          routes: [
            { name: 'Connections' },
            { name: 'PaymentSuccess', params: {
              amount: amount,
              savings: savings,
              orderId: reference,
              shopName: shopName,
              newBalance: newBalance,
              items: cleanItems,
            }},
          ],
        });
      }, 500);
    } catch (err) {
      console.error('Payment error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
    setProcessing(false);
  };

  const handlePress = (digit) => {
    setError(false);
    if (pin.length < 4) {
      const newPin = [...pin, digit];
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => verifyPinAndPay(newPin.join('')), 300);
      }
    }
  };

  const handleDelete = () => {
    setError(false);
    if (pin.length > 0) setPin(pin.slice(0, -1));
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['fp', '0', 'del'],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.logo}>MUNOLINK</Text>
          <Text style={styles.tagline}>For Better Connections</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#212121" />
          <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>5</Text></View>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.pageTitle}>Enter your Munolink PIN</Text>
        <Text style={styles.pageSubtitle}>Enter your 4-digit PIN to authorize this payment.</Text>

        <View style={styles.securityBanner}>
          <Ionicons name="shield-checkmark" size={16} color="#006B3F" />
          <Text style={styles.securityText}>Your PIN is encrypted and secure.</Text>
        </View>

        <View style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <View><Text style={styles.pLabel}>Shop</Text><Text style={styles.pValue}>{shopName}</Text></View>
            <View><Text style={styles.pLabel}>Amount</Text><Text style={styles.pValue}>UGX {amount.toLocaleString()}</Text></View>
          </View>
          {savings > 0 && (
            <View style={styles.savingsRow}>
              <Ionicons name="pricetag" size={14} color="#4CAF50" />
              <Text style={styles.savingsText}>You save UGX {savings.toLocaleString()}</Text>
            </View>
          )}
        </View>

        <Animated.View style={[styles.pinIndicators, { transform: [{ translateX: shakeAnim }] }]}>
          {[0, 1, 2, 3].map((index) => (
            <View key={index} style={[styles.pinBox, pin[index] !== undefined && styles.pinBoxFilled, error && styles.pinBoxError]}>
              {pin[index] !== undefined && <View style={styles.pinDot} />}
            </View>
          ))}
        </Animated.View>

        {processing && <ActivityIndicator size="small" color="#006B3F" style={{ marginBottom: 10 }} />}

        <View style={styles.keypad}>
          {keys.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key) => {
                if (key === 'fp') return (
                  <TouchableOpacity key="fp" style={styles.keyButton} disabled={processing}>
                    <Ionicons name="finger-print" size={26} color="#006B3F" />
                  </TouchableOpacity>
                );
                if (key === 'del') return (
                  <TouchableOpacity key="del" style={styles.keyButton} onPress={handleDelete} disabled={processing}>
                    <Ionicons name="backspace-outline" size={20} color="#888" />
                  </TouchableOpacity>
                );
                return (
                  <TouchableOpacity key={key} style={styles.keyButton} onPress={() => handlePress(key)} disabled={processing}>
                    <Text style={styles.keyText}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 8 },
  headerCenter: { alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 9, color: '#888' },
  headerIcon: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#212121', textAlign: 'center', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 16 },
  securityBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12, marginBottom: 16, gap: 8, width: '100%' },
  securityText: { fontSize: 12, color: '#006B3F', fontWeight: '500' },
  paymentCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 20, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  pLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  pValue: { fontSize: 14, fontWeight: '700', color: '#212121' },
  savingsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  savingsText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  pinIndicators: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 20 },
  pinBox: { width: 50, height: 54, borderRadius: 12, borderWidth: 2, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8F8' },
  pinBoxFilled: { borderColor: '#006B3F', backgroundColor: '#FFFFFF' },
  pinBoxError: { borderColor: '#D32F2F', backgroundColor: '#FFF0F0' },
  pinDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#006B3F' },
  keypad: { width: '100%', paddingHorizontal: 40 },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  keyButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8F8F8', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ECECEC' },
  keyText: { fontSize: 24, fontWeight: '600', color: '#212121' },
});