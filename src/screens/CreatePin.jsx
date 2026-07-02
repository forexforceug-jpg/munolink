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

export default function CreatePin({ navigation, route }) {
  const phoneNumber = route?.params?.phoneNumber;
  const role = route?.params?.role || 'customer';
  const { login } = useAuth();

  const [pin, setPin] = useState([]);
  const [step, setStep] = useState('create');
  const [firstPin, setFirstPin] = useState([]);
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
        if (step === 'create') {
          setTimeout(() => {
            setFirstPin(newPin);
            setPin([]);
            setStep('confirm');
          }, 300);
        } else {
          if (newPin.join('') === firstPin.join('')) {
            savePinToDatabase(newPin.join(''));
          } else {
            setError(true);
            shake();
            setTimeout(() => setPin([]), 400);
          }
        }
      }
    }
  };

  const savePinToDatabase = async (pinCode) => {
    setLoading(true);

    const hashedPin = CryptoJS.SHA256(pinCode).toString();

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    let error;

    if (existingUser) {
      const result = await supabase
        .from('users')
        .update({ pin_hash: hashedPin, role: role })
        .eq('phone_number', phoneNumber);
      error = result.error;
    } else {
      const result = await supabase
        .from('users')
        .insert({
          phone_number: phoneNumber,
          pin_hash: hashedPin,
          wallet_balance: 20000,
          lifetime_savings: 0,
          role: role,
        });
      error = result.error;
    }

    if (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to save PIN: ' + error.message);
      return;
    }

    // Get the saved user and store in context
    const { data: savedUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (savedUser) {
      login({
        id: savedUser.id,
        phoneNumber: savedUser.phone_number,
        fullName: savedUser.full_name,
        walletBalance: savedUser.wallet_balance,
        lifetimeSavings: savedUser.lifetime_savings,
        role: savedUser.role,
      });
    }

    setLoading(false);

    // Route based on role
    if (role === 'customer') {
      navigation.navigate('Personalization', { phoneNumber, role });
    } else if (role === 'shop_owner') {
      navigation.navigate('Personalization', { phoneNumber, role });
    } else if (role === 'service_provider') {
      navigation.navigate('Personalization', { phoneNumber, role });
    }
  };

  const handleDelete = () => {
    setError(false);
    if (pin.length > 0) setPin(pin.slice(0, -1));
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('create');
      setPin([]);
      setFirstPin([]);
      setError(false);
    } else {
      navigation.goBack();
    }
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color="#212121" />
      </TouchableOpacity>

      <View style={styles.shieldCircle}>
        <Ionicons name="shield-checkmark" size={40} color="#006B3F" />
      </View>

      <Text style={styles.heading}>
        {step === 'create' ? 'Create your 4-digit PIN' : 'Confirm your PIN'}
      </Text>

      <Text style={styles.subtitle}>
        {step === 'create'
          ? "You'll use this PIN to login and authorize payments."
          : 'Enter the same PIN again to confirm.'}
      </Text>

      {error && (
        <Text style={styles.errorText}>PINs don't match. Try again.</Text>
      )}

      {loading && (
        <Text style={styles.loadingText}>Saving your PIN...</Text>
      )}

      <Animated.View style={[styles.pinDots, { transform: [{ translateX: shakeAnim }] }]}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < pin.length && styles.dotFilled,
              error && styles.dotError,
            ]}
          />
        ))}
      </Animated.View>

      <View style={styles.keypad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((key, colIndex) => {
              if (key === '') {
                return <View key={`empty-${colIndex}`} style={styles.key} />;
              }
              if (key === 'delete') {
                return (
                  <TouchableOpacity
                    key={`del-${colIndex}`}
                    style={styles.key}
                    onPress={handleDelete}
                    activeOpacity={0.5}
                    disabled={loading}
                  >
                    <Ionicons name="backspace-outline" size={24} color="#888" />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.key}
                  onPress={() => handlePress(key)}
                  activeOpacity={0.5}
                  disabled={loading}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <TouchableOpacity style={styles.fingerprintButton} activeOpacity={0.5}>
          <Ionicons name="finger-print" size={28} color="#006B3F" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 90,
    marginBottom: 28,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#D32F2F',
    fontWeight: '600',
    marginBottom: 6,
  },
  loadingText: {
    fontSize: 13,
    color: '#006B3F',
    fontWeight: '600',
    marginBottom: 6,
  },
  pinDots: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 28,
    marginBottom: 56,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    backgroundColor: '#FFFFFF',
  },
  dotFilled: {
    backgroundColor: '#006B3F',
    borderColor: '#006B3F',
  },
  dotError: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  keypad: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 14,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  keyText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#212121',
  },
  fingerprintButton: {
    marginTop: 8,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});