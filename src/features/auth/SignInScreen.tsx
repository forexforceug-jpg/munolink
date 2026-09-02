// src/features/auth/SignInScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const { width, height } = Dimensions.get('window');

// --- Main SignInScreen Component ---
const SignInContent = ({ navigation }: any) => {
  const { signInWithPhone } = useAuth();
  const { isDesktop } = useBreakpoint();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!phoneNumber || phoneNumber.length < 7) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = `+256${phoneNumber}`;
      console.log('📱 Attempting to sign in with:', fullPhone);
      
      // ✅ FIX: Wait for sign in to complete
      await signInWithPhone(fullPhone);
      
      console.log('✅ User signed in successfully');
      
      // ✅ Use replace to clear the navigation stack
      // The navigation happens after the state is updated
      navigation.replace('MainTabs');
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      Alert.alert('Error', error.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDesktop && styles.containerDesktop]} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Desktop Header */}
        {isDesktop && (
          <View style={styles.desktopHeader}>
            <Text style={styles.desktopHeaderTitle}>Welcome Back</Text>
            <Text style={styles.desktopHeaderSubtitle}>Sign in to continue your Munolink journey</Text>
          </View>
        )}

        {/* Mobile Header */}
        {!isDesktop && (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#1F2F5F" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sign In</Text>
            <View style={{ width: 24 }} />
          </View>
        )}

        <View style={[styles.content, isDesktop && styles.contentDesktop]}>
          {/* Mobile Title */}
          {!isDesktop && (
            <>
              <Text style={styles.title}>Welcome back!</Text>
              <Text style={styles.subtitle}>Sign in to continue your Munolink journey</Text>
            </>
          )}

          <View style={[styles.inputContainer, isDesktop && styles.inputContainerDesktop]}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.phoneInput}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+256</Text>
              </View>
              <TextInput
                style={styles.phoneInputField}
                placeholder="700 000 000"
                placeholderTextColor="#8A8AAE"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={9}
                autoFocus={!isDesktop}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#4A7DFF', '#6B94FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signInGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.joinButton}
            onPress={() => navigation.navigate('Join')}
          >
            <Text style={styles.joinText}>
              Don't have an account? <Text style={styles.joinLink}>Join Munolink</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- Main Component (Wrapped with ResponsiveLayout) ---
export const SignInScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  if (isDesktop) {
    return (
      <ResponsiveLayout 
        currentRoute="SignIn" 
        onNavigate={(route) => navigation?.navigate(route)}
        floatingActions={null}
        hideContextPanel={true}
        fullWidth={true}
      >
        <SignInContent navigation={navigation} />
      </ResponsiveLayout>
    );
  }

  return <SignInContent navigation={navigation} />;
};

const styles = StyleSheet.create({
  // ============================================================
  // DESKTOP STYLES
  // ============================================================
  containerDesktop: {
    backgroundColor: '#F8F9FC',
    padding: 24,
  },
  desktopHeader: {
    marginBottom: 16,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  desktopHeaderTitle: {
    color: '#1F2F5F',
    fontSize: 32,
    fontWeight: 'bold',
  },
  desktopHeaderSubtitle: {
    color: '#8A8AAE',
    fontSize: 16,
    marginTop: 4,
  },
  contentDesktop: {
    maxWidth: 450,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 0,
    paddingTop: 20,
  },
  inputContainerDesktop: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },

  // ============================================================
  // MOBILE STYLES
  // ============================================================
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    color: '#1F2F5F',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#8A8AAE',
    fontSize: 15,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  phoneInput: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    justifyContent: 'center',
  },
  countryCodeText: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: '500',
  },
  phoneInputField: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1F2F5F',
    fontSize: 16,
  },
  signInButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  signInButtonDisabled: {
    opacity: 0.5,
  },
  signInGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  joinButton: {
    alignItems: 'center',
  },
  joinText: {
    color: '#8A8AAE',
    fontSize: 14,
    textAlign: 'center',
  },
  joinLink: {
    color: '#4A7DFF',
    fontWeight: '500',
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotText: {
    color: '#8A8AAE',
    fontSize: 13,
  },
});