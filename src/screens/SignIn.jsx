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

export default function SignIn({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (phoneNumber.length < 9) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number.');
      return;
    }

    setLoading(true);

    const formattedPhone = '+256' + phoneNumber.replace(/^0+/, '');

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', formattedPhone)
      .single();

    setLoading(false);

    if (error || !user) {
      Alert.alert(
        'Account Not Found',
        'No account found with this number. Please sign up first.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Up',
            onPress: () => navigation.navigate('PhoneLogin'),
          },
        ]
      );
      return;
    }

    // Pass role along with user data
    navigation.navigate('EnterSignInPin', {
      phoneNumber: formattedPhone,
      fullName: user.full_name,
      role: user.role || 'customer',
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
            Welcome back to{' '}
            <Text style={styles.highlight}>Munolink</Text>
          </Text>
          <Text style={styles.subtitle}>Sign in to your account.</Text>
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
        </View>

        <TouchableOpacity
          style={[styles.signInButton, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          <Text style={styles.signInText}>
            {loading ? 'Checking...' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.dividerSection}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.signUpLink}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('PhoneLogin')}>
            <Text style={styles.signUpLinkText}>Sign Up</Text>
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
  signInButton: {
    backgroundColor: '#006B3F',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    marginBottom: 28,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signInText: {
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
  signUpLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#888888',
  },
  signUpLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006B3F',
  },
});