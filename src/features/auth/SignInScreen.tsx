// src/features/auth/SignInScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const COLORS = {
  bg: '#0D0D1A',
  bgInput: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.08)',
  textPrimary: '#FFFFFF',
  textSecondary: '#8A8AAE',
  textMuted: '#6A7A9E',
  accent: '#4A7DFF',
  accentSoft: 'rgba(74,125,255,0.15)',
  error: '#E74C3C',
};

type SignInMethod = 'phone' | 'email';

const SignInContent = ({ navigation }: any) => {
  const { signInWithPhone, signInWithEmail } = useAuth();
  const { isDesktop } = useBreakpoint();

  const [method, setMethod] = useState<SignInMethod>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (method === 'phone') {
      if (phoneNumber.length < 7) {
        Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
        return;
      }
      setIsLoading(true);
      try {
        await signInWithPhone(`+256${phoneNumber}`);
        navigation.replace('MainTabs');
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to sign in.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      navigation.replace('MainTabs');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, isDesktop && styles.containerDesktop]}
      edges={['top']}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {!isDesktop && (
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sign In</Text>
            <View style={{ width: 24 }} />
          </View>
        )}

        <ScrollView
          contentContainerStyle={[
            styles.content,
            isDesktop && styles.contentDesktop,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.welcomeIconContainer}>
            <LinearGradient
              colors={['#4A7DFF', '#6B94FF']}
              style={styles.welcomeIconGradient}
            >
              <Ionicons name="log-in-outline" size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your Munolink journey
          </Text>

          <View style={styles.methodToggle}>
            <TouchableOpacity
              style={[
                styles.methodOption,
                method === 'phone' && styles.methodOptionActive,
              ]}
              onPress={() => setMethod('phone')}
            >
              <Ionicons
                name="call-outline"
                size={16}
                color={method === 'phone' ? COLORS.textPrimary : COLORS.textSecondary}
              />
              <Text
                style={[styles.methodText, method === 'phone' && styles.methodTextActive]}
              >
                Phone
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.methodOption,
                method === 'email' && styles.methodOptionActive,
              ]}
              onPress={() => setMethod('email')}
            >
              <Ionicons
                name="mail-outline"
                size={16}
                color={method === 'email' ? COLORS.textPrimary : COLORS.textSecondary}
              />
              <Text
                style={[styles.methodText, method === 'email' && styles.methodTextActive]}
              >
                Email
              </Text>
            </TouchableOpacity>
          </View>

          {method === 'phone' ? (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.phoneInput}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+256</Text>
                </View>
                <TextInput
                  style={styles.phoneInputField}
                  placeholder="700 000 000"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  maxLength={9}
                  autoFocus={!isDesktop}
                />
              </View>
            </View>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordInput}>
                  <TextInput
                    style={styles.passwordField}
                    placeholder="Your password"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={styles.eyeButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading}
            activeOpacity={0.85}
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
              Don't have an account?{' '}
              <Text style={styles.joinLink}>Join Munolink</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
  container: { flex: 1, backgroundColor: COLORS.bg },
  containerDesktop: { backgroundColor: COLORS.bg, padding: 24 },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 },
  contentDesktop: {
    maxWidth: 450,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 0,
  },
  welcomeIconContainer: { alignItems: 'center', marginBottom: 20 },
  welcomeIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginBottom: 24,
    textAlign: 'center',
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  methodOption: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  methodOptionActive: {
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(74,125,255,0.4)',
  },
  methodText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },
  methodTextActive: { color: COLORS.textPrimary },
  inputContainer: { marginBottom: 16 },
  inputLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  phoneInput: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.accentSoft,
    justifyContent: 'center',
  },
  countryCodeText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '500' },
  phoneInputField: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordField: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  eyeButton: { paddingHorizontal: 14 },
  signInButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  signInButtonDisabled: { opacity: 0.45, shadowOpacity: 0, elevation: 0 },
  signInGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  signInButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  joinButton: { alignItems: 'center', paddingVertical: 4 },
  joinText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center' },
  joinLink: { color: COLORS.accent, fontWeight: '500' },
});