import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CryptoJS from 'crypto-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function EnterSignInPin({ navigation, route }) {
  const phoneNumber = route?.params?.phoneNumber;
  const fullName = route?.params?.fullName;
  const role = route?.params?.role || 'customer';
  const { login } = useAuth();

  const [pin, setPin] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = (digit) => {
    setError(false);
    if (pin.length < 4) {
      const newPin = [...pin, digit];
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin.join(''));
      }
    }
  };

  const verifyPin = async (enteredPin) => {
    setLoading(true);

    const hashedPin = CryptoJS.SHA256(enteredPin).toString();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('pin_hash', hashedPin)
      .single();

    setLoading(false);

    if (error || !user) {
      setError(true);
      shake();
      setPin([]);
      return;
    }

    // Store user in context
    login({
      id: user.id,
      phoneNumber: user.phone_number,
      fullName: user.full_name || fullName,
      walletBalance: user.wallet_balance,
      lifetimeSavings: user.lifetime_savings,
      role: user.role || role,
    });

    // Route based on role from database
    const userRole = user.role || role;

    if (userRole === 'shop_owner') {
      navigation.replace('ShopOwnerDashboard');
    } else if (userRole === 'service_provider') {
      navigation.replace('ServiceProviderDashboard');
    } else {
      navigation.replace('Connections', {
        phoneNumber: phoneNumber,
        firstName: user.full_name || fullName,
      });
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
    ['', '0', 'delete'],
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#212121" />
      </TouchableOpacity>

      <View style={styles.shieldCircle}>
        <Ionicons name="lock-closed" size={40} color="#006B3F" />
      </View>

      <Text style={styles.heading}>Enter your PIN</Text>
      <Text style={styles.subtitle}>Welcome back, {fullName || 'User'}</Text>

      {error && <Text style={styles.errorText}>Incorrect PIN. Please try again.</Text>}
      {loading && <Text style={styles.loadingText}>Verifying...</Text>}

      <Animated.View style={[styles.pinDots, { transform: [{ translateX: shakeAnim }] }]}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled, error && styles.dotError]} />
        ))}
      </Animated.View>

      <TouchableOpacity style={styles.forgotPin}>
        <Text style={styles.forgotPinText}>Forgot PIN?</Text>
      </TouchableOpacity>

      <View style={styles.keypad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((key, colIndex) => {
              if (key === '') return <View key={`empty-${colIndex}`} style={styles.key} />;
              if (key === 'delete') {
                return (
                  <TouchableOpacity key={`del-${colIndex}`} style={styles.key} onPress={handleDelete} activeOpacity={0.5} disabled={loading}>
                    <Ionicons name="backspace-outline" size={24} color="#888" />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity key={key} style={styles.key} onPress={() => handlePress(key)} activeOpacity={0.5} disabled={loading}>
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', paddingHorizontal: 24 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  shieldCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginTop: 90, marginBottom: 28 },
  heading: { fontSize: 24, fontWeight: '800', color: '#212121', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888888', textAlign: 'center', marginBottom: 6 },
  errorText: { fontSize: 13, color: '#D32F2F', fontWeight: '600', marginBottom: 6 },
  loadingText: { fontSize: 13, color: '#006B3F', fontWeight: '600', marginBottom: 6 },
  pinDots: { flexDirection: 'row', gap: 16, marginTop: 28, marginBottom: 12 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#D0D0D0', backgroundColor: '#FFFFFF' },
  dotFilled: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  dotError: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  forgotPin: { marginBottom: 40 },
  forgotPinText: { fontSize: 14, color: '#006B3F', fontWeight: '700' },
  keypad: { width: '100%', alignItems: 'center', paddingHorizontal: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 14 },
  key: { width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  keyText: { fontSize: 26, fontWeight: '600', color: '#212121' },
});