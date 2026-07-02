import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function PhoneLogin({ navigation, route }) {
  const role = route?.params?.role || 'customer';
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (phoneNumber.length < 9) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number.');
      return;
    }

    setLoading(true);

    const formattedPhone = '+256' + phoneNumber.replace(/^0+/, '');

    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    navigation.navigate('OTPVerification', {
      phoneNumber: formattedPhone,
      role: role,
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#212121" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.heading}>
            Welcome to{' '}
            <Text style={styles.highlight}>Munolink</Text>
          </Text>
          <Text style={styles.subtitle}>Let's get you started.</Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Phone Number</Text>

          <View style={styles.phoneInputContainer}>
            <View style={styles.countrySelector}>
              <Text style={styles.countryText}>UG</Text>
              <Text style={styles.countryCode}>+256</Text>
              <Ionicons name="chevron-down" size={16} color="#888" />
            </View>

            <View style={styles.phoneDivider} />

            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholder="700 123 456"
              placeholderTextColor="#CCCCCC"
              maxLength={10}
            />
          </View>

          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={14} color="#006B3F" />
            <Text style={styles.securityText}>
              We'll send you a verification code.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.sendCodeButton, loading && styles.buttonDisabled]}
          onPress={handleSendCode}
          disabled={loading}
        >
          <Text style={styles.sendCodeText}>
            {loading ? 'Sending...' : 'Send Code'}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerSection}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => Alert.alert('Coming Soon', 'Google sign in will be available soon.')}
          >
            <Ionicons name="logo-google" size={22} color="#212121" />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => Alert.alert('Coming Soon', 'Facebook sign in will be available soon.')}
          >
            <Ionicons name="logo-facebook" size={22} color="#1877F2" />
            <Text style={styles.socialText}>Facebook</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomLink}>
          <Text style={styles.bottomText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 8,
  },
  highlight: {
    color: '#006B3F',
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '400',
  },
  inputSection: {
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555555',
    marginBottom: 10,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 4,
    height: 60,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  countryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
  },
  countryCode: {
    fontSize: 15,
    color: '#888888',
    fontWeight: '500',
  },
  phoneDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E0E0E0',
  },
  phoneInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: '#212121',
    paddingHorizontal: 12,
    height: '100%',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingLeft: 4,
    gap: 6,
  },
  securityText: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '400',
  },
  sendCodeButton: {
    backgroundColor: '#006B3F',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sendCodeText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dividerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 13,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  socialText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  bottomLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 14,
    color: '#888888',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006B3F',
  },
});