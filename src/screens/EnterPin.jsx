import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EnterPin({ navigation }) {
  const [pin, setPin] = useState([]);
  const [error, setError] = useState(false);
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
        setTimeout(() => {
          navigation.navigate('PaymentSuccess');
        }, 400);
      }
    }
  };

  const handleDelete = () => {
    setError(false);
    if (pin.length > 0) setPin(pin.slice(0, -1));
  };

  const steps = ['Your Cart', 'Confirm', 'Enter PIN', 'Payment Done'];
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['fingerprint', '0', 'delete'],
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <View>
            <Text style={styles.logo}>MUNOLINK</Text>
            <Text style={styles.tagline}>Your partner, linked.</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#212121" />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
          <TouchableOpacity>
            <View style={styles.profilePic}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Steps */}
      <View style={styles.progressBar}>
        {steps.map((step, index) => (
          <View key={index} style={styles.progressStep}>
            <View style={[styles.progressDot, index === 2 && styles.progressDotActive, index < 2 && styles.progressDotDone]}>
              {index < 2 ? (
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              ) : (
                <Text style={[styles.progressDotText, index === 2 && styles.progressDotTextActive]}>{index + 1}</Text>
              )}
            </View>
            <Text style={[styles.progressLabel, index === 2 && styles.progressLabelActive]}>{step}</Text>
            {index < 3 && <View style={styles.progressLine} />}
          </View>
        ))}
      </View>

      {/* Title */}
      <Text style={styles.pageTitle}>Enter your Munolink PIN</Text>
      <Text style={styles.pageSubtitle}>Enter your 4-digit PIN to authorize this payment.</Text>

      {/* Security Banner */}
      <View style={styles.securityBanner}>
        <Ionicons name="shield-checkmark" size={16} color="#006B3F" />
        <Text style={styles.securityBannerText}>Your PIN is encrypted and this payment is secure.</Text>
      </View>

      {/* Payment Details Card */}
      <View style={styles.paymentCard}>
        <View style={styles.paymentRow}>
          <View>
            <Text style={styles.paymentLabel}>Shop</Text>
            <Text style={styles.paymentValue}>QuickMart</Text>
          </View>
          <View>
            <Text style={styles.paymentLabel}>Payment Code</Text>
            <Text style={styles.paymentCode}>ML 4839 20</Text>
          </View>
        </View>
        <View style={styles.paymentDivider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>UGX 8,400</Text>
        </View>
      </View>

      {/* PIN Indicators */}
      <Animated.View style={[styles.pinIndicators, { transform: [{ translateX: shakeAnim }] }]}>
        {[0, 1, 2, 3].map((index) => (
          <View key={index} style={[styles.pinBox, index < pin.length && styles.pinBoxFilled, error && styles.pinBoxError, index === pin.length && styles.pinBoxActive]}>
            {index < pin.length && <View style={styles.pinDot} />}
            {index === pin.length && <View style={styles.pinCursor} />}
          </View>
        ))}
      </Animated.View>

      {/* Forgot PIN */}
      <TouchableOpacity style={styles.forgotPin}>
        <Text style={styles.forgotPinText}>Forgot PIN?</Text>
      </TouchableOpacity>

      {/* Keypad */}
      <View style={styles.keypad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, colIndex) => {
              if (key === 'fingerprint') {
                return (
                  <TouchableOpacity key={`fp-${colIndex}`} style={styles.keyButton}>
                    <Ionicons name="finger-print" size={26} color="#006B3F" />
                  </TouchableOpacity>
                );
              }
              if (key === 'delete') {
                return (
                  <TouchableOpacity key={`del-${colIndex}`} style={styles.keyButton} onPress={handleDelete}>
                    <Ionicons name="backspace-outline" size={20} color="#888" />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity key={key} style={styles.keyButton} onPress={() => handlePress(key)}>
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.payNavButton}>
          <Ionicons name="card-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="pricetag-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Deals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={22} color="#888" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#006B3F',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 9,
    color: '#888',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIcon: { position: 'relative' },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D32F2F',
  },
  profilePic: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#006B3F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: { backgroundColor: '#006B3F' },
  progressDotDone: { backgroundColor: '#006B3F' },
  progressDotText: { fontSize: 10, fontWeight: '700', color: '#888' },
  progressDotTextActive: { color: '#FFFFFF' },
  progressLabel: { fontSize: 9, color: '#888', fontWeight: '500', marginLeft: 3 },
  progressLabelActive: { color: '#006B3F', fontWeight: '700' },
  progressLine: { width: 24, height: 1.5, backgroundColor: '#E0E0E0', marginHorizontal: 3 },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#212121',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 30,
    marginBottom: 10,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  securityBannerText: {
    fontSize: 11,
    color: '#006B3F',
    fontWeight: '500',
    flex: 1,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 1,
  },
  paymentValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212121',
    marginRight: 30,
  },
  paymentCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#006B3F',
    letterSpacing: 1,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#888',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#006B3F',
  },
  pinIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  pinBox: {
    width: 48,
    height: 52,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  pinBoxFilled: {
    borderColor: '#006B3F',
    backgroundColor: '#FFFFFF',
  },
  pinBoxActive: {
    borderColor: '#006B3F',
    borderWidth: 2.5,
  },
  pinBoxError: {
    borderColor: '#D32F2F',
    backgroundColor: '#FFF0F0',
  },
  pinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#006B3F',
  },
  pinCursor: {
    width: 2,
    height: 20,
    backgroundColor: '#006B3F',
    borderRadius: 1,
  },
  forgotPin: {
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPinText: {
    fontSize: 12,
    color: '#006B3F',
    fontWeight: '700',
  },
  keypad: {
    paddingHorizontal: 50,
    flex: 1,
    justifyContent: 'center',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  keyButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  keyText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#212121',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  navItem: {
    alignItems: 'center',
    gap: 2,
  },
  navLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
  },
  payNavButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#006B3F',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#006B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});