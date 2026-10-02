// src/features/auth/ForgotPasswordScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
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

type ResetMethod = 'email' | 'phone';
type Step = 'method' | 'input' | 'otp' | 'newPassword';

const ForgotPasswordContent = ({ navigation }: any) => {
  const {
    requestPasswordReset,
    verifyPasswordResetOtp,
    updatePassword,
    requestPhonePasswordReset,
    verifyPhonePasswordResetOtp,
  } = useAuth();
  const { isDesktop } = useBreakpoint();

  const [method, setMethod] = useState<ResetMethod>('email');
  const [step, setStep] = useState<Step>('input');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpFocused, setOtpFocused] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpInputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputs.current[0]?.focus(), 300);
    }
  }, [step]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const isEmailValid = /\S+@\S+\.\S+/.test(email.trim());
  const isPhoneValid = phoneNumber.replace(/\D/g, '').length >= 9;
  const isPasswordValid = newPassword.length >= 6;
  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const displayTarget =
    method === 'email'
      ? email.trim().toLowerCase()
      : `+256 ${phoneNumber.trim()}`;

  // ------------------------------------------------------------
  // Step 1 — request reset
  // ------------------------------------------------------------
  const handleRequestReset = async () => {
    if (method === 'email') {
      if (!isEmailValid) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return;
      }
    } else {
      if (!isPhoneValid) {
        Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (method === 'email') {
        await requestPasswordReset(email.trim().toLowerCase());
      } else {
        await requestPhonePasswordReset(phoneNumber.trim());
      }
      setStep('otp');
      setResendTimer(60);
    } catch (e: any) {
      Alert.alert(
        'Could not send code',
        e?.message || 'Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Step 2 — verify OTP
  // ------------------------------------------------------------
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code.');
      return;
    }

    setIsLoading(true);
    try {
      if (method === 'email') {
        await verifyPasswordResetOtp(email.trim().toLowerCase(), code);
      } else {
        await verifyPhonePasswordResetOtp(phoneNumber.trim(), code);
      }
      setStep('newPassword');
    } catch (e: any) {
      Alert.alert(
        'Verification failed',
        e?.message || 'Invalid or expired code. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setResendTimer(60);
    try {
      if (method === 'email') {
        await requestPasswordReset(email.trim().toLowerCase());
      } else {
        await requestPhonePasswordReset(phoneNumber.trim());
      }
      Alert.alert('Sent', 'A new code has been sent.');
    } catch (e: any) {
      Alert.alert('Could not resend', e?.message || 'Please try again.');
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const next = [...otp];
    next[index] = text;
    setOtp(next);
    if (text && index < 5) {
      otpInputs.current[index + 1]?.focus();
      setOtpFocused(index + 1);
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
      setOtpFocused(index - 1);
    }
  };

  // ------------------------------------------------------------
  // Step 3 — update password
  // ------------------------------------------------------------
  const handleUpdatePassword = async () => {
    if (!isPasswordValid) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (!passwordsMatch) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(newPassword);
      Alert.alert(
        'Password Updated',
        'Your password has been changed. Please sign in with your new password.',
        [
          {
            text: 'Sign In',
            onPress: () => navigation.replace('SignIn'),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert(
        'Could not update password',
        e?.message || 'Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------------------
  // RENDER — METHOD SELECTOR
  // ------------------------------------------------------------
  const renderMethodToggle = () => (
    <View style={styles.methodToggle}>
      <TouchableOpacity
        style={[
          styles.methodOption,
          method === 'email' && styles.methodOptionActive,
        ]}
        onPress={() => setMethod('email')}
        disabled={step !== 'input'}
      >
        <Ionicons
          name="mail-outline"
          size={16}
          color={method === 'email' ? COLORS.textPrimary : COLORS.textSecondary}
        />
        <Text
          style={[
            styles.methodText,
            method === 'email' && styles.methodTextActive,
          ]}
        >
          Email
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.methodOption,
          method === 'phone' && styles.methodOptionActive,
        ]}
        onPress={() => setMethod('phone')}
        disabled={step !== 'input'}
      >
        <Ionicons
          name="call-outline"
          size={16}
          color={method === 'phone' ? COLORS.textPrimary : COLORS.textSecondary}
        />
        <Text
          style={[
            styles.methodText,
            method === 'phone' && styles.methodTextActive,
          ]}
        >
          Phone
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ------------------------------------------------------------
  // RENDER — STEP 1 (input)
  // ------------------------------------------------------------
  const renderInputStep = () => (
    <>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          style={styles.iconGradient}
        >
          <Ionicons name="lock-open-outline" size={32} color="#FFFFFF" />
        </LinearGradient>
      </View>
      <Text style={styles.title}>Reset your password</Text>
      <Text style={styles.subtitle}>
        Choose how you'd like to receive your verification code.
      </Text>

      {renderMethodToggle()}

      {method === 'email' ? (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={[styles.input, isEmailValid && email && styles.inputFilled]}
            placeholder="your@email.com"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            returnKeyType="done"
            onSubmitEditing={handleRequestReset}
          />
        </View>
      ) : (
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
              returnKeyType="done"
              onSubmitEditing={handleRequestReset}
            />
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (isLoading ||
            (method === 'email' ? !isEmailValid : !isPhoneValid)) &&
            styles.primaryButtonDisabled,
        ]}
        onPress={handleRequestReset}
        disabled={
          isLoading || (method === 'email' ? !isEmailValid : !isPhoneValid)
        }
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryGradient}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>Send Reset Code</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  // ------------------------------------------------------------
  // RENDER — STEP 2 (OTP)
  // ------------------------------------------------------------
  const renderOtpStep = () => (
    <>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          style={styles.iconGradient}
        >
          <Text style={styles.iconEmoji}>🔐</Text>
        </LinearGradient>
      </View>
      <Text style={styles.title}>Enter the code</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to{' '}
        <Text style={styles.highlightText}>{displayTarget}</Text>
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) otpInputs.current[index] = ref;
            }}
            style={[
              styles.otpInput,
              otpFocused === index && styles.otpInputFocused,
            ]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(t) => handleOtpChange(t, index)}
            onKeyPress={(e) => handleOtpKeyPress(e, index)}
            onFocus={() => setOtpFocused(index)}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (isLoading || otp.join('').length < 6) && styles.primaryButtonDisabled,
        ]}
        onPress={handleVerifyOtp}
        disabled={isLoading || otp.join('').length < 6}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryGradient}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>Verify Code</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={handleResendOtp}
        disabled={resendTimer > 0}
      >
        <Text
          style={[styles.linkText, resendTimer > 0 && styles.linkTextDisabled]}
        >
          {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('input')}
      >
        <Ionicons name="arrow-back" size={16} color={COLORS.textSecondary} />
        <Text style={styles.backText}>Change {method}</Text>
      </TouchableOpacity>
    </>
  );

  // ------------------------------------------------------------
  // RENDER — STEP 3 (new password)
  // ------------------------------------------------------------
  const renderPasswordStep = () => (
    <>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          style={styles.iconGradient}
        >
          <Ionicons name="key-outline" size={32} color="#FFFFFF" />
        </LinearGradient>
      </View>
      <Text style={styles.title}>Set a new password</Text>
      <Text style={styles.subtitle}>
        Choose a new password for your account. Use at least 6 characters.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>New Password</Text>
        <View style={styles.passwordInput}>
          <TextInput
            style={styles.passwordField}
            placeholder="At least 6 characters"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            value={newPassword}
            onChangeText={setNewPassword}
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

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Confirm New Password</Text>
        <View style={styles.passwordInput}>
          <TextInput
            style={styles.passwordField}
            placeholder="Re-enter password"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirm((v) => !v)}
            style={styles.eyeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {confirmPassword.length > 0 && !passwordsMatch && (
          <Text style={styles.inputError}>Passwords do not match</Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (isLoading || !isPasswordValid || !passwordsMatch) &&
            styles.primaryButtonDisabled,
        ]}
        onPress={handleUpdatePassword}
        disabled={isLoading || !isPasswordValid || !passwordsMatch}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryGradient}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>Update Password</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

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
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reset Password</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            isDesktop && styles.contentDesktop,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'input' && renderInputStep()}
          {step === 'otp' && renderOtpStep()}
          {step === 'newPassword' && renderPasswordStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  if (isDesktop) {
    return (
      <ResponsiveLayout
        currentRoute="ForgotPassword"
        onNavigate={(route) => navigation?.navigate(route)}
        floatingActions={null}
        hideContextPanel={true}
        fullWidth={true}
      >
        <ForgotPasswordContent navigation={navigation} />
      </ResponsiveLayout>
    );
  }

  return <ForgotPasswordContent navigation={navigation} />;
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  contentDesktop: {
    maxWidth: 450,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 0,
  },

  iconContainer: { alignItems: 'center', marginBottom: 20 },
  iconGradient: {
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
  iconEmoji: { fontSize: 32 },

  title: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  highlightText: { color: COLORS.accent, fontWeight: '600' },

  methodToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
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
  inputFilled: { borderColor: COLORS.accent },
  inputError: { color: COLORS.error, fontSize: 12, marginTop: 4 },

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

  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonDisabled: { opacity: 0.45, shadowOpacity: 0, elevation: 0 },
  primaryGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  otpInput: {
    width: 44,
    height: 54,
    backgroundColor: COLORS.bgInput,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  otpInputFocused: {
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(74,125,255,0.08)',
  },

  linkButton: { alignItems: 'center', marginTop: 4, marginBottom: 8 },
  linkText: { color: COLORS.accent, fontSize: 14, fontWeight: '500' },
  linkTextDisabled: { color: COLORS.textSecondary },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
  backText: { color: COLORS.textSecondary, fontSize: 14 },
});